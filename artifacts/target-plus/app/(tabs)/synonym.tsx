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

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

type AnalysisCardProps = {
  group: SynonymGroup;
  onDelete: (id: string) => void;
};

function AnalysisCard({ group, onDelete }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);

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

  const analysis = group.analysis;

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
          <Text style={styles.cardDate}>
            {new Date(group.createdAt).toLocaleDateString("ja-JP")}
          </Text>
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

          {/* Shared Meaning */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Feather name="link" size={14} color={Colors.light.accent} />
              <Text style={styles.sectionLabel}>共通の意味</Text>
            </View>
            <Text style={styles.sectionText}>{analysis.sharedMeaning}</Text>
          </View>

          {/* Nuances */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Feather name="layers" size={14} color={Colors.light.tint} />
              <Text style={styles.sectionLabel}>ニュアンスの違い</Text>
            </View>
            {analysis.nuances.map((n) => (
              <View key={n.word} style={styles.nuanceRow}>
                <View style={styles.nuanceWordBadge}>
                  <Text style={styles.nuanceWordText}>{n.word}</Text>
                </View>
                <Text style={styles.nuanceText}>{n.nuance}</Text>
              </View>
            ))}
          </View>

          {/* Memory Tips */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Feather name="zap" size={14} color="#F0A500" />
              <Text style={styles.sectionLabel}>覚え方のコツ</Text>
            </View>
            <View style={styles.tipBox}>
              <Text style={styles.sectionText}>{analysis.memoryTips}</Text>
            </View>
          </View>

          {/* Examples */}
          {analysis.usageExamples && analysis.usageExamples.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Feather name="edit-3" size={14} color={Colors.light.accent} />
                <Text style={styles.sectionLabel}>例文</Text>
              </View>
              {analysis.usageExamples.map((ex) => (
                <View key={ex.word} style={styles.exampleRow}>
                  <Text style={styles.exampleWord}>{ex.word}:</Text>
                  <Text style={styles.exampleSentence}>{ex.example}</Text>
                </View>
              ))}
            </View>
          )}
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<TextInput>(null);

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
      Alert.alert(
        "入力エラー",
        "2つ以上の単語をカンマや空白で区切って入力してください。"
      );
      return;
    }

    // Duplicate check
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
      const analysis = await analyzeSynonyms(words);
      const newGroup: SynonymGroup = {
        id: generateId(),
        words,
        analysis,
        createdAt: Date.now(),
      };
      await saveSynonymGroup(newGroup);
      setGroups((prev) => [newGroup, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("エラー", "AI分析中にエラーが発生しました。しばらく後にもう一度お試しください。");
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>類義語分類</Text>
          <View style={styles.aiBadge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.aiBadgeText}>Gemini AI</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>
          英単語をカンマ区切りで入力してAI分析
        </Text>

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
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
          <Pressable
            onPress={handleAdd}
            disabled={isAnalyzing || !inputText.trim()}
            style={({ pressed }) => [
              styles.addBtn,
              isAnalyzing || !inputText.trim() ? styles.addBtnDisabled : {},
              pressed ? { opacity: 0.85 } : {},
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="plus" size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        {isAnalyzing && (
          <Text style={styles.analyzingText}>
            Gemini AIが分析中...
          </Text>
        )}
      </View>

      {/* List */}
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
              上の入力欄に2つ以上の英単語を{"\n"}カンマ区切りで入力してください。
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  analyzingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
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
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordsChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordChip: {
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
  deleteBtn: {
    padding: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 22,
  },
  nuanceRow: {
    marginBottom: 10,
  },
  nuanceWordBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  nuanceWordText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  nuanceText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
    paddingLeft: 4,
  },
  tipBox: {
    backgroundColor: "#FFF8E7",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#F0A500",
  },
  exampleRow: {
    marginBottom: 8,
  },
  exampleWord: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
    marginBottom: 2,
  },
  exampleSentence: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
    fontStyle: "italic",
  },
});
