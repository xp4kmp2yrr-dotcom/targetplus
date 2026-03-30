import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export type TargetTxtEntry = {
  wordNo: string; // "0001"
  word: string;
  meaningJa: string;
  etymology: string;
};

type TargetTxtIndex = Map<string, TargetTxtEntry>;

let cachedIndex: TargetTxtIndex | null = null;
let cachedError: string | null = null;

function parseLine(line: string): TargetTxtEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("｜");
  // expected: 0001｜create｜創造する、想像する｜ラテン語 ...｜...
  if (parts.length < 4) return null;

  const wordNo = (parts[0] ?? "").trim();
  if (!/^\d{4}$/.test(wordNo)) return null;

  const word = (parts[1] ?? "").trim();
  const meaningJa = (parts[2] ?? "").trim();
  const etymology = (parts[3] ?? "").trim();

  if (!word || !etymology) return null;

  return { wordNo, word, meaningJa, etymology };
}

async function readBundledTargetTxt(): Promise<string> {
  const asset = Asset.fromModule(require("../assets/target.txt"));
  await asset.downloadAsync();

  const uri = asset.localUri ?? asset.uri;
  const text = await FileSystem.readAsStringAsync(uri);
  return text;
}

export async function getTargetTxtIndex(): Promise<{
  index: TargetTxtIndex | null;
  error: string | null;
}> {
  if (cachedIndex) return { index: cachedIndex, error: null };
  if (cachedError) return { index: null, error: cachedError };

  try {
    const text = await readBundledTargetTxt();
    const map: TargetTxtIndex = new Map();

    for (const rawLine of text.split(/\r?\n/)) {
      const entry = parseLine(rawLine);
      if (!entry) continue;
      if (!map.has(entry.wordNo)) {
        map.set(entry.wordNo, entry);
      }
    }

    if (map.size === 0) {
      cachedError = "語源データの読み込みに失敗しました。（データが空です）";
      return { index: null, error: cachedError };
    }

    cachedIndex = map;
    return { index: cachedIndex, error: null };
  } catch {
    cachedError = "語源データの読み込みに失敗しました。もう一度お試しください。";
    return { index: null, error: cachedError };
  }
}

export async function findEtymologyByWordNo(wordNo: string): Promise<{
  entry: TargetTxtEntry | null;
  error: string | null;
}> {
  const normalized = wordNo.trim().padStart(4, "0");
  const { index, error } = await getTargetTxtIndex();
  if (!index) return { entry: null, error };

  const entry = index.get(normalized) ?? null;
  if (!entry) {
    return {
      entry: null,
      error: "該当する単語番号が見つかりませんでした。",
    };
  }
  return { entry, error: null };
}

export function resetTargetTxtCache() {
  cachedIndex = null;
  cachedError = null;
}

