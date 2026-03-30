import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { searchWordMeaning, WordMeaning } from "@/services/ai";
import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  SearchHistoryItem,
  updateSearchHistoryItem,
} from "@/services/storage";
import ChatSection from "@/components/ChatSection";

/* ─── Tag Editor ─── */
type TagEditorProps = {
  initialTags: string[];
  onSave: (tags: string[]) => void;
  onCancel: () => void;
};

function TagEditor({ initialTags, onSave, onCancel }: TagEditorProps) {
  const [input, setInput] = useState(initialTags.join(", "));

  const handleConfirm = () => {
    const tags = input
      .split(/[,、]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    onSave(tags);
  };

  return (
    <View style={teStyles.container}>
      <View style={teStyles.labelRow}>
        <Feather name="tag" size={13} color={Colors.light.tint} />
        <Text style={teStyles.label}>タグを入力</Text>
      </View>
      <TextInput
        style={teStyles.input}
        value={input}
        onChangeText={setInput}
        placeholder="例：名詞, 頻出"
        placeholderTextColor={Colors.light.textTertiary}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />
      <View style={teStyles.btnRow}>
        <Pressable onPress={onCancel} style={[teStyles.btn, teStyles.cancelBtn]}>
          <Text style={teStyles.cancelBtnText}>キャンセル</Text>
        </Pressable>
        <Pressable onPress={handleConfirm} style={[teStyles.btn, teStyles.saveBtn]}>
          <Feather name="check" size={14} color="#fff" />
          <Text style={teStyles.saveBtnText}>保存する</Text>
        </Pressable>
      </View>
    </View>
  );
}

const teStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.tint + "0D",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.tint + "30",
    marginBottom: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },
  input: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  btnRow: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  cancelBtn: { backgroundColor: Colors.light.backgroundTertiary, borderWidth: 1, borderColor: Colors.light.border },
  cancelBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  saveBtn: { backgroundColor: Colors.light.tint },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

/* ─── Result Card ─── */
type ResultCardProps = {
  result: WordMeaning;
  savedInfo: { saved: boolean; tags: string[] };
  onSavePress: () => void;
};

function MeaningResultCard({ result, savedInfo, onSavePress }: ResultCardProps) {
  return (
    <View style={styles.resultCard}>
      {/* Word header */}
      <View style={styles.wordHeader}>
        <View style={styles.wordHeaderLeft}>
          <Text style={styles.wordText}>{result.word}</Text>
          {result.partOfSpeech ? (
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{result.partOfSpeech}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.wordHeaderRight}>
          {result.coreImage ? (
            <View style={styles.coreImageBox}>
              <Text style={styles.coreImageEmoji}>💡</Text>
              <Text style={styles.coreImageText}>{result.coreImage}</Text>
            </View>
          ) : null}
          {/* Save button */}
          <Pressable
            onPress={onSavePress}
            style={({ pressed }) => [
              styles.saveHeaderBtn,
              savedInfo.saved && styles.saveHeaderBtnSaved,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather
              name={savedInfo.saved ? "bookmark" : "bookmark"}
              size={14}
              color={savedInfo.saved ? "#fff" : Colors.light.textSecondary}
            />
            <Text
              style={[
                styles.saveHeaderBtnText,
                savedInfo.saved && styles.saveHeaderBtnTextSaved,
              ]}
            >
              {savedInfo.saved ? "保存済み" : "保存"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tags display (when saved and has tags) */}
      {savedInfo.saved && savedInfo.tags.length > 0 && (
        <View style={styles.tagsRow}>
          <Feather name="tag" size={11} color={Colors.light.tint} />
          {savedInfo.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Meanings */}
      {result.meanings?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>📖</Text>
            <Text style={styles.blockLabel}>意味</Text>
          </View>
          <View style={styles.table}>
            {result.meanings.map((m, i) => (
              <View key={i} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
                <View style={styles.posCell}>
                  <Text style={styles.posTag}>{m.pos}</Text>
                </View>
                <Text style={styles.meaningJa}>{m.ja}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Usage Points */}
      {result.usagePoints?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>✅</Text>
            <Text style={styles.blockLabel}>使い方のポイント</Text>
          </View>
          <View style={styles.pointsList}>
            {result.usagePoints.map((pt, i) => (
              <View key={i} style={styles.pointRow}>
                <Text style={styles.pointBullet}>·</Text>
                <Text style={styles.pointText}>{pt}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Examples */}
      {result.examples?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>✏️</Text>
            <Text style={styles.blockLabel}>例文</Text>
          </View>
          <View style={styles.examplesBox}>
            {result.examples.map((ex, i) => (
              <View key={i} style={[styles.exampleItem, i > 0 && { marginTop: 10 }]}>
                <Text style={styles.exampleEn}>{ex.en}</Text>
                <Text style={styles.exampleJa}>{ex.ja}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* vs Words */}
      {result.vsWords?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>⚖️</Text>
            <Text style={styles.blockLabel}>類語との違い</Text>
          </View>
          <View style={styles.table}>
            {result.vsWords.map((v, i) => (
              <View key={i} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
                <View style={styles.vsWordCell}>
                  <Text style={styles.vsWord}>{v.word}</Text>
                </View>
                <Text style={styles.vsDiff}>{v.diff}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Memory Tip */}
      {result.memoryTip ? (
        <View style={styles.memoryBox}>
          <Text style={styles.memoryIcon}>🧠</Text>
          <View style={styles.memoryContent}>
            <Text style={styles.memoryLabel}>覚え方</Text>
            <Text style={styles.memoryText}>{result.memoryTip}</Text>
          </View>
        </View>
      ) : null}

      {/* Chat */}
      <ChatSection contextType="meaning" word={result.word} analysis={result} />
    </View>
  );
}

/* ─── Main Screen ─── */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [query, setQuery] = useState("");
  const [targetMeaning, setTargetMeaning] = useState("");
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [result, setResult] = useState<WordMeaning | null>(null);
  const [wordNotFound, setWordNotFound] = useState(false);
  const [wordError, setWordError] = useState(""); // inline input error
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedInfo, setSavedInfo] = useState<{ saved: boolean; tags: string[] }>({
    saved: false,
    tags: [],
  });
  const [showTagEditor, setShowTagEditor] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    const h = await getSearchHistory();
    setHistory(h);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync savedInfo when result changes
  const syncSavedInfo = useCallback(
    async (word: string) => {
      const h = await getSearchHistory();
      const item = h.find((i) => i.word.toLowerCase() === word.toLowerCase());
      setSavedInfo({ saved: item?.saved ?? false, tags: item?.tags ?? [] });
    },
    []
  );

  const validateWord = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) { setWordError("単語を入力してください。"); return false; }
    if (/[\s,、]+/.test(trimmed)) {
      setWordError("1つの単語のみ入力してください。\n（スペース・カンマは使用不可）");
      return false;
    }
    setWordError("");
    return true;
  };

  const doSearch = async (word: string, force = false) => {
    if (!validateWord(word)) return;
    const trimmed = word.trim();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (force) setIsRebooting(true); else setIsSearching(true);
    setResult(null);
    setWordNotFound(false);
    setShowTagEditor(false);

    try {
      const meaning = await searchWordMeaning(
        trimmed,
        targetMeaning.trim() || undefined,
        force
      );

      if (meaning.exists === false) {
        setWordNotFound(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setResult(meaning);
        await addToSearchHistory(trimmed);
        const h = await getSearchHistory();
        setHistory(h);
        await syncSavedInfo(trimmed);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("エラー", "検索中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSearching(false);
      setIsRebooting(false);
    }
  };

  const handleSearch = () => doSearch(query);
  const handleForceReboot = () => doSearch(query, true);

  const handleSavePress = async () => {
    if (!result) return;
    if (!savedInfo.saved) {
      // First save – open tag editor
      setShowTagEditor(true);
    } else {
      // Already saved – re-open tag editor to edit tags
      setShowTagEditor(true);
    }
    Haptics.selectionAsync();
  };

  const handleTagSave = async (tags: string[]) => {
    if (!result) return;
    setShowTagEditor(false);
    const newInfo = { saved: true, tags };
    setSavedInfo(newInfo);
    await updateSearchHistoryItem(result.word, newInfo);
    const h = await getSearchHistory();
    setHistory(h);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (wordError) setWordError("");
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>意味検索</Text>
          <View style={styles.aiBadge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.aiBadgeText}>AI利用</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>英単語を1つ入力して日本語で調べる</Text>

        {/* Search input row */}
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, wordError ? styles.inputError : null]}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="英単語を1つ入力..."
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {wordError ? (
              <Text style={styles.inputErrorText}>{wordError}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => { setShowTargetInput((v) => !v); Haptics.selectionAsync(); }}
            style={[styles.iconBtn, showTargetInput && styles.iconBtnActive]}
          >
            <Feather name="book" size={18} color={showTargetInput ? Colors.light.tint : Colors.light.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleSearch}
            disabled={isSearching || isRebooting || !query.trim()}
            style={({ pressed }) => [
              styles.searchBtn,
              (isSearching || isRebooting || !query.trim()) && styles.searchBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="search" size={20} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Target meaning input */}
        {showTargetInput && (
          <View style={styles.targetInputWrapper}>
            <View style={styles.targetInputLabelRow}>
              <Feather name="book-open" size={12} color={Colors.light.accent} />
              <Text style={styles.targetInputLabel}>ターゲットの意味（任意）</Text>
            </View>
            <TextInput
              style={styles.targetInput}
              value={targetMeaning}
              onChangeText={setTargetMeaning}
              placeholder="例：① 巨大な ② 莫大な"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              returnKeyType="done"
            />
          </View>
        )}

        {(isSearching || isRebooting) && (
          <Text style={styles.searchingText}>
            {isRebooting ? "🔄 AI強制リブート中..." : "AI解析中..."}
          </Text>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Word not found ── */}
        {wordNotFound && (
          <View style={styles.notFoundCard}>
            {/* Error */}
            <View style={styles.notFoundErrorRow}>
              <Feather name="alert-circle" size={18} color="#C0392B" />
              <Text style={styles.notFoundErrorText}>
                その単語は存在しません。もう一度スペル等を確認し、再出力してください。
              </Text>
            </View>

            {/* Warning */}
            <View style={styles.notFoundWarningRow}>
              <Feather name="info" size={14} color="#856404" />
              <Text style={styles.notFoundWarningText}>
                AIが誤認し、不正確な情報を分析する場合があります。何度やっても存在しないなどのエラーが出た場合には、下の強制再起動ボタンをタップしてください。
              </Text>
            </View>

            {/* Force Reboot button */}
            <Pressable
              onPress={handleForceReboot}
              disabled={isRebooting}
              style={({ pressed }) => [
                styles.rebootBtn,
                pressed && { opacity: 0.85 },
                isRebooting && styles.rebootBtnDisabled,
              ]}
            >
              {isRebooting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#fff" />
              )}
              <Text style={styles.rebootBtnText}>
                {isRebooting ? "リブート中..." : "AI強制リブート"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Tag Editor ── */}
        {showTagEditor && result && (
          <TagEditor
            initialTags={savedInfo.tags}
            onSave={handleTagSave}
            onCancel={() => setShowTagEditor(false)}
          />
        )}

        {/* ── Result Card ── */}
        {result && (
          <MeaningResultCard
            result={result}
            savedInfo={savedInfo}
            onSavePress={handleSavePress}
          />
        )}

        {/* ── Search History ── */}
        {!result && !wordNotFound && history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historySectionTitle}>検索履歴</Text>
              <Pressable onPress={handleClearHistory} hitSlop={8}>
                <Text style={styles.clearText}>クリア</Text>
              </Pressable>
            </View>
            <View style={styles.historyList}>
              {history.map((item) => (
                <Pressable
                  key={item.word + item.searchedAt}
                  style={({ pressed }) => [styles.historyItem, pressed && { opacity: 0.7 }]}
                  onPress={() => { setQuery(item.word); doSearch(item.word); }}
                >
                  <View style={styles.historyItemLeft}>
                    <View style={styles.historyItemTop}>
                      {item.saved ? (
                        <View style={styles.historyBookmarkBadge}>
                          <Feather name="bookmark" size={10} color="#fff" />
                        </View>
                      ) : (
                        <Feather name="clock" size={13} color={Colors.light.textTertiary} />
                      )}
                      <Text style={styles.historyWord}>{item.word}</Text>
                    </View>
                    {item.saved && item.tags && item.tags.length > 0 && (
                      <View style={styles.historyTagRow}>
                        {item.tags.map((tag) => (
                          <View key={tag} style={styles.historyTagChip}>
                            <Text style={styles.historyTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Feather name="chevron-right" size={15} color={Colors.light.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Empty State ── */}
        {!result && !wordNotFound && history.length === 0 && !isSearching && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="search" size={36} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>英単語を検索しよう</Text>
            <Text style={styles.emptyDesc}>
              意味・ニュアンス・使い方・類語との違い{"\n"}
              覚え方のコツをAIが解説します{"\n\n"}
              <Text style={styles.emptyDescAccent}>本のアイコン</Text>
              {"でターゲットの意味を追加\n入力することもできます。"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.navy },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginBottom: 14 },
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.light.tint + "18", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.light.tint + "30",
  },
  aiBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },

  inputRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  inputWrap: { flex: 1 },
  input: {
    height: 50, borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: 14,
    paddingHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 15,
    color: Colors.light.text, backgroundColor: Colors.light.backgroundTertiary,
  },
  inputError: { borderColor: "#E63946" },
  inputErrorText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#E63946", marginTop: 5, marginLeft: 4 },
  iconBtn: {
    width: 44, height: 50, alignItems: "center", justifyContent: "center",
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  iconBtnActive: { borderColor: Colors.light.tint, backgroundColor: Colors.light.tint + "12" },
  searchBtn: {
    width: 50, height: 50, backgroundColor: Colors.light.tint, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  searchBtnDisabled: { backgroundColor: Colors.light.textTertiary, shadowOpacity: 0, elevation: 0 },
  targetInputWrapper: {
    marginTop: 10, backgroundColor: Colors.light.accent + "0D", borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.light.accent + "30",
  },
  targetInputLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  targetInputLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.accent,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  targetInput: { minHeight: 36, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.text, paddingVertical: 0 },
  searchingText: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.tint },

  scrollContent: { padding: 16 },

  /* ── Not Found ── */
  notFoundCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16, borderWidth: 1, borderColor: "#F5C6C6",
    overflow: "hidden", marginBottom: 16,
  },
  notFoundErrorRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#FFF0F0", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F5C6C6",
  },
  notFoundErrorText: {
    flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C0392B", lineHeight: 21,
  },
  notFoundWarningRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FFFBEC", padding: 14, borderBottomWidth: 1, borderBottomColor: "#FFE082",
  },
  notFoundWarningText: {
    flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#5D4037", lineHeight: 19,
  },
  rebootBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    margin: 14, backgroundColor: "#C0392B", borderRadius: 12, paddingVertical: 12,
  },
  rebootBtnDisabled: { backgroundColor: Colors.light.textTertiary },
  rebootBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  /* ── Result Card ── */
  resultCard: {
    backgroundColor: Colors.light.card, borderRadius: 18, borderWidth: 1,
    borderColor: Colors.light.cardBorder, overflow: "hidden",
    shadowColor: Colors.light.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4, marginBottom: 16,
  },
  wordHeader: {
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.light.navy,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  wordHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, flexShrink: 1 },
  wordHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordText: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  posBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  posText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  coreImageBox: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 9, maxWidth: 110,
  },
  coreImageEmoji: { fontSize: 13 },
  coreImageText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFE066", flexShrink: 1 },
  saveHeaderBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  saveHeaderBtnSaved: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  saveHeaderBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
  saveHeaderBtnTextSaved: { color: "#fff" },

  /* Tags row */
  tagsRow: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.light.tint + "0A",
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  tagChip: {
    backgroundColor: Colors.light.tint + "20", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: Colors.light.tint + "30",
  },
  tagChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },

  block: { paddingHorizontal: 16, paddingTop: 14 },
  blockLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  blockIcon: { fontSize: 14 },
  blockLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary, textTransform: "uppercase", letterSpacing: 0.6 },

  table: { borderRadius: 10, borderWidth: 1, borderColor: Colors.light.border, overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundTertiary },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: Colors.light.border },
  posCell: { width: 90, marginRight: 10 },
  posTag: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.tint, backgroundColor: Colors.light.tint + "18", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: "flex-start" },
  meaningJa: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  vsWordCell: { width: 90, marginRight: 10 },
  vsWord: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.accent },
  vsDiff: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text },

  pointsList: { gap: 6 },
  pointRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pointBullet: { fontSize: 18, color: Colors.light.tint, lineHeight: 22, marginTop: -1 },
  pointText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text, lineHeight: 21 },

  examplesBox: { backgroundColor: "#F0F7FF", borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.light.accent },
  exampleItem: {},
  exampleEn: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.navy, fontStyle: "italic" },
  exampleJa: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2 },

  memoryBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    margin: 16, marginTop: 14, backgroundColor: "#FFF8E1", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#FFD54F",
  },
  memoryIcon: { fontSize: 22, lineHeight: 26 },
  memoryContent: { flex: 1 },
  memoryLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#856404", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  memoryText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#5D4037", lineHeight: 21 },

  /* ── History ── */
  historySection: { marginTop: 4 },
  historySectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  historySectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.tint },
  historyList: { gap: 6 },
  historyItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.light.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  historyItemLeft: { flex: 1, gap: 5 },
  historyItemTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyBookmarkBadge: {
    width: 18, height: 18, borderRadius: 5, backgroundColor: Colors.light.tint,
    alignItems: "center", justifyContent: "center",
  },
  historyWord: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  historyTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  historyTagChip: {
    backgroundColor: Colors.light.tint + "15", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1, borderColor: Colors.light.tint + "28",
  },
  historyTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },

  /* ── Empty ── */
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.backgroundTertiary, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, textAlign: "center", lineHeight: 21 },
  emptyDescAccent: { fontFamily: "Inter_600SemiBold", color: Colors.light.accent },
});
