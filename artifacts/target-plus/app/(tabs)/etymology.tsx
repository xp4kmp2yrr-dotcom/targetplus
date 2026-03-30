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
import { findEtymologyByWordNo, resetTargetTxtCache, TargetTxtEntry } from "@/services/targetTxt";
import {
  deleteSavedEtymology,
  EtymologySavedItem,
  getSavedEtymologies,
  saveEtymology,
} from "@/services/storage";

function normalizeWordNo(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.slice(0, 4).padStart(4, "0");
}

function EtymologyResultCard(props: {
  entry: TargetTxtEntry;
  onSave: () => void;
  isSaved: boolean;
}) {
  const { entry, onSave, isSaved } = props;

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderLeft}>
          <View style={styles.noBadge}>
            <Text style={styles.noBadgeText}>{entry.wordNo}</Text>
          </View>
          <Text style={styles.resultWord}>{entry.word}</Text>
        </View>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.saveHeaderBtn,
            isSaved && styles.saveHeaderBtnSaved,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="bookmark" size={14} color={isSaved ? "#fff" : Colors.light.textSecondary} />
          <Text style={[styles.saveHeaderBtnText, isSaved && styles.saveHeaderBtnTextSaved]}>
            {isSaved ? "保存済み" : "保存"}
          </Text>
        </Pressable>
      </View>

      {entry.meaningJa ? (
        <View style={styles.meaningBox}>
          <Text style={styles.meaningLabel}>意味</Text>
          <Text style={styles.meaningText}>{entry.meaningJa}</Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <View style={styles.blockLabelRow}>
          <Text style={styles.blockIcon}>📚</Text>
          <Text style={styles.blockLabel}>語源</Text>
        </View>
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{entry.etymology}</Text>
        </View>
      </View>
    </View>
  );
}

export default function EtymologyScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [wordNoInput, setWordNoInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [lastEntry, setLastEntry] = useState<TargetTxtEntry | null>(null);
  const [saved, setSaved] = useState<EtymologySavedItem[]>([]);

  const loadSaved = useCallback(async () => {
    const list = await getSavedEtymologies();
    setSaved(list);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const isSaved = (wordNo: string) => saved.some((s) => s.wordNo === wordNo);

  const doSearch = async () => {
    const normalized = normalizeWordNo(wordNoInput);
    if (!normalized) {
      setInlineError("単語番号を入力してください。");
      return;
    }
    setInlineError("");

    setIsSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { entry, error } = await findEtymologyByWordNo(normalized);
      if (!entry) {
        setLastEntry(null);
        Alert.alert("見つかりません", error ?? "該当する単語番号が見つかりませんでした。");
        return;
      }

      setLastEntry(entry);

      // auto-save displayed result
      const item: EtymologySavedItem = {
        wordNo: entry.wordNo,
        word: entry.word,
        meaningJa: entry.meaningJa,
        etymology: entry.etymology,
        savedAt: Date.now(),
      };
      await saveEtymology(item);
      await loadSaved();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("エラー", "検索中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSavePress = async () => {
    if (!lastEntry) return;
    const item: EtymologySavedItem = {
      wordNo: lastEntry.wordNo,
      word: lastEntry.word,
      meaningJa: lastEntry.meaningJa,
      etymology: lastEntry.etymology,
      savedAt: Date.now(),
    };
    await saveEtymology(item);
    await loadSaved();
    Haptics.selectionAsync();
  };

  const handleDeleteSaved = async (wordNo: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("削除の確認", `単語番号 ${wordNo} を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteSavedEtymology(wordNo);
          await loadSaved();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleRetryLoad = async () => {
    resetTargetTxtCache();
    await doSearch();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>語源検索</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>Beta</Text>
          </View>
        </View>

        <Text style={styles.headerSub}>
          単語番号を入力すると、その番号に対応する語源を表示します。{"\n"}
          表示された語源は端末内に保存され、あとから見返せます。{"\n"}
          Target1900の語源学習を補助するBeta機能です。
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, inlineError ? styles.inputError : null]}
              value={wordNoInput}
              onChangeText={(t) => {
                setWordNoInput(t);
                if (inlineError) setInlineError("");
              }}
              placeholder="単語番号（例：119）"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType={Platform.OS === "web" ? "default" : "number-pad"}
              onSubmitEditing={doSearch}
              returnKeyType="search"
            />
            {inlineError ? <Text style={styles.inputErrorText}>{inlineError}</Text> : null}
          </View>

          <Pressable
            onPress={doSearch}
            disabled={isSearching || !wordNoInput.trim()}
            style={({ pressed }) => [
              styles.searchBtn,
              (isSearching || !wordNoInput.trim()) && styles.searchBtnDisabled,
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
      </View>

      <FlatList
        data={saved}
        keyExtractor={(item) => item.wordNo}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 16 },
          saved.length === 0 && !lastEntry ? styles.listEmpty : {},
        ]}
        ListHeaderComponent={
          lastEntry ? (
            <View style={{ marginBottom: 12 }}>
              <EtymologyResultCard
                entry={lastEntry}
                onSave={handleSavePress}
                isSaved={isSaved(lastEntry.wordNo)}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setLastEntry({
                wordNo: item.wordNo,
                word: item.word,
                meaningJa: item.meaningJa,
                etymology: item.etymology,
              });
              Haptics.selectionAsync();
            }}
            style={({ pressed }) => [styles.savedItem, pressed && { opacity: 0.75 }]}
          >
            <View style={styles.savedItemLeft}>
              <View style={styles.savedItemTop}>
                <View style={styles.noBadgeSmall}>
                  <Text style={styles.noBadgeSmallText}>{item.wordNo}</Text>
                </View>
                <Text style={styles.savedWord}>{item.word}</Text>
              </View>
              {item.meaningJa ? <Text style={styles.savedMeaning}>{item.meaningJa}</Text> : null}
            </View>
            <View style={styles.savedItemRight}>
              <Pressable onPress={() => handleDeleteSaved(item.wordNo)} hitSlop={8} style={styles.deleteBtn}>
                <Feather name="trash-2" size={16} color={Colors.light.textTertiary} />
              </Pressable>
              <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="book" size={36} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>語源を検索しよう</Text>
            <Text style={styles.emptyDesc}>
              上の入力欄に単語番号を入力してください。{"\n"}
              例：<Text style={styles.emptyDescAccent}>119</Text> →{" "}
              <Text style={styles.emptyDescAccent}>0119</Text>
            </Text>

            <Pressable
              onPress={handleRetryLoad}
              style={({ pressed }) => [styles.retryLoadBtn, pressed && { opacity: 0.85 }]}
            >
              <Feather name="refresh-cw" size={16} color={Colors.light.tint} />
              <Text style={styles.retryLoadBtnText}>データ読み込みを再試行</Text>
            </Pressable>
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
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.navy },
  betaBadge: {
    backgroundColor: Colors.light.warning + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.warning + "40",
  },
  betaBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#7A5200" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 19, marginBottom: 14 },

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
  inputErrorText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#E63946", marginTop: 5, marginLeft: 4 },
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

  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 70, gap: 12 },
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
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, textAlign: "center", lineHeight: 20 },
  emptyDescAccent: { fontFamily: "Inter_600SemiBold", color: Colors.light.accent },
  retryLoadBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tint + "12",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.tint + "28",
  },
  retryLoadBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },

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
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  resultHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, flexShrink: 1 },
  noBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  noBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.9)" },
  resultWord: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", flexShrink: 1 },
  saveHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  saveHeaderBtnSaved: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  saveHeaderBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
  saveHeaderBtnTextSaved: { color: "#fff" },

  meaningBox: {
    backgroundColor: Colors.light.tint + "0A",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  meaningLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  meaningText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text, lineHeight: 20 },

  block: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  blockLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  blockIcon: { fontSize: 14 },
  blockLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary, textTransform: "uppercase", letterSpacing: 0.6 },
  noteBox: {
    backgroundColor: Colors.light.navy + "0C",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.navy,
  },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.navy, lineHeight: 20 },

  savedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  savedItemLeft: { flex: 1, gap: 4 },
  savedItemTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  noBadgeSmall: { backgroundColor: Colors.light.backgroundTertiary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.light.border },
  noBadgeSmallText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary },
  savedWord: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  savedMeaning: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, lineHeight: 18 },
  savedItemRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: { padding: 4 },
});

