import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { analyzeSynonyms, SynonymAnalysis } from "@/services/ai";
import {
  deleteSynonymGroup,
  getSynonymGroups,
  saveSynonymGroup,
  SynonymGroup,
} from "@/services/storage";
import ChatSection from "@/components/ChatSection";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const LEVEL_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  くだけた: { bg: "#FFF3CD", text: "#7A5200", border: "#FFD95A" },
  ふつう: { bg: "#E3F2FD", text: "#0D47A1", border: "#90CAF9" },
  フォーマル: { bg: "#E8F5E9", text: "#1B5E20", border: "#A5D6A7" },
};
const DEFAULT_LEVEL = {
  bg: Colors.light.backgroundTertiary,
  text: Colors.light.textSecondary,
  border: Colors.light.border,
};

type AnalysisCardProps = {
  group: SynonymGroup;
  onDelete: (id: string) => void;
};

function AnalysisCard({ group, onDelete }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const analysis = group.analysis;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "削除の確認",
      `「${group.words.join(", ")}」の分析を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(group.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => {
          setExpanded((e) => !e);
          Haptics.selectionAsync();
        }}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.wordsChipRow}>
            {group.words.map((w) => (
              <View key={w} style={styles.wordChip}>
                <Text style={styles.wordChipText}>{w}</Text>
              </View>
            ))}
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>
              {new Date(group.createdAt).toLocaleDateString("ja-JP")}
            </Text>
            {group.targetMeaning ? (
              <View style={styles.targetBadge}>
                <Feather name="book" size={10} color={Colors.light.accent} />
                <Text style={styles.targetBadgeText}>ターゲット</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Feather name="trash-2" size={16} color={Colors.light.textTertiary} />
          </Pressable>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.light.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && analysis && (
        <View style={styles.cardBody}>
          <View style={styles.divider} />

          {/* Target meaning reference */}
          {group.targetMeaning ? (
            <View style={styles.targetRefBox}>
              <Feather name="book-open" size={12} color={Colors.light.accent} />
              <Text style={styles.targetRefLabel}>ターゲット</Text>
              <Text style={styles.targetRefText}>{group.targetMeaning}</Text>
            </View>
          ) : null}

          {/* Shared Image */}
          {analysis.sharedImage ? (
            <View style={styles.sharedImageBox}>
              <Text style={styles.sharedImageIcon}>🔗</Text>
              <Text style={styles.sharedImageLabel}>共通イメージ</Text>
              <Text style={styles.sharedImageText}>{analysis.sharedImage}</Text>
            </View>
          ) : null}

          {/* Nuances Table */}
          {analysis.nuances?.length > 0 && (
            <View style={styles.block}>
              <View style={styles.blockLabelRow}>
                <Text style={styles.blockIcon}>⚖️</Text>
                <Text style={styles.blockLabel}>ニュアンスの違い</Text>
              </View>
              <View style={styles.nuanceTable}>
                {analysis.nuances.map((n, i) => {
                  const lvl = LEVEL_COLOR[n.formalLevel] ?? DEFAULT_LEVEL;
                  return (
                    <View
                      key={n.word}
                      style={[styles.nuanceRow, i > 0 && styles.nuanceRowBorder]}
                    >
                      <View style={styles.nuanceLeft}>
                        <Text style={styles.nuanceWord}>{n.word}</Text>
                        <View
                          style={[
                            styles.levelBadge,
                            { backgroundColor: lvl.bg, borderColor: lvl.border },
                          ]}
                        >
                          <Text style={[styles.levelText, { color: lvl.text }]}>
                            {n.formalLevel}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.nuanceRight}>
                        <Text style={styles.nuancePoint}>{n.point}</Text>
                        {n.scene ? (
                          <View style={styles.sceneRow}>
                            <Feather
                              name="map-pin"
                              size={10}
                              color={Colors.light.textTertiary}
                            />
                            <Text style={styles.sceneText}>{n.scene}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Memory Tip */}
          {analysis.memoryTip ? (
            <View style={[styles.block, { paddingTop: 12 }]}>
              <View style={styles.memoryBox}>
                <Text style={styles.memoryIcon}>🧠</Text>
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryLabel}>覚え方のコツ</Text>
                  <Text style={styles.memoryText}>{analysis.memoryTip}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Examples */}
          {analysis.usageExamples?.length > 0 && (
            <View style={[styles.block, { paddingTop: 12 }]}>
              <View style={styles.blockLabelRow}>
                <Text style={styles.blockIcon}>✏️</Text>
                <Text style={styles.blockLabel}>例文</Text>
              </View>
              <View style={styles.examplesBox}>
                {analysis.usageExamples.map((ex, i) => (
                  <View
                    key={ex.word}
                    style={[styles.exampleItem, i > 0 && { marginTop: 10 }]}
                  >
                    <View style={styles.exampleWordBadge}>
                      <Text style={styles.exampleWordText}>{ex.word}</Text>
                    </View>
                    <Text style={styles.exampleEn}>{ex.example}</Text>
                    {ex.ja ? (
                      <Text style={styles.exampleJa}>{ex.ja}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 4 }} />

          {/* Chat */}
          <ChatSection
            contextType="synonyms"
            words={group.words}
            analysis={analysis}
          />
        </View>
      )}
    </View>
  );
}

export default function SynonymScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [groups, setGroups] = useState<SynonymGroup[]>([]);
  const [inputText, setInputText] = useState("");
  const [targetMeaning, setTargetMeaning] = useState("");
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    const savedGroups = await getSynonymGroups();
    setGroups(savedGroups);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    const rawWords = inputText
      .split(/[,、\s]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    const words = [...new Set(rawWords.map((w) => w.toLowerCase()))].map(
      (w) => rawWords.find((r) => r.toLowerCase() === w) ?? w
    );

    if (words.length < 2) {
      Alert.alert("入力エラー", "2つ以上の単語をカンマや空白で区切って入力してください。");
      return;
    }

    const sortedNew = [...words].sort().join(",").toLowerCase();
    const isDuplicate = groups.some(
      (g) => [...g.words].sort().join(",").toLowerCase() === sortedNew
    );
    if (isDuplicate) {
      Alert.alert("重複エラー", "この単語グループはすでに登録されています。");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeSynonyms(
        words,
        targetMeaning.trim() || undefined
      );
      const newGroup: SynonymGroup = {
        id: generateId(),
        words,
        analysis,
        targetMeaning: targetMeaning.trim() || undefined,
        createdAt: Date.now(),
      };
      await saveSynonymGroup(newGroup);
      setGroups((prev) => [newGroup, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("エラー", "AI分析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSynonymGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>類義語分類</Text>
          <View style={styles.aiBadge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.aiBadgeText}>AI利用</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>英単語をカンマ区切りで入力してAI分析</Text>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="例: big, large, huge"
            placeholderTextColor={Colors.light.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAdd}
            returnKeyType="go"
          />
          {/* Toggle target input */}
          <Pressable
            onPress={() => {
              setShowTargetInput((v) => !v);
              Haptics.selectionAsync();
            }}
            style={[styles.iconBtn, showTargetInput && styles.iconBtnActive]}
          >
            <Feather
              name="book"
              size={18}
              color={showTargetInput ? Colors.light.tint : Colors.light.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={handleAdd}
            disabled={isAnalyzing || !inputText.trim()}
            style={({ pressed }) => [
              styles.addBtn,
              (isAnalyzing || !inputText.trim()) && styles.addBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="plus" size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Target meaning input (collapsible) */}
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
              placeholder="例：big: 大きい / large: 大きな / huge: 巨大な"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              returnKeyType="done"
            />
          </View>
        )}

        {isAnalyzing && (
          <Text style={styles.analyzingText}>AI分析中...</Text>
        )}
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnalysisCard group={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 16 },
          groups.length === 0 ? styles.listEmpty : {},
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="list" size={40} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>単語グループがありません</Text>
            <Text style={styles.emptyDesc}>
              上の入力欄に2つ以上の英単語を{"\n"}カンマ区切りで入力してください。{"\n\n"}
              <Text style={styles.emptyDescAccent}>本のアイコン</Text>
              {"でターゲットの\n意味を追加することもできます。"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.navy },
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
  aiBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
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
  iconBtn: {
    width: 44,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  iconBtnActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint + "12",
  },
  addBtn: {
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
  addBtnDisabled: {
    backgroundColor: Colors.light.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  targetInputWrapper: {
    marginTop: 10,
    backgroundColor: Colors.light.accent + "0D",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "30",
  },
  targetInputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  targetInputLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetInput: {
    minHeight: 36,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  analyzingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
  },

  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyDescAccent: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },

  /* Card */
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardHeaderLeft: { flex: 1, gap: 6 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  wordsChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wordChip: {
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.accent + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  targetBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  deleteBtn: { padding: 4 },

  cardBody: { paddingHorizontal: 14, paddingBottom: 0 },
  divider: { height: 1, backgroundColor: Colors.light.border, marginBottom: 12 },

  /* Target reference */
  targetRefBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.light.accent + "0D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "25",
    flexWrap: "wrap",
  },
  targetRefLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.light.accent,
    marginRight: 2,
  },
  targetRefText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  /* Shared Image */
  sharedImageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.navy + "0C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.navy,
    marginBottom: 14,
  },
  sharedImageIcon: { fontSize: 16 },
  sharedImageLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.navy,
    marginRight: 2,
  },
  sharedImageText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.navy },

  block: { paddingTop: 0, marginBottom: 14 },
  blockLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  blockIcon: { fontSize: 14 },
  blockLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* Nuance Table */
  nuanceTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  nuanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  nuanceRowBorder: { borderTopWidth: 1, borderTopColor: Colors.light.border },
  nuanceLeft: { width: 100, gap: 5, marginRight: 10 },
  nuanceWord: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.tint },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  levelText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  nuanceRight: { flex: 1, gap: 4 },
  nuancePoint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    lineHeight: 19,
  },
  sceneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sceneText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },

  /* Memory */
  memoryBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD54F",
  },
  memoryIcon: { fontSize: 20, lineHeight: 24 },
  memoryContent: { flex: 1 },
  memoryLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#856404",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memoryText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#5D4037", lineHeight: 20 },

  /* Examples */
  examplesBox: {
    backgroundColor: "#F0F7FF",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.accent,
    gap: 10,
  },
  exampleItem: {},
  exampleWordBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  exampleWordText: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.accent },
  exampleEn: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.navy,
    fontStyle: "italic",
  },
  exampleJa: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
