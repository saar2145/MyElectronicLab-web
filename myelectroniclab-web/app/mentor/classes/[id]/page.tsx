// Version: 1.0
// Title: Mentor Class Detail | Important Data: relies on the mentor-read RLS
// policies added in supabase_schema_v1.6_mentor_classes.sql (profiles,
// student_projects, student_milestones SELECT policies scoped to "students in
// my classes"). Roster + progress is built with separate queries (not
// PostgREST FK-embedding) since mentor_class_students.student_id references
// auth.users, not public.profiles, so there's no FK for embedding to use.
// Per-student notes panel toggles inline per row rather than a separate route,
// to keep everything on one screen.

'use client';

import { useEffect, useState, use as usePromise } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

type ClassInfo = { id: string; class_name: string; join_code: string };
type StudentRow = { id: string; full_name: string; email: string; progress: number };
type Assignment = { id: string; title: string; description: string; due_date: string | null; created_at: string };
type Note = { id: string; note_type: 'note' | 'message' | 'task'; content: string; due_date: string | null; created_at: string };

const NOTE_TYPE_LABELS: Record<Note['note_type'], string> = { note: 'הערה', message: 'הודעה', task: 'מטלה אישית' };
const NOTE_TYPE_ICONS: Record<Note['note_type'], string> = {
  note: 'solar:notes-bold',
  message: 'solar:chat-round-dots-bold',
  task: 'solar:checklist-minimalistic-bold',
};

export default function MentorClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = usePromise(params);
  const router = useRouter();

  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [notesByStudent, setNotesByStudent] = useState<Record<string, Note[]>>({});
  const [noteType, setNoteType] = useState<Note['note_type']>('note');
  const [noteContent, setNoteContent] = useState('');
  const [noteDue, setNoteDue] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    const supabase = getSupabaseAuthClient();

    const { data: classRow } = await supabase
      .from('mentor_classes')
      .select('id, class_name, join_code')
      .eq('id', classId)
      .maybeSingle();

    if (!classRow) {
      router.push('/mentor');
      return;
    }
    setCls(classRow);

    const { data: roster } = await supabase
      .from('mentor_class_students')
      .select('student_id')
      .eq('class_id', classId);

    const studentIds = (roster ?? []).map((r) => r.student_id);

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      const { data: projects } = await supabase
        .from('student_projects')
        .select('id, student_id')
        .in('student_id', studentIds);

      const projectIds = (projects ?? []).map((p) => p.id);
      const { data: milestones } = projectIds.length
        ? await supabase.from('student_milestones').select('student_project_id, status').in('student_project_id', projectIds)
        : { data: [] as { student_project_id: string; status: string }[] };

      const rows: StudentRow[] = (profiles ?? []).map((p) => {
        const proj = (projects ?? []).find((pr) => pr.student_id === p.id);
        const ms = proj ? (milestones ?? []).filter((m) => m.student_project_id === proj.id) : [];
        const progress = ms.length > 0 ? Math.round((ms.filter((m) => m.status === 'done').length / ms.length) * 100) : 0;
        return { id: p.id, full_name: p.full_name, email: p.email, progress };
      });
      setStudents(rows);
    } else {
      setStudents([]);
    }

    const { data: assignmentRows } = await supabase
      .from('class_assignments')
      .select('id, title, description, due_date, created_at')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    setAssignments(assignmentRows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ מחדש רק כש-classId משתנה, לא כש-load עצמו משתנה
  }, [classId]);

  function copyCode() {
    if (!cls) return;
    navigator.clipboard.writeText(cls.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function addAssignment() {
    if (!assignTitle.trim()) return;
    setSavingAssignment(true);
    const supabase = getSupabaseAuthClient();
    await supabase.from('class_assignments').insert({
      class_id: classId,
      title: assignTitle.trim(),
      description: assignDesc.trim(),
      due_date: assignDue || null,
    });
    setSavingAssignment(false);
    setAssignTitle('');
    setAssignDesc('');
    setAssignDue('');
    load();
  }

  async function loadNotes(studentId: string) {
    const supabase = getSupabaseAuthClient();
    const { data } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    setNotesByStudent((prev) => ({ ...prev, [studentId]: data ?? [] }));
  }

  function toggleStudent(studentId: string) {
    if (openStudentId === studentId) {
      setOpenStudentId(null);
      return;
    }
    setOpenStudentId(studentId);
    setNoteContent('');
    setNoteDue('');
    setNoteType('note');
    if (!notesByStudent[studentId]) loadNotes(studentId);
  }

  async function addNote(studentId: string) {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('personal_notes').insert({
        mentor_id: userData.user.id,
        student_id: studentId,
        class_id: classId,
        note_type: noteType,
        content: noteContent.trim(),
        due_date: noteDue || null,
      });
      setNoteContent('');
      setNoteDue('');
      await loadNotes(studentId);
    }
    setSavingNote(false);
  }

  if (loading || !cls) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => router.push('/mentor')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה ללוח הבקרה
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cardbg p-5 shadow-sm">
          <h1 className="text-lg font-bold text-brand-text">{cls.class_name}</h1>
          <button onClick={copyCode} className="flex items-center gap-2 rounded-xl bg-brand-picture px-4 py-2 text-sm font-bold text-brand-text">
            <Icon icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} width={16} />
            קוד: <span className="font-mono tracking-widest">{cls.join_code}</span>
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-brand-cardbg p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-brand-text">רשימת סטודנטים ({students.length})</h2>
          {students.length === 0 ? (
            <p className="py-6 text-center text-brand-textsoft">עדיין אין סטודנטים בכיתה - שתף את הקוד</p>
          ) : (
            <div className="flex flex-col gap-2">
              {students.map((s) => (
                <div key={s.id} className="rounded-xl border border-brand-category">
                  <button onClick={() => toggleStudent(s.id)} className="flex w-full items-center justify-between gap-3 p-3 text-right">
                    <div>
                      <div className="text-sm font-bold text-brand-text">{s.full_name}</div>
                      <div className="text-xs text-brand-textsoft">{s.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-brand-category">
                        <div className="h-full rounded-full bg-brand-linktext" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-brand-textsoft">{s.progress}%</span>
                      <Icon icon={openStudentId === s.id ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={16} className="text-brand-textsoft" />
                    </div>
                  </button>

                  {openStudentId === s.id && (
                    <div className="border-t border-brand-category p-3">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <select value={noteType} onChange={(e) => setNoteType(e.target.value as Note['note_type'])} className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none">
                          <option value="note">הערה</option>
                          <option value="message">הודעה</option>
                          <option value="task">מטלה אישית</option>
                        </select>
                        <input
                          placeholder="תוכן..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          className="min-w-[160px] flex-1 rounded-lg border border-brand-category bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none"
                        />
                        <input
                          type="date"
                          value={noteDue}
                          onChange={(e) => setNoteDue(e.target.value)}
                          className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none"
                        />
                        <button
                          onClick={() => addNote(s.id)}
                          disabled={savingNote || !noteContent.trim()}
                          className="rounded-lg bg-brand-name px-3 py-1.5 text-xs font-bold text-brand-text disabled:opacity-60"
                        >
                          שלח
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(notesByStudent[s.id] ?? []).map((n) => (
                          <div key={n.id} className="flex items-start gap-2 rounded-lg bg-brand-bg p-2 text-xs">
                            <Icon icon={NOTE_TYPE_ICONS[n.note_type]} width={14} className="mt-0.5 shrink-0 text-brand-textsoft" />
                            <div>
                              <span className="font-bold text-brand-text">{NOTE_TYPE_LABELS[n.note_type]}: </span>
                              <span className="text-brand-text">{n.content}</span>
                              {n.due_date && <span className="mr-2 text-brand-textsoft">(עד {n.due_date})</span>}
                            </div>
                          </div>
                        ))}
                        {(notesByStudent[s.id] ?? []).length === 0 && <p className="text-center text-xs text-brand-textsoft">אין עדיין הערות לסטודנט הזה</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-brand-cardbg p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-brand-text">מטלות כיתתיות</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              placeholder="כותרת המטלה"
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              className="min-w-[160px] flex-1 rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
            />
            <input
              placeholder="תיאור (אופציונלי)"
              value={assignDesc}
              onChange={(e) => setAssignDesc(e.target.value)}
              className="min-w-[160px] flex-1 rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
            />
            <input
              type="date"
              value={assignDue}
              onChange={(e) => setAssignDue(e.target.value)}
              title="תאריך יעד (אופציונלי)"
              className="rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
            />
            <button
              onClick={addAssignment}
              disabled={savingAssignment || !assignTitle.trim()}
              className="rounded-xl bg-brand-name px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-60"
            >
              הוסף
            </button>
          </div>

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
            {assignments.length === 0 && <p className="py-4 text-center text-xs text-brand-textsoft">אין עדיין מטלות כיתתיות</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
