// Version: 1.0
// Title: Chat Tool - Project Examples | Important Data: ports
// agentSearchProjectExamples_() from Code.gs, including: (1) name normalization
// to catch near-duplicate rows in the sheet/table itself (חניה/חנייה, "מערכת "
// prefix), (2) server-side filtering of any project already mentioned in the
// conversation history - deterministic, not relying on the model's own diligence.

import { getSupabaseServerClient } from './supabase-server';

const GENERIC_TERMS = ['project', 'idea', 'ideas', 'electronics', 'general', 'inspiration'];

function normalizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(מערכת|פרויקט)\s+/, '')
    .replace(/[^\u0590-\u05FFa-z0-9]/g, '')
    .replace(/יי/g, 'י')
    .trim();
}

export async function searchProjectExamplesTool(
  keywords: string[],
  priorAssistantText: string
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_examples')
    .select('project_name, explanation, suggested_components')
    .limit(200);

  if (error || !data) return [];

  const lowerKw = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  const isBroad =
    lowerKw.length === 0 || lowerKw.every((kw) => GENERIC_TERMS.includes(kw));

  const normalizedPriorText = normalizeProjectName(priorAssistantText || '');

  type Item = {
    projectName: string;
    explanation: string | null;
    suggestedComponents: string | null;
    _norm: string;
  };

  const all: Item[] = data
    .filter((r) => r.project_name)
    .map((r) => ({
      projectName: r.project_name,
      explanation: r.explanation,
      suggestedComponents: r.suggested_components,
      _norm: normalizeProjectName(r.project_name),
    }));

  // איחוד כפילויות/כמעט-כפילויות בתוך הטבלה עצמה
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (seen.has(item._norm)) return false;
    seen.add(item._norm);
    return true;
  });

  // סינון פיזי - כל פרויקט שכבר הוזכר בתשובה קודמת מוסר
  const remaining = deduped.filter(
    (item) => !normalizedPriorText.includes(item._norm)
  );

  const strip = (item: Item) => ({
    projectName: item.projectName,
    explanation: item.explanation,
    suggestedComponents: item.suggestedComponents,
  });

  if (isBroad) {
    const pool = [...remaining];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, 5).map(strip);
    if (picked.length < 3) {
      return {
        results: picked,
        note:
          'Most/all catalog examples already shown in this conversation. ' +
          'Invent fresh project ideas from your own general electronics knowledge instead.',
      };
    }
    return picked;
  }

  const filtered = remaining.filter((item) => {
    const haystack = `${item.projectName} ${item.explanation ?? ''} ${item.suggestedComponents ?? ''}`.toLowerCase();
    return lowerKw.some((kw) => haystack.includes(kw));
  });

  return filtered.slice(0, 3).map(strip);
}
