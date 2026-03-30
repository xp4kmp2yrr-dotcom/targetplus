import AsyncStorage from "@react-native-async-storage/async-storage";
import { DerivativeAnalysis, SynonymAnalysis } from "./ai";

export type SynonymGroup = {
  id: string;
  words: string[];
  analysis: SynonymAnalysis | null;
  targetMeaning?: string;
  createdAt: number;
};

export type SearchHistoryItem = {
  word: string;
  searchedAt: number;
  saved?: boolean;
  tags?: string[];
};

export type DerivativeEntry = {
  id: string;
  term: string;
  targetMeaning?: string;
  analysis: DerivativeAnalysis | null;
  lastError?: string;
  createdAt: number;
};

export type EtymologySavedItem = {
  wordNo: string; // "0001"
  word: string;
  meaningJa: string;
  etymology: string;
  savedAt: number;
};

const SYNONYM_GROUPS_KEY = "@targetplus_synonym_groups";
const SEARCH_HISTORY_KEY = "@targetplus_search_history";
const DERIVATIVE_ENTRIES_KEY = "@targetplus_derivative_entries";
const ETYMOLOGY_SAVED_KEY = "@targetplus_etymology_saved";

export async function getSynonymGroups(): Promise<SynonymGroup[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNONYM_GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSynonymGroup(group: SynonymGroup): Promise<void> {
  const groups = await getSynonymGroups();
  const updated = [group, ...groups.filter((g) => g.id !== group.id)];
  await AsyncStorage.setItem(SYNONYM_GROUPS_KEY, JSON.stringify(updated));
}

export async function deleteSynonymGroup(id: string): Promise<void> {
  const groups = await getSynonymGroups();
  const updated = groups.filter((g) => g.id !== id);
  await AsyncStorage.setItem(SYNONYM_GROUPS_KEY, JSON.stringify(updated));
}

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToSearchHistory(word: string): Promise<void> {
  const history = await getSearchHistory();
  const existing = history.find((h) => h.word.toLowerCase() === word.toLowerCase());
  const filtered = history.filter((h) => h.word.toLowerCase() !== word.toLowerCase());
  // Preserve saved/tags if re-searching a saved word
  const newItem: SearchHistoryItem = {
    word,
    searchedAt: Date.now(),
    saved: existing?.saved,
    tags: existing?.tags,
  };
  const updated = [newItem, ...filtered].slice(0, 50);
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
}

export async function updateSearchHistoryItem(
  word: string,
  patch: Partial<Pick<SearchHistoryItem, "saved" | "tags">>
): Promise<void> {
  const history = await getSearchHistory();
  const updated = history.map((h) =>
    h.word.toLowerCase() === word.toLowerCase() ? { ...h, ...patch } : h
  );
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}

export async function getDerivativeEntries(): Promise<DerivativeEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(DERIVATIVE_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDerivativeEntry(entry: DerivativeEntry): Promise<void> {
  const entries = await getDerivativeEntries();
  const updated = [entry, ...entries.filter((e) => e.id !== entry.id)];
  await AsyncStorage.setItem(DERIVATIVE_ENTRIES_KEY, JSON.stringify(updated));
}

export async function deleteDerivativeEntry(id: string): Promise<void> {
  const entries = await getDerivativeEntries();
  const updated = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(DERIVATIVE_ENTRIES_KEY, JSON.stringify(updated));
}

export async function updateDerivativeEntry(
  id: string,
  patch: Partial<Pick<DerivativeEntry, "analysis" | "lastError" | "targetMeaning">>
): Promise<void> {
  const entries = await getDerivativeEntries();
  const updated = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
  await AsyncStorage.setItem(DERIVATIVE_ENTRIES_KEY, JSON.stringify(updated));
}

export async function getSavedEtymologies(): Promise<EtymologySavedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ETYMOLOGY_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEtymology(item: EtymologySavedItem): Promise<void> {
  const saved = await getSavedEtymologies();
  const updated = [
    item,
    ...saved.filter((s) => s.wordNo !== item.wordNo),
  ].slice(0, 200);
  await AsyncStorage.setItem(ETYMOLOGY_SAVED_KEY, JSON.stringify(updated));
}

export async function deleteSavedEtymology(wordNo: string): Promise<void> {
  const saved = await getSavedEtymologies();
  const updated = saved.filter((s) => s.wordNo !== wordNo);
  await AsyncStorage.setItem(ETYMOLOGY_SAVED_KEY, JSON.stringify(updated));
}
