export type SynonymNuance = {
  word: string;
  formalLevel: string;
  point: string;
  scene: string;
};

export type SynonymExample = {
  word: string;
  example: string;
  ja: string;
};

export type SynonymAnalysis = {
  sharedImage: string;
  nuances: SynonymNuance[];
  memoryTip: string;
  usageExamples: SynonymExample[];
};

export type WordMeaningEntry = {
  pos: string;
  ja: string;
};

export type VsWord = {
  word: string;
  diff: string;
};

export type WordExample = {
  en: string;
  ja: string;
};

export type WordMeaning = {
  word: string;
  partOfSpeech: string;
  coreImage: string;
  meanings: WordMeaningEntry[];
  usagePoints: string[];
  vsWords: VsWord[];
  examples: WordExample[];
  memoryTip: string;
};

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export async function analyzeSynonyms(
  words: string[],
  targetMeaning?: string
): Promise<SynonymAnalysis> {
  const response = await fetch(`${API_BASE}/ai/synonyms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words, targetMeaning }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<SynonymAnalysis>;
}

export async function searchWordMeaning(
  word: string,
  targetMeaning?: string
): Promise<WordMeaning> {
  const response = await fetch(`${API_BASE}/ai/meaning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, targetMeaning }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<WordMeaning>;
}

export async function chatWithAI(params: {
  contextType: "meaning" | "synonyms";
  word?: string;
  words?: string[];
  analysis: unknown;
  question: string;
  history: ChatMessage[];
}): Promise<string> {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${response.status}`);
  }
  const data = (await response.json()) as { answer: string };
  return data.answer;
}
