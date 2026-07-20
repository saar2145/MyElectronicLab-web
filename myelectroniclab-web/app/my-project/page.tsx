// Version: 2.0
// Title: My Project Page (Student Dashboard) | Change from v1.0: reorganized
// into a tab-based dashboard - "סטטוס הפרויקט" (the original 8-milestone
// tracker), "מטלות" (class assignments, previously buried in a single
// "מהמנחה שלי" block), and "הודעות" (NEW - two-way thread with the
// mentor(s) of joined classes, using the sender column added in
// supabase_schema_v1.9_two_way_messages.sql). If the student is in more than
// one class, the composer needs a class picker (a message must be addressed
// to one specific mentor - see personal_notes_student_insert RLS policy,
// which checks the mentor_id/class relationship). Important Data: one
// student_projects row per user (created on first visit here), with exactly 8
// student_milestones auto-seeded by a DB trigger. Progress % is computed
// client-side, not stored.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { MILESTONES, MilestoneStatus } from '@/lib/milestones';

type Project = { id: string; title: string; description: string };
type Milestone = {
  id: string;
  milestone_key: string;
  order_index: number;
  status: MilestoneStatus;
  due_date: string | null;
};
type ClassInfo = { id: string; class_name: string; mentor_id: string };
type ClassAssignment = { id: string; class_id: string; title: string; description: string; due_date: string | null };
type Note = {
  id: string;
  note_type: 'note' | 'message' | 'task';
  content: string;
  due_date: string | null;
  created_at: string;
  sender: 'mentor' | 'student';
};

const STATUS_LABELS: Record<MilestoneStatus, string> = { not_started: 'טרם התחיל', in_progress: 'בתהליך', done: 'הושלם' };
const STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_started: 'bg-brand-category text-brand-textsoft',
  in_progress: 'bg-amber-500/15 text-amber-700',
  done: 'bg-green-500/15 text-green-700',
};
const NOTE_TYPE_LABELS: Record<Note['note_type'], string> = { note: 'הערה', message: 'הודעה', task: 'מטלה אישית' };
const NOTE_TYPE_ICONS: Record<Note['note_type'], string> = {
  note: 'solar:notes-bold',
  message: 'solar:chat-round-dots-bold',
  task: 'solar:checklist-minimalistic-bold',
};

function isOverdue(m: Milestone): boolean {
  if (!m.due_date || m.status === 'done') return false;
  return new Date(m.due_date) < new Date(new Date().toDateString());
}

type Tab = 'status' | 'tasks' | 'messages';

export default function MyProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('status');

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  async function loadAll() {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data: proj } = await supabase
      .from('student_projects')
      .select('id, title, description')
      .eq('student_id', userData.user.id)
      .maybeSingle();

    if (proj) {
      setProject(proj);
      const { data: ms } = await supabase
        .from('student_milestones')
        .select('id, milestone_key, order_index, status, due_date')
        .eq('student_project_id', proj.id)
        .order('order_index', { ascending: true });
      setMilestones(ms ?? []);
    }

    const { data: classRows } = await supabase.from('mentor_classes').select('id, class_name, mentor_id');
    setClasses(classRows ?? []);
    if (classRows && classRows.length > 0) setSelectedClassId((prev) => prev || classRows[0].id);

    const classIds = (classRows ?? []).map((c) => c.id);
    if (classIds.length > 0) {
      const { data: assignmentRows } = await supabase
        .from('class_assignments')
        .select('id, class_id, title, description, due_date')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });
      setAssignments(assignmentRows ?? []);
    }

    const { data: noteRows } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at, sender')
      .eq('student_id', userData.user.id)
      .order('created_at', { ascending: true });
    setNotes(noteRows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  async function createProject() {
    setCreating(true);
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase
      .from('student_projects')
      .insert({ student_id: userData.user.id, title: newTitle, description: newDescription });
    setCreating(false);
    if (!error) await loadAll();
  }

  async function saveInfo() {
    if (!project) return;
    const supabase = getSupabaseAuthClient();
    await supabase.from('student_projects').update({ title: project.title, description: project.description }).eq('id', project.id);
    setEditingInfo(false);
  }

  async function updateMilestone(id: string, patch: Partial<Pick<Milestone, 'status' | 'due_date'>>) {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const supabase = getSupabaseAuthClient();
    const payload: Record<string, unknown> = { ...patch };
    if (patch.status === 'done') payload.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== 'done') payload.completed_at = null;
    await supabase.from('student_milestones').update(payload).eq('id', id);
  }

  async function sendMessage() {
    if (!messageText.trim() || !selectedClassId) return;
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;
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
        await loadAll();
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

  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : 0;

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'status', icon: 'solar:flag-bold', label: 'סטטוס הפרויקט' },
    { key: 'tasks', icon: 'solar:checklist-minimalistic-bold', label: 'מטלות' },
    { key: 'messages', icon: 'solar:chat-round-dots-bold', label: 'הודעות מהמנחה' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                tab === t.key ? 'bg-brand-name text-brand-text' : 'bg-brand-cardbg text-brand-textsoft'
              }`}
            >
              <Icon icon={t.icon} width={16} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'status' &&
          (!project ? (
            <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
              <h1 className="mb-1 flex items-center gap-2 text-lg font-bold text-brand-text">
                <Icon icon="solar:flag-bold" width={22} /> פרויקט הגמר שלי
              </h1>
              <p className="mb-5 text-sm text-brand-textsoft">עדיין לא פתחת מעקב לפרויקט - בוא נתחיל.</p>
              <div className="flex flex-col gap-3">
                <input
                  placeholder="שם הפרויקט"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
                />
                <textarea
                  placeholder="תיאור קצר (אופציונלי)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-24 w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
                />
                <button
                  onClick={createProject}
                  disabled={creating || !newTitle}
                  className="w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
                >
                  {creating ? 'יוצר...' : 'התחל מעקב'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-2xl bg-brand-cardbg p-6 shadow-lg">
                {editingInfo ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={project.title}
                      onChange={(e) => setProject({ ...project, title: e.target.value })}
                      className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm font-bold text-brand-text outline-none"
                    />
                    <textarea
                      value={project.description}
                      onChange={(e) => setProject({ ...project, description: e.target.value })}
                      className="min-h-20 w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
                    />
                    <button onClick={saveInfo} className="self-start rounded-lg bg-brand-name px-4 py-1.5 text-xs font-bold text-brand-text">
                      שמור
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="mb-1 text-lg font-bold text-brand-text">{project.title || 'פרויקט הגמר שלי'}</h1>
                      {project.description && <p className="text-sm text-brand-textsoft">{project.description}</p>}
                    </div>
                    <button onClick={() => setEditingInfo(true)} className="shrink-0 rounded-lg bg-brand-bg p-2 text-brand-textsoft">
                      <Icon icon="solar:pen-2-linear" width={16} />
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-brand-textsoft">
                    <span>התקדמות</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-category">
                    <div className="h-full rounded-full bg-brand-linktext transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
                <h2 className="mb-4 text-sm font-bold text-brand-text">שלבי הפרויקט</h2>
                <div className="flex flex-col gap-3">
                  {milestones.map((m) => {
                    const def = MILESTONES.find((d) => d.key === m.milestone_key);
                    const overdue = isOverdue(m);
                    return (
                      <div key={m.id} className={`rounded-xl border p-3 ${overdue ? 'border-red-400 bg-red-500/5' : 'border-brand-category'}`}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-brand-text">{def?.label ?? m.milestone_key}</span>
                          <select
                            value={m.status}
                            onChange={(e) => updateMilestone(m.id, { status: e.target.value as MilestoneStatus })}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[m.status]}`}
                          >
                            <option value="not_started">{STATUS_LABELS.not_started}</option>
                            <option value="in_progress">{STATUS_LABELS.in_progress}</option>
                            <option value="done">{STATUS_LABELS.done}</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:calendar-linear" width={14} className="text-brand-textsoft" />
                          <input
                            type="date"
                            value={m.due_date ?? ''}
                            onChange={(e) => updateMilestone(m.id, { due_date: e.target.value || null })}
                            className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none"
                          />
                          {overdue && <span className="text-xs font-bold text-red-500">עבר תאריך היעד</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ))}

        {tab === 'tasks' && (
          <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-text">
              <Icon icon="solar:checklist-minimalistic-bold" width={18} /> מטלות כיתתיות
            </h2>
            {assignments.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-textsoft">אין עדיין מטלות</p>
            ) : (
              <div className="flex flex-col gap-2">
                {assignments.map((a) => (
                  <div key={a.id} className="rounded-xl border border-brand-category p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-brand-text">{a.title}</span>
                      {a.due_date && <span className="text-xs font-bold text-brand-textsoft">עד {a.due_date}</span>}
                    </div>
                    {a.description && <p className="mt-1 text-xs text-brand-textsoft">{a.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-text">
              <Icon icon="solar:chat-round-dots-bold" width={18} /> הודעות
            </h2>

            {classes.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-textsoft">עדיין לא הצטרפת לכיתה - אין למי לשלוח הודעה</p>
            ) : (
              <>
                <div className="mb-4 flex max-h-96 flex-col gap-2 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="py-6 text-center text-xs text-brand-textsoft">אין עדיין הודעות</p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className={`max-w-[80%] rounded-xl p-2.5 text-xs ${
                          n.sender === 'student'
                            ? 'self-end bg-brand-name text-brand-text'
                            : 'self-start border border-brand-category bg-brand-bg text-brand-text'
                        }`}
                      >
                        <div className="mb-0.5 flex items-center gap-1 font-bold text-brand-textsoft">
                          <Icon icon={NOTE_TYPE_ICONS[n.note_type]} width={12} />
                          {n.sender === 'student' ? 'אני' : NOTE_TYPE_LABELS[n.note_type]}
                        </div>
                        <div>{n.content}</div>
                        {n.due_date && <div className="mt-1 text-brand-textsoft">עד {n.due_date}</div>}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-brand-category pt-3">
                  {classes.length > 1 && (
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
