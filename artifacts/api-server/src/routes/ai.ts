import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.post("/ai/synonyms", async (req, res) => {
  const { words } = req.body as { words?: unknown };

  if (!Array.isArray(words) || words.length < 2) {
    res.status(400).json({ error: "words must be an array of at least 2 strings" });
    return;
  }

  const wordList = (words as string[]).map((w) => String(w).trim()).filter(Boolean);

  const prompt = `以下の英単語グループを詳しく分析してください: ${wordList.join(", ")}

以下のJSON形式のみで回答してください（コードブロック・追加テキスト不要）:
{
  "sharedMeaning": "これらの単語の共通する意味（日本語、2〜3文）",
  "nuances": [
    {"word": "単語1", "nuance": "この単語特有のニュアンス・使い方・よく使う場面（日本語）"},
    {"word": "単語2", "nuance": "この単語特有のニュアンス・使い方・よく使う場面（日本語）"}
  ],
  "memoryTips": "単語を区別して覚えるための具体的なコツ（日本語）",
  "usageExamples": [
    {"word": "単語1", "example": "Natural English example sentence using this word."},
    {"word": "単語2", "example": "Natural English example sentence using this word."}
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini API error in /ai/synonyms");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

router.post("/ai/meaning", async (req, res) => {
  const { word } = req.body as { word?: unknown };

  if (!word || typeof word !== "string") {
    res.status(400).json({ error: "word must be a non-empty string" });
    return;
  }

  const trimmedWord = word.trim();

  const prompt = `英単語「${trimmedWord}」について詳しく解説してください。

以下のJSON形式のみで回答してください（コードブロック・追加テキスト不要）:
{
  "word": "${trimmedWord}",
  "meaning": "主な意味・定義（日本語、2〜4文）",
  "nuance": "ニュアンス・語感・フォーマル/カジュアルの使い分け（日本語）",
  "usageHints": "よく使う場面・文脈・コロケーション（日本語）",
  "similarWords": "類義語・近い単語との違い（日本語）",
  "memoryTip": "この単語を覚えるための具体的なコツ・語源・イメージ（日本語）"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini API error in /ai/meaning");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

export default router;
