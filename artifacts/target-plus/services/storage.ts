import AsyncStorage from "@react-native-async-storage/async-storage";
import { SynonymAnalysis } from "./ai";

export type SynonymGroup = {
  id: string;
  words: string[];
  analysis: SynonymAnalysis | null;
  createdAt: number;
};

export type SearchHistoryItem = {
  word: string;
  searchedAt: number;
};

const SYNONYM_GROUPS_KEY = "@targetplus_synonym_groups";
const SEARCH_HISTORY_KEY = "@targetplus_search_history";
const API_KEY_KEY = "@targetplus_api_key";

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
  const filtered = history.filter(
    (h) => h.word.toLowerCase() !== word.toLowerCase()
  );
  const updated = [{ word, searchedAt: Date.now() }, ...filtered].slice(0, 20);
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}

export async function getApiKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(API_KEY_KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_KEY, key);
}
