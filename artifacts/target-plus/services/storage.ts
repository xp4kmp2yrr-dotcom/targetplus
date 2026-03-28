import AsyncStorage from "@react-native-async-storage/async-storage";
import { SynonymAnalysis } from "./ai";

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

const SYNONYM_GROUPS_KEY = "@targetplus_synonym_groups";
const SEARCH_HISTORY_KEY = "@targetplus_search_history";

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
