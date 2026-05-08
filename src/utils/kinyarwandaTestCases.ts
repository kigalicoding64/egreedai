// Shared test cases used by both Vitest and the in-app eval dashboard.
export interface RwCase { text: string; expected: boolean; note: string }

export const KINYARWANDA_TEST_CASES: RwCase[] = [
  // --- TRUE: actually Kinyarwanda ---
  { text: "Muraho neza, amakuru yawe?", expected: true, note: "Greeting + question" },
  { text: "Ndashaka kumenya uko nkora iki gitabo", expected: true, note: "Common verbs/nouns" },
  { text: "Sobanura ijambo Rukarabankaba", expected: true, note: "Intent: explain RW term" },
  { text: "Bite sha, urakoze cyane", expected: true, note: "Slang + thanks" },
  { text: "Mwaramutse, ndi muzima", expected: true, note: "Morning greeting" },
  { text: "Translate to Kinyarwanda: how are you", expected: true, note: "Explicit intent" },
  { text: "Imana ikurinde, murabeho", expected: true, note: "Farewell + Imana" },

  // --- FALSE: not Kinyarwanda (English, French, mixed loanwords) ---
  { text: "How are you today?", expected: false, note: "Plain English" },
  { text: "What is the capital of Rwanda?", expected: false, note: "English about Rwanda" },
  { text: "Bonjour, comment ça va?", expected: false, note: "French" },
  { text: "I love umuganda day", expected: false, note: "English with 1 RW loanword" },
  { text: "Tell me about Kigali nightlife", expected: false, note: "English about RW location" },
  { text: "Write code for a React button", expected: false, note: "Tech English" },
  { text: "Explain inyenzi historical context", expected: true, note: "Strong RW term triggers" },
  { text: "hi", expected: false, note: "Too short" },
  { text: "Sha", expected: false, note: "1 slang token only" },
  { text: "What is umuganda?", expected: false, note: "English question with 1 RW noun" },
];
