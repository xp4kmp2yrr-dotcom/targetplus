import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.post("/ai/synonyms", async (req, res) => {
  const { words, targetMeaning } = req.body as { words?: unknown; targetMeaning?: string };

  if (!Array.isArray(words) || words.length < 2) {
    res.status(400).json({ error: "words must be an array of at least 2 strings" });
    return;
  }

  const wordList = (words as string[]).map((w) => String(w).trim()).filter(Boolean);

  const targetSection = targetMeaning?.trim()
    ? `\n参考：ターゲット1900での意味 → ${targetMeaning.trim()}\n（分析には必ずこの意味を含めること）`
    : "";

  const prompt = `中高生向けに、次の英単語グループを分析してください: ${wordList.join(", ")}${targetSection}

重要：各項目はできるだけ短く・箇条書き形式で。長い文章は避ける。

以下のJSON形式のみで回答（コードブロック不要）:
{
  "sharedImage": "共通のひとことイメージ（15字以内）",
  "nuances": [
    {
      "word": "単語",
      "formalLevel": "くだけた／ふつう／フォーマル",
      "point": "特徴を1文で（20字以内）",
      "scene": "よく使う場面（15字以内）"
    }
  ],
  "memoryTip": "区別して覚えるコツ（30字以内・インパクト重視）",
  "usageExamples": [
    {
      "word": "単語",
      "example": "Short example sentence.",
      "ja": "日本語訳（15字以内）"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 4096, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch {
      res.status(500).json({ error: "Failed to parse AI response" }); return;
    }
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini API error in /ai/synonyms");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

router.post("/ai/meaning", async (req, res) => {
  const { word, targetMeaning, forceReboot } = req.body as {
    word?: unknown;
    targetMeaning?: string;
    forceReboot?: boolean;
  };

  if (!word || typeof word !== "string") {
    res.status(400).json({ error: "word must be a non-empty string" });
    return;
  }

  // Reject multi-word input at server level too
  const trimmedWord = word.trim();
  if (/[\s,、]+/.test(trimmedWord)) {
    res.status(400).json({ error: "single word only" });
    return;
  }

  const targetSection = targetMeaning?.trim()
    ? `\n参考：ターゲット1900での意味 → ${targetMeaning.trim()}\n（分析には必ずこの意味を先頭に含めること）`
    : "";

  const existenceInstruction = forceReboot
    ? `【強制ファクトチェックモード】
英語として標準的な辞書（Oxford, Merriam-Webster等）に実際に掲載されている単語かどうかを厳格に再確認してください。
スペルミス・造語・存在しない単語であれば必ず exists: false を返してください。
本当に正しい英単語であれば exists: true とし、通常通り分析してください。`
    : `この単語が標準的な英語の辞書に存在するかどうかを最初に確認してください。
スペルミスや造語・存在しない単語の場合は exists: false を返してください。`;

  const prompt = `中高生向けに、英単語「${trimmedWord}」を解説してください。${targetSection}

${existenceInstruction}

重要：長い文章は避け、箇条書き・短文中心で。見やすさ最優先。

以下のJSON形式のみで回答（コードブロック不要）:
{
  "exists": true,
  "word": "${trimmedWord}",
  "partOfSpeech": "品詞（例：形容詞、動詞、名詞）",
  "coreImage": "ひとことイメージ（10字以内）",
  "meanings": [
    {"pos": "品詞", "ja": "意味（15字以内）"},
    {"pos": "品詞（別の意味がある場合）", "ja": "意味（15字以内）"}
  ],
  "usagePoints": [
    "使い方のポイント1（20字以内）",
    "使い方のポイント2（20字以内）"
  ],
  "vsWords": [
    {"word": "類語", "diff": "違い（15字以内）"}
  ],
  "examples": [
    {"en": "Short example sentence.", "ja": "日本語訳（15字以内）"}
  ],
  "memoryTip": "覚え方のコツ（25字以内・語源やイメージ活用）"
}

単語が存在しない場合は以下のみ返してください:
{"exists": false, "word": "${trimmedWord}"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 4096, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch {
      res.status(500).json({ error: "Failed to parse AI response" }); return;
    }
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini API error in /ai/meaning");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

router.post("/ai/chat", async (req, res) => {
  const { contextType, word, words, analysis, question, history } = req.body as {
    contextType: "meaning" | "synonyms";
    word?: string;
    words?: string[];
    analysis?: unknown;
    question: string;
    history?: Array<{ role: "user" | "model"; content: string }>;
  };

  if (!question?.trim()) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const contextSummary =
    contextType === "meaning"
      ? `英単語「${word}」の分析結果: ${JSON.stringify(analysis)}`
      : `類義語グループ「${(words ?? []).join(", ")}」の分析結果: ${JSON.stringify(analysis)}`;

  const systemInstruction = `あなたは中高生向けの英語学習AIアシスタントです。
以下の分析結果をもとに、ユーザーの質問に日本語で簡潔に答えてください。
回答は短く・箇条書きを活用し、専門用語は避けること。

${contextSummary}`;

  const contents = [
    ...(history ?? []).map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
    { role: "user" as const, parts: [{ text: question.trim() }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { maxOutputTokens: 2048, systemInstruction },
    });
    res.json({ answer: response.text ?? "回答を生成できませんでした。" });
  } catch (err) {
    req.log.error({ err }, "Gemini API error in /ai/chat");
    res.status(500).json({ error: "AI chat failed" });
  }
});

export default router;
