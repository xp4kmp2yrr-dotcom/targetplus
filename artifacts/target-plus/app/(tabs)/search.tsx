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

type ResultSectionProps = {
  icon: string;
  iconColor: string;
  label: string;
  content: string;
  bgColor?: string;
  borderColor?: string;
};

function ResultSection({
  icon,
  iconColor,
  label,
  content,
  bgColor,
  borderColor,
}: ResultSectionProps) {
  return (
    <View style={resultSectionStyles.section}>
      <View style={resultSectionStyles.labelRow}>
        <Feather name={icon as any} size={14} color={iconColor} />
        <Text style={resultSectionStyles.label}>{label}</Text>
      </View>
      <View
        style={[
          resultSectionStyles.contentBox,
          bgColor ? { backgroundColor: bgColor } : {},
          borderColor ? { borderLeftWidth: 3, borderLeftColor: borderColor } : {},
        ]}
      >
        <Text style={resultSectionStyles.content}>{content}</Text>
      </View>
    </View>
  );
}

const resultSectionStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contentBox: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    padding: 14,
  },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 22,
  },
});

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
    } catch (e) {
      Alert.alert("エラー", "検索中にエラーが発生しました。しばらく後にもう一度お試しください。");
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
            <Text style={styles.aiBadgeText}>Gemini AI</Text>
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
          <Text style={styles.searchingText}>Gemini AIが解析中...</Text>
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
        {/* Search Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultWordHeader}>
              <Text style={styles.resultWord}>{result.word}</Text>
              <View style={styles.resultBadge}>
                <Feather name="zap" size={11} color={Colors.light.tint} />
                <Text style={styles.resultBadgeText}>AI解析</Text>
              </View>
            </View>

            <ResultSection
              icon="book-open"
              iconColor={Colors.light.navy}
              label="意味"
              content={result.meaning}
              bgColor={Colors.light.navy + "0C"}
              borderColor={Colors.light.navy}
            />
            <ResultSection
              icon="layers"
              iconColor={Colors.light.accent}
              label="ニュアンス"
              content={result.nuance}
              bgColor={Colors.light.accent + "0F"}
              borderColor={Colors.light.accent}
            />
            <ResultSection
              icon="map"
              iconColor="#2D9A6C"
              label="使い方のヒント"
              content={result.usageHints}
              bgColor="#2D9A6C0D"
              borderColor="#2D9A6C"
            />
            <ResultSection
              icon="git-branch"
              iconColor="#8B5CF6"
              label="類語との違い"
              content={result.similarWords}
              bgColor="#8B5CF60D"
              borderColor="#8B5CF6"
            />
            <ResultSection
              icon="zap"
              iconColor="#F0A500"
              label="覚え方のコツ"
              content={result.memoryTip}
              bgColor="#FFF8E7"
              borderColor="#F0A500"
            />
          </View>
        )}

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

        {/* Empty state */}
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
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
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
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
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
  searchBtnDisabled: {
    backgroundColor: Colors.light.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  searchingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
  },
  scrollContent: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  resultWordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  resultWord: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.navy,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resultBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  historySection: {
    marginTop: 8,
  },
  historySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  historyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
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
  historyChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 21,
  },
});
