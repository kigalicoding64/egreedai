// Test suite for EgreedAI model evaluation.
// Each case has a prompt and expectations the dashboard scores against.

export type EvalCategory = 'kinyarwanda' | 'professional' | 'reasoning' | 'code' | 'egreed-facts';

export interface EvalCase {
  id: string;
  category: EvalCategory;
  prompt: string;
  // Expected output signals
  expectLanguage?: 'rw' | 'en' | 'fr';
  mustInclude?: string[];      // case-insensitive substrings the answer should mention
  mustNotInclude?: string[];   // strings that indicate a bad answer (AI clichés, refusals)
  expectStructured?: boolean;  // headers / bullets / code
  expectCitations?: boolean;   // [1], [2] style
  minLength?: number;
  maxLength?: number;
}

export const EVAL_CASES: EvalCase[] = [
  // --- Kinyarwanda fluency ---
  {
    id: 'rw-greeting',
    category: 'kinyarwanda',
    prompt: 'Muraho! Amakuru yawe?',
    expectLanguage: 'rw',
    mustInclude: ['meza'],
    minLength: 20,
  },
  {
    id: 'rw-translate',
    category: 'kinyarwanda',
    prompt: 'Sobanura mu Kinyarwanda icyo "Rukarabankaba" bivuga.',
    expectLanguage: 'rw',
    mustInclude: ['amaraso'],
    minLength: 80,
  },
  {
    id: 'rw-cultural',
    category: 'kinyarwanda',
    prompt: 'Ese Umuganda ni iki kandi ukorwa ryari mu Rwanda?',
    expectLanguage: 'rw',
    mustInclude: ['umuganda'],
    minLength: 100,
  },
  {
    id: 'rw-slang',
    category: 'kinyarwanda',
    prompt: 'Sha, bite? Mbwira amagambo y\'abaturage akoreshwa cyane mu Kigali.',
    expectLanguage: 'rw',
    minLength: 80,
  },

  // --- Professional / human-quality answers ---
  {
    id: 'pro-explain',
    category: 'professional',
    prompt: 'Explain the difference between TCP and UDP in 3 short paragraphs for a junior developer.',
    expectLanguage: 'en',
    mustInclude: ['tcp', 'udp'],
    mustNotInclude: ['as an ai', 'i hope this helps', 'i am just an ai'],
    expectStructured: true,
    minLength: 250,
    maxLength: 1800,
  },
  {
    id: 'pro-summary',
    category: 'professional',
    prompt: 'Summarize the pros and cons of remote work in a clean markdown table.',
    expectLanguage: 'en',
    mustInclude: ['|'],
    expectStructured: true,
    mustNotInclude: ['as an ai'],
    minLength: 200,
  },
  {
    id: 'pro-clarify',
    category: 'professional',
    prompt: 'Should I use Postgres or MongoDB?',
    expectLanguage: 'en',
    mustNotInclude: ['as an ai'],
    minLength: 150,
  },

  // --- Reasoning ---
  {
    id: 'reason-math',
    category: 'reasoning',
    prompt: 'A train leaves at 9:00 going 60km/h. Another leaves the same station at 9:30 going 90km/h same direction. When does the second catch up?',
    expectLanguage: 'en',
    mustInclude: ['11', '10:30'],
    minLength: 100,
  },
  {
    id: 'reason-logic',
    category: 'reasoning',
    prompt: 'If all bloops are razzies, and some razzies are lazzies, can we conclude that some bloops are lazzies? Explain.',
    expectLanguage: 'en',
    mustInclude: ['no', 'cannot'],
    minLength: 100,
  },

  // --- Code ---
  {
    id: 'code-react',
    category: 'code',
    prompt: 'Write a React TypeScript hook useDebounce(value, delay) with JSDoc.',
    expectLanguage: 'en',
    mustInclude: ['useState', 'useEffect', 'setTimeout'],
    expectStructured: true,
    minLength: 200,
  },

  // --- Egreed-specific factual grounding ---
  {
    id: 'egreed-who',
    category: 'egreed-facts',
    prompt: 'Who built EgreedAI and where are they based?',
    expectLanguage: 'en',
    mustInclude: ['egreed', 'kigali'],
    mustNotInclude: ['openai', 'anthropic', 'google built'],
    minLength: 80,
  },
  {
    id: 'egreed-ceo',
    category: 'egreed-facts',
    prompt: 'Who is the CEO of Egreed Technology?',
    expectLanguage: 'en',
    mustInclude: ['brayan'],
    minLength: 30,
  },
];
