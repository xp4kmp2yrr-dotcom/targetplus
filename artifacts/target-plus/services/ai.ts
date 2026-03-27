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
