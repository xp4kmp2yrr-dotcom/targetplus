export type SynonymAnalysis = {
  sharedMeaning: string;
  nuances: Array<{ word: string; nuance: string }>;
  memoryTips: string;
  usageExamples: Array<{ word: string; example: string }>;
};

export type WordMeaning = {
  word: string;
  meaning: string;
  nuance: string;
  usageHints: string;
  similarWords: string;
  memoryTip: string;
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export async function analyzeSynonyms(words: string[]): Promise<SynonymAnalysis> {
  const response = await fetch(`${API_BASE}/ai/synonyms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<SynonymAnalysis>;
}

export async function searchWordMeaning(word: string): Promise<WordMeaning> {
  const response = await fetch(`${API_BASE}/ai/meaning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<WordMeaning>;
}
