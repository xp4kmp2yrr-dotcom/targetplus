import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { chatWithAI, ChatMessage } from "@/services/ai";

type Props = {
  contextType: "meaning" | "synonyms";
  word?: string;
  words?: string[];
  analysis: unknown;
};

export default function ChatSection({ contextType, word, words, analysis }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const answer = await chatWithAI({
        contextType,
        word,
        words,
        analysis,
        question: q,
        history: messages,
      });
      const aiMsg: ChatMessage = { role: "model", content: answer };
      setMessages([...next, aiMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert("エラー", "回答の取得に失敗しました。もう一度お試しください。");
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="message-circle" size={14} color={Colors.light.tint} />
        <Text style={styles.headerText}>AIに質問する</Text>
        {messages.length > 0 && (
          <Pressable
            onPress={() => setMessages([])}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>クリア</Text>
          </Pressable>
        )}
      </View>

      {/* Messages */}
      {messages.length > 0 && (
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.role === "model" && (
                <View style={styles.aiBubbleIcon}>
                  <Feather name="zap" size={11} color={Colors.light.tint} />
                </View>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === "user"
                    ? styles.userBubbleText
                    : styles.aiBubbleText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.bubble, styles.aiBubble]}>
              <View style={styles.aiBubbleIcon}>
                <Feather name="zap" size={11} color={Colors.light.tint} />
              </View>
              <ActivityIndicator
                size="small"
                color={Colors.light.tint}
                style={{ paddingHorizontal: 4 }}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="例：hugeとenormousの違いは？"
          placeholderTextColor={Colors.light.textTertiary}
          multiline
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={send}
          editable={!isLoading}
        />
        <Pressable
          onPress={send}
          disabled={!input.trim() || isLoading}
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() || isLoading) && styles.sendBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Feather name="send" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearBtn: { paddingHorizontal: 4 },
  clearBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textTertiary,
  },
  messageList: { maxHeight: 260 },
  messageListContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.backgroundTertiary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  aiBubbleIcon: {
    marginTop: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.tint + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  userBubbleText: {
    fontFamily: "Inter_400Regular",
    color: "#fff",
  },
  aiBubbleText: {
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.light.textTertiary,
  },
});
