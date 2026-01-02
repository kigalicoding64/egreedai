// Keywords and patterns that indicate a web search is needed
const CURRENT_INFO_KEYWORDS = [
  'latest', 'current', 'today', 'now', 'recent', 'new',
  'news', 'update', 'weather', 'price', 'stock',
  'what is happening', 'what\'s happening',
  'how is', 'where is', 'who is',
  'this week', 'this month', 'this year',
  '2024', '2025', '2026',
  'breaking', 'live', 'real-time', 'realtime',
];

const SEARCH_TRIGGER_PATTERNS = [
  /what.*(is|are).*(happening|going on)/i,
  /search.*(for|about)/i,
  /find.*(information|info|out)/i,
  /look up/i,
  /tell me about.*(latest|current|recent)/i,
  /how much (is|does|do)/i,
  /when (is|was|will)/i,
  /where (is|are|can)/i,
  /who (is|are|was)/i,
  /what.*(news|weather|price|stock)/i,
  /ubu.*(ni|iki)/i, // Kinyarwanda: "now is", "what is"
  /amakuru.*(mashya|ya)/i, // Kinyarwanda: "latest news"
  /actualit[eé]s?/i, // French: actualités
  /nouvelles?/i, // French: nouvelles
  /derni[eè]res?/i, // French: dernières
  /aujourd'hui/i, // French: today
];

const FACTUAL_QUESTION_PATTERNS = [
  /^who is/i,
  /^what is/i,
  /^where is/i,
  /^when (is|was|did)/i,
  /^how (much|many|old|long|far)/i,
  /capital of/i,
  /president of/i,
  /population of/i,
  /founder of/i,
  /ceo of/i,
];

export interface WebSearchDecision {
  shouldSearch: boolean;
  confidence: number;
  reason: string;
  searchQuery?: string;
}

export function shouldTriggerWebSearch(message: string): WebSearchDecision {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for explicit search request
  if (lowerMessage.startsWith('search:') || lowerMessage.startsWith('look up:')) {
    return {
      shouldSearch: true,
      confidence: 1.0,
      reason: 'Explicit search request',
      searchQuery: message.replace(/^(search:|look up:)/i, '').trim(),
    };
  }

  // Check for current info keywords
  let keywordMatches = 0;
  for (const keyword of CURRENT_INFO_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      keywordMatches++;
    }
  }

  // Check for search trigger patterns
  let patternMatches = 0;
  for (const pattern of SEARCH_TRIGGER_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      patternMatches++;
    }
  }

  // Check for factual questions
  let factualMatch = false;
  for (const pattern of FACTUAL_QUESTION_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      factualMatch = true;
      break;
    }
  }

  // Calculate confidence score
  const confidence = Math.min(
    1.0,
    (keywordMatches * 0.15) + (patternMatches * 0.25) + (factualMatch ? 0.3 : 0)
  );

  // Determine if we should search
  const shouldSearch = confidence >= 0.3;

  let reason = '';
  if (shouldSearch) {
    if (keywordMatches > 0 && patternMatches > 0) {
      reason = 'Current information keywords and question patterns detected';
    } else if (keywordMatches > 0) {
      reason = 'Current information keywords detected';
    } else if (patternMatches > 0) {
      reason = 'Question pattern detected';
    } else if (factualMatch) {
      reason = 'Factual question detected';
    }
  } else {
    reason = 'No indicators for web search';
  }

  return {
    shouldSearch,
    confidence,
    reason,
    searchQuery: shouldSearch ? message : undefined,
  };
}

export function formatSearchResults(
  answer: string,
  sources: Array<{ title: string; url: string; snippet: string }>
): string {
  let formatted = answer;

  if (sources && sources.length > 0) {
    formatted += '\n\n---\n\n**Sources:**\n';
    sources.forEach((source, index) => {
      formatted += `${index + 1}. [${source.title}](${source.url})\n`;
    });
  }

  return formatted;
}
