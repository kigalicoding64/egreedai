import { supabase } from '@/integrations/supabase/client';

// Lightweight stopword list (en/fr/rw) to clean queries before scoring
const STOP = new Set([
  'the','a','an','and','or','of','to','in','on','for','is','are','was','were','be','been','being','it','this','that','these','those','i','you','we','they','he','she','my','your','our','their','what','who','when','where','why','how','do','does','did','can','could','should','would','will','about','please','tell','me','give','show',
  'le','la','les','un','une','des','de','du','et','ou','est','sont','que','qui','quoi','quand','où','comment','pourquoi','dans','sur','pour','avec','par','je','tu','nous','vous','ils','elles','mon','ton','son','ma','ta','sa',
  'ni','na','no','mu','ku','wa','ya','cya','za','iyi','iri','iki','aha','ariko','rero','kandi','cyangwa'
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿñæœ\u00C0-\u017F0-9'-]+/gi) || [])
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// Expand query: synonyms / morphological variants for better recall
function expandQuery(q: string): string[] {
  const toks = tokenize(q);
  const expansions = new Set<string>(toks);
  for (const t of toks) {
    // simple stem variants
    if (t.endsWith('s')) expansions.add(t.slice(0, -1));
    if (t.endsWith('ing')) expansions.add(t.slice(0, -3));
    if (t.endsWith('ed')) expansions.add(t.slice(0, -2));
    // Kinyarwanda morphology — strip common noun-class prefixes
    if (/^(umu|aba|igi|ibi|iki|ubu|aka|utu|uru|ama|in|im)/.test(t)) {
      expansions.add(t.replace(/^(umu|aba|igi|ibi|iki|ubu|aka|utu|uru|ama|in|im)/, ''));
    }
  }
  return [...expansions].slice(0, 16);
}

interface Doc { title: string; content: string; source_url?: string | null }

function score(doc: Doc, terms: string[]): number {
  const hay = (doc.title + ' ' + doc.content).toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!t) continue;
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    const m = hay.match(re);
    if (m) s += m.length + (doc.title.toLowerCase().includes(t) ? 5 : 0);
  }
  return s;
}

/** Retrieve top-k KB docs using query expansion + ranking. */
export async function retrieveKnowledge(query: string, userId: string, k = 4): Promise<string> {
  const terms = expandQuery(query);
  if (!terms.length) return '';
  // Postgres full-text websearch as recall step — fall back to all docs if it returns nothing
  const tsTerms = terms.slice(0, 8).join(' OR ');
  let { data: docs } = await supabase
    .from('knowledge_documents')
    .select('title, content, source_url')
    .eq('user_id', userId)
    .textSearch('content', tsTerms, { type: 'websearch' })
    .limit(20);
  if (!docs || docs.length === 0) {
    const fallback = await supabase
      .from('knowledge_documents')
      .select('title, content, source_url')
      .eq('user_id', userId)
      .limit(50);
    docs = fallback.data || [];
  }
  if (!docs.length) return '';
  const ranked = docs
    .map((d: any) => ({ d, s: score(d, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k);
  if (!ranked.length) return '';
  return '\n\n[Knowledge Base — ranked excerpts]:\n' + ranked
    .map(({ d }, i) => `### [KB ${i + 1}] ${d.title}${d.source_url ? ` (${d.source_url})` : ''}\n${(d.content || '').slice(0, 1800)}`)
    .join('\n\n');
}
