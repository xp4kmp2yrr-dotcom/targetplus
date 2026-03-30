import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const features = [
  {
    icon: "git-branch" as const,
    title: "類義語分類",
    description: "英単語を登録して、AIが語義の違いや使い分けを解説します。英単語の意味は、自身で登録することもできます。",
    color: "#457B9D",
  },
  {
    icon: "search" as const,
    title: "意味検索",
    description: "英単語の詳しい意味・ニュアンス・使い方を日本語で調べられます。",
    color: "#2A9D8F",
  },
  {
    icon: "share-2" as const,
    title: "派生語分析",
    description: "単語に付属する派生語を詳しく分析し、暗記の補助に利用できます。",
    color: "#9D4EDD",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoMiddle}>
                <View style={styles.logoInner} />
              </View>
            </View>
            <View style={styles.logoPlus}>
              <Text style={styles.logoPlusText}>+</Text>
            </View>
          </View>
          <Text style={styles.title}>Target＋へようこそ</Text>
          <Text style={styles.subtitle}>
            {"英単語帳ターゲットの純正アプリにない\nちょこっと便利な機能を利用できます。\nこのアプリは他の単語帳の補助にも使えます！"}
          </Text>
        </View>

        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Feather name="zap" size={12} color={Colors.light.tint} />
            <Text style={styles.badgeText}>複数のAIモデルを使用</Text>
          </View>
          <View style={[styles.badge, styles.badgeOutline]}>
            <Feather name="smartphone" size={12} color={Colors.light.accent} />
            <Text style={[styles.badgeText, { color: Colors.light.accent }]}>単語データローカル保存</Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>機能一覧</Text>
        </View>

        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: feature.color + "18" }]}>
              <Feather name={feature.icon} size={22} color={feature.color} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureName}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </View>
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Feather name="info" size={14} color={Colors.light.textTertiary} />
          <Text style={styles.footerNoteText}>
            本アプリは非公式の補助ツールです。ターゲットの純正アプリと併用してご利用ください。
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMiddle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 5,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.tint,
  },
  logoPlus: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0A500",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  logoPlusText: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.navy,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 32,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.light.tint + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeOutline: {
    backgroundColor: Colors.light.accent + "18",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.navy,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    lineHeight: 18,
    flex: 1,
  },
});
