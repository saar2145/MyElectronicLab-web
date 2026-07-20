// Version: 1.0
// Title: My Project Page | Important Data: one student_projects row per user
// (created on first visit here), with exactly 8 student_milestones auto-seeded
// by the DB trigger (see supabase_schema_v1.5_student_projects.sql - and note
// the 8-not-9 correction in chat). Each milestone has its own status
// (not_started/in_progress/done) and an optional due_date; overdue = has a
// due_date in the past AND status != done. Progress % is done_count / 8,
// computed client-side, not stored.

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

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: 'טרם התחיל',
  in_progress: 'בתהליך',
  done: 'הושלם',
};

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_started: 'bg-brand-category text-brand-textsoft',
  in_progress: 'bg-amber-500/15 text-amber-700',
  done: 'bg-green-500/15 text-green-700',
};

function isOverdue(m: Milestone): boolean {
  if (!m.due_date || m.status === 'done') return false;
  return new Date(m.due_date) < new Date(new Date().toDateString());
}

type ClassAssignment = { id: string; title: string; description: string; due_date: string | null };
type MentorNote = { id: string; note_type: 'note' | 'message' | 'task'; content: string; due_date: string | null; created_at: string };

const NOTE_TYPE_LABELS: Record<MentorNote['note_type'], string> = { note: 'הערה', message: 'הודעה', task: 'מטלה אישית' };
const NOTE_TYPE_ICONS: Record<MentorNote['note_type'], string> = {
  note: 'solar:notes-bold',
  message: 'solar:chat-round-dots-bold',
  task: 'solar:checklist-minimalistic-bold',
};

function MentorUpdatesSection({ assignments, notes }: { assignments: ClassAssignment[]; notes: MentorNote[] }) {
  if (assignments.length === 0 && notes.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl bg-brand-cardbg p-6 shadow-lg">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-text">
        <Icon icon="solar:mailbox-bold" width={18} /> מהמנחה שלי
      </h2>

      {assignments.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-xs font-bold text-brand-textsoft">מטלות כיתתיות</div>
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
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold text-brand-textsoft">הערות והודעות אישיות</div>
          <div className="flex flex-col gap-2">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start gap-2 rounded-lg bg-brand-bg p-2 text-xs">
                <Icon icon={NOTE_TYPE_ICONS[n.note_type]} width={14} className="mt-0.5 shrink-0 text-brand-textsoft" />
                <div>
                  <span className="font-bold text-brand-text">{NOTE_TYPE_LABELS[n.note_type]}: </span>
                  <span className="text-brand-text">{n.content}</span>
                  {n.due_date && <span className="mr-2 text-brand-textsoft">(עד {n.due_date})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

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

    const { data: classRows } = await supabase.from('mentor_class_students').select('class_id').eq('student_id', userData.user.id);
    const classIds = (classRows ?? []).map((c) => c.class_id);
    if (classIds.length > 0) {
      const { data: assignmentRows } = await supabase
        .from('class_assignments')
        .select('id, title, description, due_date')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });
      setAssignments(assignmentRows ?? []);
    }

    const { data: noteRows } = await supabase
      .from('personal_notes')
      .select('id, note_type, content, due_date, created_at')
      .eq('student_id', userData.user.id)
      .order('created_at', { ascending: false });
    setNotes(noteRows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount, ראה תבנית זהה ב-app/admin/page.tsx
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount, loadAll לא צריך לגרום ל-re-run
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
        <div className="mx-auto max-w-lg pt-10">
          <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
            <Icon icon="solar:arrow-right-linear" width={18} />
            חזרה לקטלוג
          </button>

          <MentorUpdatesSection assignments={assignments} notes={notes} />

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
        </div>
      </div>
    );
  }

  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <MentorUpdatesSection assignments={assignments} notes={notes} />

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
      </div>
    </div>
  );
}
