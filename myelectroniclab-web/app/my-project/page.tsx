// Version: 4.1
// Title: My Project Page | Change from v4.0: UI/UX refinement pass (visual
// only, no behavior/logic change) - cards get stronger shadow/ring depth,
// progress bar uses the brand gradient, milestone circles get a subtle glow
// when active. Change from v3.1: (1) the free-text status is now
// a standalone, ALWAYS-VISIBLE textarea (no edit-mode toggle needed) titled
// "סטטוס הפרויקט" - per the request, this is the single most important
// element on the page (it's also the most important thing the mentor sees on
// their grid). Saves on blur. (2) the 8 milestones are now a horizontal
// X-axis timeline (numbered circles + connecting line, horizontally
// scrollable if needed) instead of a long vertical list of cards - clicking a
// step opens a small detail panel below for just that step (status + due
// date) instead of showing all 8 expanded at once. Important Data: one
// student_projects row per user (created on first visit here), with exactly 8
// student_milestones auto-seeded by a DB trigger. Progress % is computed
// client-side, not stored.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { MILESTONES, MilestoneStatus } from '@/lib/milestones';

type Project = { id: string; title: string; description: string; status_note: string };
type Milestone = {
  id: string;
  milestone_key: string;
  order_index: number;
  status: MilestoneStatus;
  due_date: string | null;
};

const STATUS_LABELS: Record<MilestoneStatus, string> = { not_started: 'טרם התחיל', in_progress: 'בתהליך', done: 'הושלם' };

function isOverdue(m: Milestone): boolean {
  if (!m.due_date || m.status === 'done') return false;
  return new Date(m.due_date) < new Date(new Date().toDateString());
}

function circleClasses(m: Milestone): string {
  if (isOverdue(m)) return 'bg-red-500 text-white shadow-[0_0_0_4px_rgba(239,68,68,0.15)]';
  if (m.status === 'done') return 'bg-green-500 text-white shadow-[0_0_0_4px_rgba(34,197,94,0.15)]';
  if (m.status === 'in_progress') return 'bg-amber-400 text-white shadow-[0_0_0_4px_rgba(251,191,36,0.15)]';
  return 'bg-brand-category text-brand-textsoft';
}

export default function MyProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  async function loadAll() {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data: proj } = await supabase
      .from('student_projects')
      .select('id, title, description, status_note')
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

  async function saveStatusNote() {
    if (!project) return;
    setStatusSaving(true);
    const supabase = getSupabaseAuthClient();
    await supabase.from('student_projects').update({ status_note: project.status_note }).eq('id', project.id);
    setStatusSaving(false);
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
          <div className="relative overflow-hidden rounded-2xl bg-brand-cardbg p-6 shadow-xl ring-1 ring-black/5 before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[linear-gradient(90deg,var(--header-grad-from),var(--header-grad-to))] before:content-['']">
            <h1 className="mb-1 flex items-center gap-2 text-lg font-bold text-brand-text">
              <Icon icon="solar:flag-bold" width={22} /> פרויקט הגמר שלי
            </h1>
            <p className="mb-5 text-sm text-brand-textsoft">עדיין לא פתחת מעקב לפרויקט - בוא נתחיל.</p>
            <div className="flex flex-col gap-3">
              <input
                placeholder="שם הפרויקט"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-name focus:ring-2 focus:ring-brand-name/40"
              />
              <textarea
                placeholder="תיאור קצר (אופציונלי)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="min-h-24 w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-name focus:ring-2 focus:ring-brand-name/40"
              />
              <button
                onClick={createProject}
                disabled={creating || !newTitle}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
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
  const selected = milestones.find((m) => m.id === selectedMilestoneId) ?? null;
  const selectedDef = selected ? MILESTONES.find((d) => d.key === selected.milestone_key) : null;

  return (
    <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <h1 className="mb-1 text-lg font-bold text-brand-text">{project.title || 'פרויקט הגמר שלי'}</h1>
        {project.description && <p className="mb-4 text-sm text-brand-textsoft">{project.description}</p>}

        {/* הכי חשוב בעמוד - תמיד גלוי, בלי מצב עריכה נפרד */}
        <div className="mb-4 rounded-2xl border-2 border-brand-linktext bg-brand-cardbg p-5 shadow-xl">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-text">
            <Icon icon="solar:chat-square-like-bold" width={18} className="text-brand-linktext" />
            סטטוס הפרויקט
            {statusSaving && <span className="text-xs font-normal text-brand-textsoft">(שומר...)</span>}
          </h2>
          <textarea
            value={project.status_note}
            onChange={(e) => setProject({ ...project, status_note: e.target.value })}
            onBlur={saveStatusNote}
            placeholder="באיזה מצב אתה נמצא עכשיו? לדוגמה: תקוע על חיבור החיישן, מחכה לתגובת המנחה..."
            className="min-h-20 w-full resize-none rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-linktext"
          />
        </div>

        <div className="mb-4 rounded-2xl bg-brand-cardbg p-5 shadow-lg ring-1 ring-black/5">
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-brand-textsoft">
            <span>התקדמות</span>
            <span className="text-brand-text">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-category">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--header-grad-from), var(--header-grad-to))' }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-brand-cardbg p-5 shadow-lg ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-bold text-brand-text">שלבי הפרויקט</h2>

          <div className="mb-2 flex items-start overflow-x-auto pb-2">
            {milestones.map((m, i) => {
              const def = MILESTONES.find((d) => d.key === m.milestone_key);
              return (
                <div key={m.id} className="flex shrink-0 items-start">
                  <button onClick={() => setSelectedMilestoneId(m.id)} className="flex w-16 flex-col items-center gap-1 px-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${circleClasses(m)} ${
                        selectedMilestoneId === m.id ? 'ring-2 ring-brand-linktext ring-offset-2 ring-offset-brand-cardbg' : ''
                      }`}
                    >
                      {m.status === 'done' ? <Icon icon="solar:check-circle-bold" width={16} /> : i + 1}
                    </div>
                    <span className="text-center text-[10px] leading-tight text-brand-textsoft">{def?.label ?? m.milestone_key}</span>
                  </button>
                  {i < milestones.length - 1 && <div className="mt-4 h-0.5 w-6 shrink-0 bg-brand-category" />}
                </div>
              );
            })}
          </div>

          {selected && selectedDef ? (
            <div className="mt-3 rounded-xl border border-brand-category p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-brand-text">{selectedDef.label}</span>
                <select
                  value={selected.status}
                  onChange={(e) => updateMilestone(selected.id, { status: e.target.value as MilestoneStatus })}
                  className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-bold text-brand-text outline-none"
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
                  value={selected.due_date ?? ''}
                  onChange={(e) => updateMilestone(selected.id, { due_date: e.target.value || null })}
                  className="rounded-lg border border-brand-category bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none"
                />
                {isOverdue(selected) && <span className="text-xs font-bold text-red-500">עבר תאריך היעד</span>}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-brand-textsoft">לחץ על שלב כדי לעדכן סטטוס ותאריך</p>
          )}
        </div>
      </div>
    </div>
  );
}
