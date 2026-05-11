import { isKinyarwandaQuery } from './kinyarwandaCorpus';
import type { EvalCase } from './modelEvalCases';

export interface EvalResult {
  caseId: string;
  passed: boolean;
  score: number;          // 0-100
  latencyMs: number;
  output: string;
  checks: {
    label: string;
    pass: boolean;
    weight: number;
  }[];
  error?: string;
}

// Quick & reasonable language detector for output checking
function looksKinyarwanda(text: string): boolean {
  return isKinyarwandaQuery(text);
}
function looksEnglish(text: string): boolean {
  const en = /\b(the|and|is|are|with|for|that|this|of|to|in|on|you|your|can|should)\b/gi;
  return (text.match(en) || []).length >= 3;
}

export function scoreOutput(c: EvalCase, output: string, latencyMs: number, error?: string): EvalResult {
  const checks: EvalResult['checks'] = [];
  const lower = output.toLowerCase();

  if (error) {
    return {
      caseId: c.id,
      passed: false,
      score: 0,
      latencyMs,
      output,
      checks: [{ label: 'no error', pass: false, weight: 1 }],
      error,
    };
  }

  // 1. Length
  if (c.minLength != null) {
    checks.push({ label: `≥${c.minLength} chars`, pass: output.length >= c.minLength, weight: 1 });
  }
  if (c.maxLength != null) {
    checks.push({ label: `≤${c.maxLength} chars`, pass: output.length <= c.maxLength, weight: 0.5 });
  }

  // 2. Language
  if (c.expectLanguage === 'rw') {
    checks.push({ label: 'replies in Kinyarwanda', pass: looksKinyarwanda(output), weight: 2 });
  } else if (c.expectLanguage === 'en') {
    checks.push({ label: 'replies in English', pass: looksEnglish(output) && !looksKinyarwanda(output), weight: 1.5 });
  }

  // 3. Must include
  (c.mustInclude || []).forEach((s) => {
    checks.push({ label: `mentions "${s}"`, pass: lower.includes(s.toLowerCase()), weight: 1.5 });
  });

  // 4. Must NOT include
  (c.mustNotInclude || []).forEach((s) => {
    checks.push({ label: `avoids "${s}"`, pass: !lower.includes(s.toLowerCase()), weight: 1 });
  });

  // 5. Structure
  if (c.expectStructured) {
    const hasStructure = /(^|\n)#{1,6}\s|\n[-*]\s|```|\n\d+\.\s|\|.*\|/.test(output);
    checks.push({ label: 'uses markdown structure', pass: hasStructure, weight: 1 });
  }

  // 6. Citations
  if (c.expectCitations) {
    checks.push({ label: 'has inline citations [n]', pass: /\[\d+\]/.test(output), weight: 1 });
  }

  // 7. Universal: no AI cliché
  const clicheRe = /\b(as an ai|i am just an ai|i hope this helps|i'm sorry, but as)\b/i;
  checks.push({ label: 'no AI cliché', pass: !clicheRe.test(output), weight: 0.5 });

  const totalWeight = checks.reduce((s, x) => s + x.weight, 0);
  const earned = checks.reduce((s, x) => s + (x.pass ? x.weight : 0), 0);
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
  const passed = score >= 75 && checks.filter((x) => x.weight >= 1.5).every((x) => x.pass);

  return { caseId: c.id, passed, score, latencyMs, output, checks };
}
