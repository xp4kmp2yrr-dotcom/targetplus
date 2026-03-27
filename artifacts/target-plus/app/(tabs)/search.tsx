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
} from "@/services/storage";

const FORMAL_LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  くだけた: { bg: "#FFF3CD", text: "#856404" },
  ふつう: { bg: "#D1ECF1", text: "#0C5460" },
  フォーマル: { bg: "#D4EDDA", text: "#155724" },
};

function MeaningResultCard({ result }: { result: WordMeaning }) {
  return (
    <View style={styles.resultCard}>
      {/* Word + pos + core image */}
      <View style={styles.wordHeader}>
        <View style={styles.wordHeaderLeft}>
          <Text style={styles.wordText}>{result.word}</Text>
          {result.partOfSpeech ? (
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{result.partOfSpeech}</Text>
            </View>
          ) : null}
        </View>
        {result.coreImage ? (
          <View style={styles.coreImageBox}>
            <Text style={styles.coreImageEmoji}>💡</Text>
            <Text style={styles.coreImageText}>{result.coreImage}</Text>
          </View>
        ) : null}
      </View>

      {/* Meanings */}
      {result.meanings?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>📖</Text>
            <Text style={styles.blockLabel}>意味</Text>
          </View>
          <View style={styles.meaningsTable}>
            {result.meanings.map((m, i) => (
              <View key={i} style={[styles.meaningRow, i > 0 && styles.meaningRowBorder]}>
                <View style={styles.meaningPosCell}>
                  <Text style={styles.meaningPos}>{m.pos}</Text>
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
          <View style={styles.vsTable}>
            {result.vsWords.map((v, i) => (
              <View key={i} style={[styles.vsRow, i > 0 && styles.vsRowBorder]}>
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
    </View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<WordMeaning | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const inputRef = useRef<TextInput>(null);

  const loadData = useCallback(async () => {
    const h = await getSearchHistory();
    setHistory(h);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (word?: string) => {
    const searchWord = (word ?? query).trim();
    if (!searchWord) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearching(true);
    setResult(null);

    try {
      const meaning = await searchWordMeaning(searchWord);
      setResult(meaning);
      await addToSearchHistory(searchWord);
      setHistory(await getSearchHistory());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("エラー", "検索中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>意味検索</Text>
          <View style={styles.aiBadge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>英単語の意味・ニュアンスを日本語で調べる</Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="英単語を入力..."
            placeholderTextColor={Colors.light.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            style={({ pressed }) => [
              styles.searchBtn,
              isSearching || !query.trim() ? styles.searchBtnDisabled : {},
              pressed ? { opacity: 0.85 } : {},
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="search" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
        {isSearching && (
          <Text style={styles.searchingText}>AI解析中...</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {result && <MeaningResultCard result={result} />}

        {/* Search History */}
        {!result && history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historySectionTitle}>最近の検索</Text>
              <Pressable onPress={handleClearHistory} hitSlop={8}>
                <Text style={styles.clearText}>クリア</Text>
              </Pressable>
            </View>
            <View style={styles.historyChips}>
              {history.map((item) => (
                <Pressable
                  key={item.word + item.searchedAt}
                  style={({ pressed }) => [
                    styles.historyChip,
                    pressed ? { opacity: 0.7 } : {},
                  ]}
                  onPress={() => {
                    setQuery(item.word);
                    handleSearch(item.word);
                  }}
                >
                  <Feather name="clock" size={12} color={Colors.light.textTertiary} />
                  <Text style={styles.historyChipText}>{item.word}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!result && history.length === 0 && !isSearching && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="search" size={36} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>英単語を検索しよう</Text>
            <Text style={styles.emptyDesc}>
              意味・ニュアンス・使い方・類語との違い{"\n"}覚え方のコツをAIが解説します
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.navy,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 14,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.tint + "30",
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  searchBtn: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBtnDisabled: { backgroundColor: Colors.light.textTertiary, shadowOpacity: 0, elevation: 0 },
  searchingText: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.tint },
  scrollContent: { padding: 16 },

  /* Result Card */
  resultCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: Colors.light.navy,
  },
  wordHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  wordText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  posBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  posText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  coreImageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: 140,
  },
  coreImageEmoji: { fontSize: 14 },
  coreImageText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFE066", flexShrink: 1 },

  block: { paddingHorizontal: 16, paddingTop: 14 },
  blockLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  blockIcon: { fontSize: 14 },
  blockLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* Meanings table */
  meaningsTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  meaningRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  meaningRowBorder: { borderTopWidth: 1, borderTopColor: Colors.light.border },
  meaningPosCell: {
    width: 90,
    marginRight: 10,
  },
  meaningPos: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  meaningJa: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },

  /* Usage Points */
  pointsList: { gap: 6 },
  pointRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pointBullet: { fontSize: 18, color: Colors.light.tint, lineHeight: 22, marginTop: -1 },
  pointText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text, lineHeight: 21 },

  /* Examples */
  examplesBox: {
    backgroundColor: "#F0F7FF",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.accent,
  },
  exampleItem: {},
  exampleEn: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.navy, fontStyle: "italic" },
  exampleJa: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2 },

  /* vs Words table */
  vsTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  vsRowBorder: { borderTopWidth: 1, borderTopColor: Colors.light.border },
  vsWordCell: { width: 90, marginRight: 10 },
  vsWord: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.light.accent,
  },
  vsDiff: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text },

  /* Memory Tip */
  memoryBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 16,
    marginTop: 14,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFD54F",
  },
  memoryIcon: { fontSize: 22, lineHeight: 26 },
  memoryContent: { flex: 1 },
  memoryLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#856404", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  memoryText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#5D4037", lineHeight: 21 },

  /* History */
  historySection: { marginTop: 8 },
  historySectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  historySectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.tint },
  historyChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  historyChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },

  /* Empty */
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 21,
  },
});
