// Version: 1.0
// Title: Project Milestones | Important Data: the 8 fixed stages of a student's
// final project, in order. Keys must match the seed_student_milestones()
// trigger in supabase_schema_v1.5_student_projects.sql exactly - this list is
// display-only (labels, order) and does NOT create/rename milestones itself.

export const MILESTONES = [
  { key: 'research', label: 'חקר ראשוני' },
  { key: 'buying_components', label: 'קניית רכיבים' },
  { key: 'waiting_components', label: 'מחכה לרכיבים' },
  { key: 'component_testing', label: 'ניסויים על רכיבים' },
  { key: 'project_book_started', label: 'התחלה של ספר פרויקט' },
  { key: 'proposal_submitted', label: 'הגשת הצעת הפרויקט' },
  { key: 'book_submitted', label: 'הגשת ספר הפרויקט' },
  { key: 'final_submission', label: 'הגשה סופית (תאריך הבחינה)' },
] as const;

export type MilestoneStatus = 'not_started' | 'in_progress' | 'done';
