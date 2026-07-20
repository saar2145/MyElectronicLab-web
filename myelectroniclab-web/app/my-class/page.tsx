// Version: 1.0
// Title: My Class Page | Important Data: this is the direct destination for
// "הכיתה שלי" in UserMenu (once a student has joined a class) - separate from
// /my-project (personal milestones only) and /join-class (pure join form).
// If the student is in multiple classes, a selector switches between them.
// Task checkboxes write to assignment_completions (shared class assignments)
// or call toggle_task_completion() RPC (personal tasks from personal_notes) -
// never a direct UPDATE on personal_notes, see the SQL migration's comment on
// why. Chat messages from the mentor are labeled with the mentor's actual
// name (fetched via the new profiles_select_mentor_by_student RLS policy),
// not the generic "הודעה" from before.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

type ClassInfo = { id: string; class_name: string; description: string; mentor_id: string };
type Assignment = { id: string; title: string; description: string; due_date: string | null };
type Note = {
  id: string;
  note_type: 'note' | 'message' | 'task';
  content: string;
  due_date: string | null;
  created_at: string;
  sender: 'mentor' | 'student';
  completed: boolean;
};

export default function MyClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [mentorNames, setMentorNames] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Note[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [section, setSection] = useState<'tasks' | 'messages'>('tasks');

  async function loadClasses() {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data: classRows } = await supabase.from('mentor_classes').select('id, class_name, description, mentor_id');
    if (!classRows || classRows.length === 0) {
      router.push('/join-class');
      return;
    }
    setClasses(classRows);

    const mentorIds = Array.from(new Set(classRows.map((c) => c.mentor_id)));
    const { data: mentorProfiles } = await supabase.from('profiles').select('id, full_name').in('id', mentorIds);
    const nameMap: Record<string, string> = {};
    (mentorProfiles ?? []).forEach((m) => (nameMap[m.id] = m.full_name));
    setMentorNames(nameMap);

    setSelectedId((prev) => prev || classRows[0].id);
    setLoading(false);
  }

  async function loadClassContent(classId: string, studentId: string) {
    const supabase = getSupabaseAuthClient();

    const { data: assignmentRows } = await supabase
      .from('class_assignments')
      .select('id, title, description, due_date')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    setAssignments(assignmentRows ?? []);

    const { data: completions } = await supabase
      .from('assignment_completions')
      .select('assignment_id')
      .eq('student_id', studentId);
    setCompletedAssignmentIds(new Set((completions ?? []).map((c) => c.assignment_id)));

    const { data: noteRows } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at, sender, completed')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('created_at', { ascending: true });
    setNotes(noteRows ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const supabase = getSupabaseAuthClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadClassContent(selectedId, data.user.id);
    });
  }, [selectedId]);

  async function toggleAssignment(assignmentId: string) {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const isDone = completedAssignmentIds.has(assignmentId);
    if (isDone) {
      await supabase.from('assignment_completions').delete().eq('assignment_id', assignmentId).eq('student_id', userData.user.id);
      setCompletedAssignmentIds((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    } else {
      await supabase.from('assignment_completions').insert({ assignment_id: assignmentId, student_id: userData.user.id });
      setCompletedAssignmentIds((prev) => new Set(prev).add(assignmentId));
    }
  }

  async function toggleTask(noteId: string, current: boolean) {
    const supabase = getSupabaseAuthClient();
    await supabase.rpc('toggle_task_completion', { p_note_id: noteId, p_completed: !current });
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, completed: !current } : n)));
  }

  async function sendMessage() {
    const cls = classes.find((c) => c.id === selectedId);
    if (!messageText.trim() || !cls) return;
    setSending(true);
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from('personal_notes').insert({
        mentor_id: cls.mentor_id,
        student_id: userData.user.id,
        class_id: cls.id,
        note_type: 'message',
        content: messageText.trim(),
        sender: 'student',
      });
      if (!error) {
        setMessageText('');
        await loadClassContent(cls.id, userData.user.id);
      }
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  const cls = classes.find((c) => c.id === selectedId);
  if (!cls) return null;

  const personalTasks = notes.filter((n) => n.note_type === 'task');
  const chatItems = notes.filter((n) => n.note_type !== 'task');

  return (
    <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <div className="mb-4 rounded-2xl bg-brand-cardbg p-6 text-right shadow-lg">
          {classes.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mb-3 rounded-lg border border-brand-category bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          )}
          <h1 className="text-2xl font-bold text-brand-text">{cls.class_name}</h1>
          <p className="mt-1 text-sm text-brand-textsoft">מנחה: {mentorNames[cls.mentor_id] ?? '—'}</p>
          {cls.description && <p className="mt-3 text-sm text-brand-text">{cls.description}</p>}
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSection('tasks')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${section === 'tasks' ? 'bg-brand-name text-brand-text' : 'bg-brand-cardbg text-brand-textsoft'}`}
          >
            <Icon icon="solar:checklist-minimalistic-bold" width={16} />
            מטלות
          </button>
          <button
            onClick={() => setSection('messages')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${section === 'messages' ? 'bg-brand-name text-brand-text' : 'bg-brand-cardbg text-brand-textsoft'}`}
          >
            <Icon icon="solar:chat-round-dots-bold" width={16} />
            הודעות
          </button>
        </div>

        {section === 'tasks' && (
          <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
            <h2 className="mb-3 text-sm font-bold text-brand-text">מטלות כיתתיות</h2>
            {assignments.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-textsoft">אין עדיין מטלות</p>
            ) : (
              <div className="mb-5 flex flex-col gap-2">
                {assignments.map((a) => {
                  const done = completedAssignmentIds.has(a.id);
                  return (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${done ? 'border-green-300 bg-green-500/5' : 'border-brand-category'}`}>
                      <input type="checkbox" checked={done} onChange={() => toggleAssignment(a.id)} className="mt-0.5 h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold text-brand-text ${done ? 'line-through opacity-60' : ''}`}>{a.title}</span>
                          {a.due_date && <span className="text-xs font-bold text-brand-textsoft">עד {a.due_date}</span>}
                        </div>
                        {a.description && <p className="mt-1 text-xs text-brand-textsoft">{a.description}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <h2 className="mb-3 text-sm font-bold text-brand-text">מטלות אישיות מהמנחה</h2>
            {personalTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-textsoft">אין מטלות אישיות</p>
            ) : (
              <div className="flex flex-col gap-2">
                {personalTasks.map((n) => (
                  <label key={n.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${n.completed ? 'border-green-300 bg-green-500/5' : 'border-brand-category'}`}>
                    <input type="checkbox" checked={n.completed} onChange={() => toggleTask(n.id, n.completed)} className="mt-0.5 h-4 w-4" />
                    <div className="flex-1">
                      <span className={`text-sm text-brand-text ${n.completed ? 'line-through opacity-60' : ''}`}>{n.content}</span>
                      {n.due_date && <div className="mt-1 text-xs font-bold text-brand-textsoft">עד {n.due_date}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'messages' && (
          <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
            <div className="mb-4 flex max-h-96 flex-col gap-2 overflow-y-auto">
              {chatItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-brand-textsoft">אין עדיין הודעות</p>
              ) : (
                chatItems.map((n) => (
                  <div
                    key={n.id}
                    className={`max-w-[80%] rounded-xl p-2.5 text-xs ${
                      n.sender === 'student' ? 'self-end bg-brand-name text-brand-text' : 'self-start border border-brand-category bg-brand-bg text-brand-text'
                    }`}
                  >
                    <div className="mb-0.5 font-bold text-brand-textsoft">{n.sender === 'student' ? 'אני' : mentorNames[cls.mentor_id] ?? 'המנחה'}</div>
                    <div>{n.content}</div>
                    {n.due_date && <div className="mt-1 text-brand-textsoft">עד {n.due_date}</div>}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 border-t border-brand-category pt-3">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="כתוב הודעה למנחה..."
                className="flex-1 rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !messageText.trim()}
                className="rounded-lg bg-brand-name px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-60"
              >
                שלח
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
