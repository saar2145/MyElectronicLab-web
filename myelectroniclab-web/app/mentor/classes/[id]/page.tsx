// Version: 4.2
// Title: Mentor Class Detail | Change from v4.1: UI/UX refinement pass
// (visual only, no behavior/logic change) - sidebar active section, progress
// bars, primary buttons and the mentor's own chat bubbles now use the brand
// gradient; student roster cards get more depth + hover lift. Change from
// v4.0: added a "העתק קישור הזמנה"
// button next to the join code - copies /join-class/[code], which shows a
// confirmation card (class name + mentor name) via get_class_by_code() before
// the student joins (see app/join-class/[code]/page.tsx). Important Data:
// roster is a GRID of cards (not a list) - each card shows the student's own
// free-text status_note right on the card. Clicking a card opens a chat MODAL
// styled like the student's own chat (bubbles, Enter-to-send). "Unread" is
// driven by mentor_class_students.mentor_last_read_at - opening a student's
// chat auto-marks it read, and there's also an explicit "סמן כנקרא" button on
// the card for the case where the mentor doesn't need to reply. Relies on the
// mentor-read RLS policies (profiles/student_projects/student_milestones
// scoped to "students in my classes") and the class_assignments_student_select
// policy (excludes archived).

'use client';

import { useEffect, useState, use as usePromise } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

type ClassInfo = { id: string; class_name: string; join_code: string; description: string };
type StudentRow = { id: string; full_name: string; phone: string; progress: number; statusNote: string; hasUnread: boolean };
type Assignment = { id: string; title: string; description: string; due_date: string | null; created_at: string; archived: boolean };
type Note = { id: string; note_type: 'note' | 'message' | 'task'; content: string; due_date: string | null; created_at: string; sender: 'mentor' | 'student' };

type Section = 'students' | 'assignments' | 'archive' | 'settings';

function ChatModal({
  student,
  classId,
  onClose,
  onRead,
}: {
  student: StudentRow;
  classId: string;
  onClose: () => void;
  onRead: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [msgType, setMsgType] = useState<Note['note_type']>('message');
  const [dueDate, setDueDate] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    const supabase = getSupabaseAuthClient();
    const { data } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at, sender')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });
    setNotes(data ?? []);
    setLoading(false);

    // נכנסים לצ'אט = נקרא. מעדכן mentor_last_read_at על שורת ה-roster של הסטודנט הזה
    await supabase.from('mentor_class_students').update({ mentor_last_read_at: new Date().toISOString() }).eq('class_id', classId).eq('student_id', student.id);
    onRead();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount, וגם מסמן נקרא
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('personal_notes').insert({
        mentor_id: userData.user.id,
        student_id: student.id,
        class_id: classId,
        note_type: msgType,
        content: text.trim(),
        due_date: dueDate || null,
        sender: 'mentor',
      });
      setText('');
      setDueDate('');
      await load();
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-brand-cardbg shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between border-b border-brand-category p-4">
          <div>
            <div className="text-sm font-bold text-brand-text">{student.full_name}</div>
            <div className="text-xs text-brand-textsoft">{student.phone}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-textsoft hover:bg-brand-bg">
            <Icon icon="solar:close-circle-linear" width={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-6 text-center text-xs text-brand-textsoft">טוען...</p>
          ) : notes.length === 0 ? (
            <p className="py-6 text-center text-xs text-brand-textsoft">אין עדיין הודעות</p>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`max-w-[80%] rounded-xl p-2.5 text-xs shadow-sm ${
                    n.sender === 'mentor' ? 'self-end text-white' : 'self-start border border-brand-category bg-brand-bg text-brand-text'
                  }`}
                  style={n.sender === 'mentor' ? { background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' } : undefined}
                >
                  <div className={`mb-0.5 font-bold ${n.sender === 'mentor' ? 'text-white/80' : 'text-brand-textsoft'}`}>{n.sender === 'mentor' ? 'אני' : student.full_name}</div>
                  <div>{n.content}</div>
                  {n.due_date && <div className={`mt-1 ${n.sender === 'mentor' ? 'text-white/80' : 'text-brand-textsoft'}`}>עד {n.due_date}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-brand-category p-3">
          <div className="mb-2 flex gap-2">
            <select value={msgType} onChange={(e) => setMsgType(e.target.value as Note['note_type'])} className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none">
              <option value="message">הודעה</option>
              <option value="note">הערה</option>
              <option value="task">מטלה אישית</option>
            </select>
            {msgType === 'task' && (
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} title="תאריך יעד (אופציונלי)" className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none" />
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="כתוב הודעה..."
              className="flex-1 rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
              autoFocus
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
            >
              שלח
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = usePromise(params);
  const router = useRouter();
  const [section, setSection] = useState<Section>('students');

  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [chatStudent, setChatStudent] = useState<StudentRow | null>(null);

  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  async function load() {
    const supabase = getSupabaseAuthClient();

    const { data: classRow } = await supabase
      .from('mentor_classes')
      .select('id, class_name, join_code, description')
      .eq('id', classId)
      .maybeSingle();

    if (!classRow) {
      router.push('/mentor');
      return;
    }
    setCls(classRow);
    setSettingsName(classRow.class_name);
    setSettingsDesc(classRow.description ?? '');

    const { data: roster } = await supabase.from('mentor_class_students').select('student_id, mentor_last_read_at').eq('class_id', classId);
    const studentIds = (roster ?? []).map((r) => r.student_id);

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', studentIds);
      const { data: projects } = await supabase.from('student_projects').select('id, student_id, status_note').in('student_id', studentIds);

      const projectIds = (projects ?? []).map((p) => p.id);
      const { data: milestones } = projectIds.length
        ? await supabase.from('student_milestones').select('student_project_id, status').in('student_project_id', projectIds)
        : { data: [] as { student_project_id: string; status: string }[] };

      const { data: studentMessages } = await supabase
        .from('personal_notes')
        .select('student_id, created_at')
        .in('student_id', studentIds)
        .eq('sender', 'student')
        .order('created_at', { ascending: false });

      const lastStudentMsgAt = new Map<string, string>();
      (studentMessages ?? []).forEach((m) => {
        if (!lastStudentMsgAt.has(m.student_id)) lastStudentMsgAt.set(m.student_id, m.created_at);
      });
      const lastReadAt = new Map((roster ?? []).map((r) => [r.student_id, r.mentor_last_read_at as string | null]));

      const rows: StudentRow[] = (profiles ?? []).map((p) => {
        const proj = (projects ?? []).find((pr) => pr.student_id === p.id);
        const ms = proj ? (milestones ?? []).filter((m) => m.student_project_id === proj.id) : [];
        const progress = ms.length > 0 ? Math.round((ms.filter((m) => m.status === 'done').length / ms.length) * 100) : 0;
        const lastMsg = lastStudentMsgAt.get(p.id);
        const readAt = lastReadAt.get(p.id);
        const hasUnread = !!lastMsg && (!readAt || new Date(lastMsg) > new Date(readAt));
        return { id: p.id, full_name: p.full_name, phone: p.phone, progress, statusNote: proj?.status_note ?? '', hasUnread };
      });
      setStudents(rows);
    } else {
      setStudents([]);
    }

    const { data: assignmentRows } = await supabase
      .from('class_assignments')
      .select('id, title, description, due_date, created_at, archived')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    setAssignments(assignmentRows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ מחדש רק כש-classId משתנה
  }, [classId]);

  function copyCode() {
    if (!cls) return;
    navigator.clipboard.writeText(cls.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function copyLink() {
    if (!cls) return;
    navigator.clipboard.writeText(`${window.location.origin}/join-class/${cls.join_code}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  async function markAsRead(studentId: string) {
    const supabase = getSupabaseAuthClient();
    await supabase.from('mentor_class_students').update({ mentor_last_read_at: new Date().toISOString() }).eq('class_id', classId).eq('student_id', studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, hasUnread: false } : s)));
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

  async function archiveAssignment(id: string, archived: boolean) {
    const supabase = getSupabaseAuthClient();
    await supabase.from('class_assignments').update({ archived }).eq('id', id);
    load();
  }

  async function deleteAssignment(id: string) {
    if (!confirm('למחוק את המטלה הזו לצמיתות?')) return;
    const supabase = getSupabaseAuthClient();
    await supabase.from('class_assignments').delete().eq('id', id);
    load();
  }

  async function removeStudent(studentId: string) {
    if (!confirm('להסיר את הסטודנט הזה מהכיתה?')) return;
    const supabase = getSupabaseAuthClient();
    await supabase.from('mentor_class_students').delete().eq('class_id', classId).eq('student_id', studentId);
    load();
  }

  async function saveSettings() {
    setSavingSettings(true);
    const supabase = getSupabaseAuthClient();
    await supabase.from('mentor_classes').update({ class_name: settingsName, description: settingsDesc }).eq('id', classId);
    setSavingSettings(false);
    load();
  }

  async function deleteClass() {
    if (!confirm('למחוק את הכיתה לצמיתות? כל הסטודנטים, המטלות וההודעות הקשורות אליה יימחקו.')) return;
    const supabase = getSupabaseAuthClient();
    await supabase.from('mentor_classes').delete().eq('id', classId);
    router.push('/mentor');
  }

  if (loading || !cls) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  const activeAssignments = assignments.filter((a) => !a.archived);
  const archivedAssignments = assignments.filter((a) => a.archived);

  const SECTIONS: { key: Section; icon: string; label: string }[] = [
    { key: 'students', icon: 'solar:users-group-rounded-bold', label: 'רשימת סטודנטים' },
    { key: 'assignments', icon: 'solar:checklist-minimalistic-bold', label: 'מטלות כיתתיות' },
    { key: 'archive', icon: 'solar:archive-bold', label: 'ארכיון' },
    { key: 'settings', icon: 'solar:settings-bold', label: 'הגדרות כיתה' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-l border-brand-category bg-brand-cardbg p-4">
        <button onClick={() => router.push('/mentor')} className="mb-3 flex items-center gap-1 px-1 text-xs font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={16} />
          כל הכיתות
        </button>
        <div className="mb-3 truncate px-1 text-sm font-bold text-brand-text">{cls.class_name}</div>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              section === s.key ? 'text-white shadow-md' : 'text-brand-textsoft hover:bg-brand-bg'
            }`}
            style={section === s.key ? { background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' } : undefined}
          >
            <Icon icon={s.icon} width={18} />
            {s.label}
          </button>
        ))}
        <button onClick={copyCode} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-picture px-3 py-2 text-xs font-bold text-brand-text">
          <Icon icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} width={14} />
          <span className="font-mono tracking-widest">{cls.join_code}</span>
        </button>
        <button onClick={copyLink} className="mt-1.5 flex items-center justify-center gap-2 rounded-xl bg-brand-bg px-3 py-2 text-xs font-bold text-brand-textsoft">
          <Icon icon={linkCopied ? 'solar:check-circle-bold' : 'solar:link-bold'} width={14} />
          {linkCopied ? 'הקישור הועתק' : 'העתק קישור הזמנה'}
        </button>
      </aside>

      <main className="flex-1 p-6">
        {section === 'students' && (
          <div>
            <h1 className="mb-5 flex items-center gap-2 text-lg font-bold text-brand-text">
              <Icon icon="solar:users-group-rounded-bold" width={22} /> רשימת סטודנטים ({students.length})
            </h1>

            {students.length === 0 ? (
              <p className="py-16 text-center text-brand-textsoft">עדיין אין סטודנטים בכיתה - שתף את הקוד</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((s) => (
                  <div key={s.id} className="relative rounded-2xl bg-brand-cardbg p-4 shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    {s.hasUnread && <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" title="הודעה חדשה שלא נענתה" />}

                    <div className="mb-2 text-sm font-bold text-brand-text">{s.full_name}</div>
                    <div className="mb-3 text-xs text-brand-textsoft">{s.phone}</div>

                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-brand-textsoft">
                        <span>התקדמות</span>
                        <span className="text-brand-text">{s.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-brand-category">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${s.progress}%`, background: 'linear-gradient(90deg, var(--header-grad-from), var(--header-grad-to))' }}
                        />
                      </div>
                    </div>

                    {s.statusNote && (
                      <p className="mb-3 rounded-lg bg-brand-bg p-2 text-xs text-brand-text">
                        <Icon icon="solar:chat-square-like-linear" width={12} className="ml-1 inline" />
                        {s.statusNote}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setChatStudent(s)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
                        style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
                      >
                        <Icon icon="solar:chat-round-dots-bold" width={14} />
                        צ&apos;אט
                      </button>
                      {s.hasUnread && (
                        <button onClick={() => markAsRead(s.id)} title="סמן כנקרא" className="rounded-lg bg-brand-bg px-2.5 py-2 text-brand-textsoft">
                          <Icon icon="solar:check-read-linear" width={14} />
                        </button>
                      )}
                      <button onClick={() => removeStudent(s.id)} title="הסר מהכיתה" className="rounded-lg bg-brand-bg px-2.5 py-2 text-red-500">
                        <Icon icon="solar:user-minus-rounded-bold" width={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'assignments' && (
          <div>
            <h1 className="mb-5 flex items-center gap-2 text-lg font-bold text-brand-text">
              <Icon icon="solar:checklist-minimalistic-bold" width={22} /> מטלות כיתתיות
            </h1>

            <div className="mb-5 rounded-2xl bg-brand-cardbg p-5 shadow-sm">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <label className="mb-1 block text-xs font-bold text-brand-textsoft">כותרת המטלה</label>
                  <input
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
                  />
                </div>
                <div className="min-w-[160px] flex-1">
                  <label className="mb-1 block text-xs font-bold text-brand-textsoft">תיאור (אופציונלי)</label>
                  <input
                    value={assignDesc}
                    onChange={(e) => setAssignDesc(e.target.value)}
                    className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-brand-textsoft">תאריך הגשה (אופציונלי)</label>
                  <input
                    type="date"
                    value={assignDue}
                    onChange={(e) => setAssignDue(e.target.value)}
                    className="rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
                  />
                </div>
                <button
                  onClick={addAssignment}
                  disabled={savingAssignment || !assignTitle.trim()}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
                >
                  הוסף
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {activeAssignments.map((a) => (
                <div key={a.id} className="rounded-xl bg-brand-cardbg p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand-text">{a.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.due_date && <span className="text-xs font-bold text-brand-textsoft">עד {a.due_date}</span>}
                      <button onClick={() => archiveAssignment(a.id, true)} title="העבר לארכיון" className="rounded-lg p-1.5 text-brand-textsoft hover:bg-brand-bg">
                        <Icon icon="solar:archive-down-minimlistic-bold" width={16} />
                      </button>
                      <button onClick={() => deleteAssignment(a.id)} title="מחק" className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10">
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </button>
                    </div>
                  </div>
                  {a.description && <p className="mt-1 text-xs text-brand-textsoft">{a.description}</p>}
                </div>
              ))}
              {activeAssignments.length === 0 && <p className="py-10 text-center text-xs text-brand-textsoft">אין עדיין מטלות כיתתיות</p>}
            </div>
          </div>
        )}

        {section === 'archive' && (
          <div>
            <h1 className="mb-5 flex items-center gap-2 text-lg font-bold text-brand-text">
              <Icon icon="solar:archive-bold" width={22} /> ארכיון מטלות
            </h1>
            <p className="mb-4 text-xs text-brand-textsoft">מטלות כאן לא מוצגות לסטודנטים.</p>
            <div className="flex flex-col gap-2">
              {archivedAssignments.map((a) => (
                <div key={a.id} className="rounded-xl bg-brand-cardbg p-4 opacity-70 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand-text">{a.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => archiveAssignment(a.id, false)} className="rounded-lg bg-brand-name px-3 py-1.5 text-xs font-bold text-brand-text">
                        שחזר
                      </button>
                      <button onClick={() => deleteAssignment(a.id)} title="מחק" className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10">
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </button>
                    </div>
                  </div>
                  {a.description && <p className="mt-1 text-xs text-brand-textsoft">{a.description}</p>}
                </div>
              ))}
              {archivedAssignments.length === 0 && <p className="py-10 text-center text-xs text-brand-textsoft">הארכיון ריק</p>}
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div>
            <h1 className="mb-5 flex items-center gap-2 text-lg font-bold text-brand-text">
              <Icon icon="solar:settings-bold" width={22} /> הגדרות כיתה
            </h1>

            <div className="mb-5 rounded-2xl bg-brand-cardbg p-5 shadow-sm">
              <label className="mb-1 block text-xs font-bold text-brand-textsoft">שם הכיתה</label>
              <input
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="mb-3 w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
              />
              <label className="mb-1 block text-xs font-bold text-brand-textsoft">תיאור (מוצג לסטודנטים)</label>
              <textarea
                value={settingsDesc}
                onChange={(e) => setSettingsDesc(e.target.value)}
                className="mb-3 min-h-20 w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none"
              />
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
              >
                {savingSettings ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>

            <div className="rounded-2xl border border-red-300 bg-red-500/5 p-5">
              <h2 className="mb-1 text-sm font-bold text-red-600">אזור מסוכן</h2>
              <p className="mb-3 text-xs text-brand-textsoft">מחיקת הכיתה תמחק גם את כל הסטודנטים הרשומים אליה ואת המטלות שלה. לא ניתן לבטל.</p>
              <button onClick={deleteClass} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white">
                מחק כיתה
              </button>
            </div>
          </div>
        )}
      </main>

      {chatStudent && (
        <ChatModal
          student={chatStudent}
          classId={classId}
          onClose={() => setChatStudent(null)}
          onRead={() => setStudents((prev) => prev.map((s) => (s.id === chatStudent.id ? { ...s, hasUnread: false } : s)))}
        />
      )}
    </div>
  );
}
