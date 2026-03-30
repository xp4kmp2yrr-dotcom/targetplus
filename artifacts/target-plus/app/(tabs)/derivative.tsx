import React, { useCallback, useEffect, useState } from "react";
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
import { analyzeDerivative, DerivativeAnalysis } from "@/services/ai";
import {
  deleteDerivativeEntry,
  DerivativeEntry,
  getDerivativeEntries,
  saveDerivativeEntry,
  updateDerivativeEntry,
} from "@/services/storage";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

function normalizeTerm(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function validateTerm(text: string): string | null {
  const trimmed = normalizeTerm(text);
  if (!trimmed) return "派生語や熟語を入力してください。";
  if (trimmed.length > 60) return "長すぎるため短くしてください。";
  return null;
}

function DerivativeCard(props: {
  entry: DerivativeEntry;
  onDelete: () => void;
  onRetry: () => void;
}) {
  const { entry, onDelete, onRetry } = props;
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => {
          setExpanded((v) => !v);
          Haptics.selectionAsync();
        }}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.termRow}>
            <View style={styles.termChip}>
              <Text style={styles.termChipText}>{entry.term}</Text>
            </View>
            {entry.targetMeaning ? (
              <View style={styles.targetBadge}>
                <Feather name="book" size={10} color={Colors.light.accent} />
                <Text style={styles.targetBadgeText}>ターゲット</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardDate}>
            {new Date(entry.createdAt).toLocaleDateString("ja-JP")}
          </Text>
        </View>

        <View style={styles.cardHeaderRight}>
          <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
            <Feather name="trash-2" size={16} color={Colors.light.textTertiary} />
          </Pressable>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.light.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.divider} />

          {entry.targetMeaning ? (
            <View style={styles.targetRefBox}>
              <Feather name="book-open" size={12} color={Colors.light.accent} />
              <Text style={styles.targetRefLabel}>ターゲット</Text>
              <Text style={styles.targetRefText}>{entry.targetMeaning}</Text>
            </View>
          ) : null}

          {entry.lastError ? (
            <View style={styles.errorBox}>
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={16} color="#C0392B" />
                <Text style={styles.errorText}>{entry.lastError}</Text>
              </View>
              <Pressable
                onPress={onRetry}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={styles.retryBtnText}>再試行</Text>
              </Pressable>
            </View>
          ) : null}

          {entry.analysis ? (
            <DerivativeAnalysisView analysis={entry.analysis} />
          ) : !entry.lastError ? (
            <View style={styles.pendingBox}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
              <Text style={styles.pendingText}>分析結果を準備しています...</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function DerivativeAnalysisView({ analysis }: { analysis: DerivativeAnalysis }) {
  return (
    <View style={{ paddingBottom: 14 }}>
      {analysis.meaning?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>📖</Text>
            <Text style={styles.blockLabel}>意味</Text>
          </View>
          <View style={styles.pointsList}>
            {analysis.meaning.map((t, i) => (
              <View key={i} style={styles.pointRow}>
                <Text style={styles.pointBullet}>·</Text>
                <Text style={styles.pointText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {analysis.nuance?.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>⚖️</Text>
            <Text style={styles.blockLabel}>ニュアンス</Text>
          </View>
          <View style={styles.pointsList}>
            {analysis.nuance.map((t, i) => (
              <View key={i} style={styles.pointRow}>
                <Text style={styles.pointBullet}>·</Text>
                <Text style={styles.pointText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {analysis.memoryTip ? (
        <View style={[styles.block, { paddingTop: 0 }]}>
          <View style={styles.memoryBox}>
            <Text style={styles.memoryIcon}>🧠</Text>
            <View style={styles.memoryContent}>
              <Text style={styles.memoryLabel}>覚え方</Text>
              <Text style={styles.memoryText}>{analysis.memoryTip}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {analysis.extra ? (
        <View style={styles.block}>
          <View style={styles.blockLabelRow}>
            <Text style={styles.blockIcon}>📝</Text>
            <Text style={styles.blockLabel}>補足</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{analysis.extra}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function DerivativeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [entries, setEntries] = useState<DerivativeEntry[]>([]);
  const [inputText, setInputText] = useState("");
  const [targetMeaning, setTargetMeaning] = useState("");
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const loadData = useCallback(async () => {
    const saved = await getDerivativeEntries();
    setEntries(saved);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const requestAnalysis = useCallback(async (entry: DerivativeEntry) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDerivative({
        term: entry.term,
        targetMeaning: entry.targetMeaning?.trim() || undefined,
      });
      await updateDerivativeEntry(entry.id, { analysis, lastError: undefined });
      const next = await getDerivativeEntries();
      setEntries(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await updateDerivativeEntry(entry.id, {
        analysis: null,
        lastError: "AI分析に失敗しました。もう一度お試しください。",
      });
      const next = await getDerivativeEntries();
      setEntries(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleAdd = async () => {
    const error = validateTerm(inputText);
    if (error) {
      setInlineError(error);
      return;
    }

    const term = normalizeTerm(inputText);
    const target = targetMeaning.trim() || undefined;

    const isDuplicate = entries.some((e) => e.term.toLowerCase() === term.toLowerCase());
    if (isDuplicate) {
      Alert.alert("重複エラー", "この派生語はすでに登録されています。");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");

    const newEntry: DerivativeEntry = {
      id: generateId(),
      term,
      targetMeaning: target,
      analysis: null,
      lastError: undefined,
      createdAt: Date.now(),
    };

    await saveDerivativeEntry(newEntry);
    setEntries((prev) => [newEntry, ...prev]);
    await requestAnalysis(newEntry);
  };

  const handleDelete = async (entry: DerivativeEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("削除の確認", `「${entry.term}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteDerivativeEntry(entry.id);
          setEntries((prev) => prev.filter((e) => e.id !== entry.id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleRetry = async (entry: DerivativeEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await requestAnalysis(entry);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>派生語分析</Text>
          <View style={styles.aiBadge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.aiBadgeText}>AI利用</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>派生語・熟語を登録して意味やニュアンスを整理</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, inlineError ? styles.inputError : null]}
              value={inputText}
              onChangeText={(t) => {
                setInputText(t);
                if (inlineError) setInlineError("");
              }}
              placeholder="例: establishment, take off"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAdd}
              returnKeyType="go"
            />
            {inlineError ? <Text style={styles.inputErrorText}>{inlineError}</Text> : null}
          </View>
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
              placeholder="例：① 設立する ② 確立する"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              returnKeyType="done"
            />
          </View>
        )}

        {isAnalyzing && <Text style={styles.analyzingText}>AI分析中...</Text>}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 16 },
          entries.length === 0 ? styles.listEmpty : {},
        ]}
        renderItem={({ item }) => (
          <DerivativeCard
            entry={item}
            onDelete={() => handleDelete(item)}
            onRetry={() => handleRetry(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="git-branch" size={36} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>派生語を登録しよう</Text>
            <Text style={styles.emptyDesc}>
              例：<Text style={styles.emptyDescAccent}>establishment</Text> や{"\n"}
              <Text style={styles.emptyDescAccent}>take off</Text> など{"\n\n"}
              意味・覚え方・ニュアンスをAIが整理し、{"\n"}端末内に保存して後から見返せます。
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

  inputRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  inputWrap: { flex: 1 },
  input: {
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
  inputError: { borderColor: "#E63946" },
  inputErrorText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#E63946",
    marginTop: 5,
    marginLeft: 4,
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
  iconBtnActive: { borderColor: Colors.light.tint, backgroundColor: Colors.light.tint + "12" },
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
  addBtnDisabled: { backgroundColor: Colors.light.textTertiary, shadowOpacity: 0, elevation: 0 },

  targetInputWrapper: {
    marginTop: 10,
    backgroundColor: Colors.light.accent + "0D",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "30",
  },
  targetInputLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
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
  analyzingText: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.tint },

  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyDescAccent: { fontFamily: "Inter_600SemiBold", color: Colors.light.accent },

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
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  cardHeaderLeft: { flex: 1, gap: 6 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  deleteBtn: { padding: 4 },
  termRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  termChip: {
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  termChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },
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
  targetBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.accent },

  cardBody: { paddingHorizontal: 14, paddingBottom: 0 },
  divider: { height: 1, backgroundColor: Colors.light.border, marginBottom: 12 },

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
  targetRefLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.accent, marginRight: 2 },
  targetRefText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 18 },

  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  pendingText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },

  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5C6C6",
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  errorText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#C0392B", lineHeight: 18 },
  retryBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: "#C0392B",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  retryBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

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
  pointsList: { gap: 6 },
  pointRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pointBullet: { fontSize: 18, color: Colors.light.tint, lineHeight: 22, marginTop: -1 },
  pointText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text, lineHeight: 20 },

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
  memoryText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#5D4037", lineHeight: 20 },

  noteBox: {
    backgroundColor: Colors.light.navy + "0C",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.navy,
  },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.navy, lineHeight: 20 },
});
