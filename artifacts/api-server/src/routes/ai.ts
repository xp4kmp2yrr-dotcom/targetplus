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

  const prompt = `中高生向けに、次の英単語グループを分析してください: ${wordList.join(", ")}

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
      config: {
        maxOutputTokens: 4096,
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

  const prompt = `中高生向けに、英単語「${trimmedWord}」を解説してください。

重要：長い文章は避け、箇条書き・短文中心で。見やすさ最優先。

以下のJSON形式のみで回答（コードブロック不要）:
{
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
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 4096,
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
