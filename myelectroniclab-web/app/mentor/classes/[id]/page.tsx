// Version: 3.0
// Title: Mentor Class Detail | Change from v2.0: (1) roster shows a red dot
// on students whose most recent message is theirs and unanswered - a proxy
// for "unread", since there's no formal read-receipt system; (2) assignments
// can be archived (hidden from students, kept in a new "ארכיון" section) or
// hard-deleted; (3) the due-date field now has a visible label
// ("תאריך הגשה (אופציונלי)") instead of only a hover tooltip; (4) new
// "הגדרות כיתה" section - edit name/description, delete the whole class,
// remove individual students from the roster. Important Data: relies on the
// mentor-read RLS policies (profiles/student_projects/student_milestones
// scoped to "students in my classes") and the class_assignments_student_select
// policy update (excludes archived) from supabase_schema_v1.11.

'use client';

import { useEffect, useState, use as usePromise } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

type ClassInfo = { id: string; class_name: string; join_code: string; description: string };
type StudentRow = { id: string; full_name: string; phone: string; progress: number; hasUnread: boolean };
type Assignment = { id: string; title: string; description: string; due_date: string | null; created_at: string; archived: boolean };
type Note = { id: string; note_type: 'note' | 'message' | 'task'; content: string; due_date: string | null; created_at: string; sender: 'mentor' | 'student' };

const NOTE_TYPE_LABELS: Record<Note['note_type'], string> = { note: 'הערה', message: 'הודעה', task: 'מטלה אישית' };
const NOTE_TYPE_ICONS: Record<Note['note_type'], string> = {
  note: 'solar:notes-bold',
  message: 'solar:chat-round-dots-bold',
  task: 'solar:checklist-minimalistic-bold',
};

type Section = 'students' | 'assignments' | 'archive' | 'settings';

export default function MentorClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = usePromise(params);
  const router = useRouter();
  const [section, setSection] = useState<Section>('students');

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

    const { data: roster } = await supabase.from('mentor_class_students').select('student_id').eq('class_id', classId);
    const studentIds = (roster ?? []).map((r) => r.student_id);

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', studentIds);
      const { data: projects } = await supabase.from('student_projects').select('id, student_id').in('student_id', studentIds);

      const projectIds = (projects ?? []).map((p) => p.id);
      const { data: milestones } = projectIds.length
        ? await supabase.from('student_milestones').select('student_project_id, status').in('student_project_id', projectIds)
        : { data: [] as { student_project_id: string; status: string }[] };

      // עבור אינדיקטור "לא נענה" - השורה האחרונה לכל סטודנט בשיחה שלו
      const { data: allNotes } = await supabase
        .from('personal_notes')
        .select('student_id, sender, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      const lastSenderByStudent = new Map<string, string>();
      (allNotes ?? []).forEach((n) => {
        if (!lastSenderByStudent.has(n.student_id)) lastSenderByStudent.set(n.student_id, n.sender);
      });

      const rows: StudentRow[] = (profiles ?? []).map((p) => {
        const proj = (projects ?? []).find((pr) => pr.student_id === p.id);
        const ms = proj ? (milestones ?? []).filter((m) => m.student_project_id === proj.id) : [];
        const progress = ms.length > 0 ? Math.round((ms.filter((m) => m.status === 'done').length / ms.length) * 100) : 0;
        return { id: p.id, full_name: p.full_name, phone: p.phone, progress, hasUnread: lastSenderByStudent.get(p.id) === 'student' };
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

  async function loadNotes(studentId: string) {
    const supabase = getSupabaseAuthClient();
    const { data } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at, sender')
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
    loadNotes(studentId);
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
        sender: 'mentor',
      });
      setNoteContent('');
      setNoteDue('');
      await loadNotes(studentId);
      load(); // מרענן גם את אינדיקטור "לא נענה" ברשימה
    }
    setSavingNote(false);
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
              section === s.key ? 'bg-brand-name text-brand-text' : 'text-brand-textsoft hover:bg-brand-bg'
            }`}
          >
            <Icon icon={s.icon} width={18} />
            {s.label}
          </button>
        ))}
        <button onClick={copyCode} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-picture px-3 py-2 text-xs font-bold text-brand-text">
          <Icon icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} width={14} />
          <span className="font-mono tracking-widest">{cls.join_code}</span>
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
              <div className="flex flex-col gap-2">
                {students.map((s) => (
                  <div key={s.id} className="rounded-xl bg-brand-cardbg shadow-sm">
                    <div className="flex w-full items-center gap-2 p-4">
                      <button onClick={() => toggleStudent(s.id)} className="flex flex-1 items-center justify-between gap-3 text-right">
                        <div className="flex items-center gap-2">
                          {s.hasUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" title="הודעה חדשה שלא נענתה" />}
                          <div>
                            <div className="text-sm font-bold text-brand-text">{s.full_name}</div>
                            <div className="text-xs text-brand-textsoft">{s.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-brand-category">
                            <div className="h-full rounded-full bg-brand-linktext" style={{ width: `${s.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-brand-textsoft">{s.progress}%</span>
                          <Icon icon={openStudentId === s.id ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={16} className="text-brand-textsoft" />
                        </div>
                      </button>
                      <button onClick={() => removeStudent(s.id)} title="הסר מהכיתה" className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-500/10">
                        <Icon icon="solar:user-minus-rounded-bold" width={16} />
                      </button>
                    </div>

                    {openStudentId === s.id && (
                      <div className="border-t border-brand-category p-4">
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
                                <span className="font-bold text-brand-text">{n.sender === 'student' ? 'הסטודנט' : NOTE_TYPE_LABELS[n.note_type]}: </span>
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
                  className="rounded-xl bg-brand-name px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-60"
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
                className="rounded-xl bg-brand-name px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-60"
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
    </div>
  );
}
