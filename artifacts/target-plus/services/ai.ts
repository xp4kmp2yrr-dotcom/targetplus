export type SynonymAnalysis = {
  sharedMeaning: string;
  nuances: Array<{ word: string; nuance: string }>;
  memoryTips: string;
  usageExamples: Array<{ word: string; example: string }>;
};

export type WordMeaning = {
  word: string;
  meaning: string;
  nuance: string;
  usageHints: string;
  similarWords: string;
  memoryTip: string;
};

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export async function analyzeSynonyms(
  words: string[],
  apiKey?: string
): Promise<SynonymAnalysis> {
  if (!apiKey) {
    return getMockSynonymAnalysis(words);
  }

  const prompt = `以下の英単語グループを分析してください: ${words.join(", ")}

以下のJSON形式で回答してください（コードブロックなし）:
{
  "sharedMeaning": "これらの単語の共通する意味（日本語）",
  "nuances": [
    {"word": "単語1", "nuance": "この単語特有のニュアンス・使い方（日本語）"},
    {"word": "単語2", "nuance": "この単語特有のニュアンス・使い方（日本語）"}
  ],
  "memoryTips": "単語を区別して覚えるためのコツ（日本語）",
  "usageExamples": [
    {"word": "単語1", "example": "English example sentence."},
    {"word": "単語2", "example": "English example sentence."}
  ]
}`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(content);
  } catch {
    return getMockSynonymAnalysis(words);
  }
}

export async function searchWordMeaning(
  word: string,
  apiKey?: string
): Promise<WordMeaning> {
  if (!apiKey) {
    return getMockWordMeaning(word);
  }

  const prompt = `英単語「${word}」について以下のJSON形式で詳しく解説してください（コードブロックなし）:
{
  "word": "${word}",
  "meaning": "主な意味（日本語）",
  "nuance": "ニュアンス・微妙なニュアンスの違い（日本語）",
  "usageHints": "使い方のヒント・場面（日本語）",
  "similarWords": "類似語との違い（日本語）",
  "memoryTip": "覚え方のコツ（日本語）"
}`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(content);
  } catch {
    return getMockWordMeaning(word);
  }
}

function getMockSynonymAnalysis(words: string[]): SynonymAnalysis {
  return {
    sharedMeaning: `「${words.join("」「")}」はどれも似た意味を持つ英単語です。Perplexity APIキーを設定すると、AIによる詳細な解析が表示されます。`,
    nuances: words.map((w) => ({
      word: w,
      nuance: `「${w}」の詳細なニュアンスを確認するにはAPIキーを設定してください。`,
    })),
    memoryTips:
      "APIキーを設定すると、AIがこれらの単語を区別して覚えるための具体的なコツを教えてくれます。",
    usageExamples: words.map((w) => ({
      word: w,
      example: `Please set the API key to see example sentences for "${w}".`,
    })),
  };
}

function getMockWordMeaning(word: string): WordMeaning {
  return {
    word,
    meaning: `「${word}」の意味を表示するにはPerplexity APIキーを設定してください。`,
    nuance:
      "APIキーを設定すると、詳細なニュアンスの解説が表示されます。",
    usageHints:
      "APIキーを設定すると、使い方のヒントと具体的な場面が表示されます。",
    similarWords:
      "APIキーを設定すると、類似語との比較・違いが表示されます。",
    memoryTip:
      "APIキーを設定すると、単語を覚えるための具体的なコツが表示されます。",
  };
}
