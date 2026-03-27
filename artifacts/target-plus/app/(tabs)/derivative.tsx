import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export default function DerivativeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Feather name="tool" size={40} color={Colors.light.textTertiary} />
        </View>
        <Text style={styles.heading}>開発中</Text>
        <Text style={styles.message}>現在この機能は準備中です。</Text>
        <Text style={styles.submessage}>
          派生語機能は近日公開予定です。{"\n"}しばらくお待ちください。
        </Text>

        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressLabel}>準備中...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  progressBar: {
    width: 160,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    width: "40%",
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
    opacity: 0.4,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },
});
