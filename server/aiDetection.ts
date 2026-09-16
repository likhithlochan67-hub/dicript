import { invokeLLM } from "./_core/llm";

export type DetectionConfidence = "low" | "medium" | "high";
export type DetectionSentence = { text: string; score: number; signal: string; explanation: string };
export type DetectionApiResult = {
  title: string;
  content: string;
  wordCount: number;
  aiProbability: number;
  confidence: DetectionConfidence;
  readability: number;
  profile: { predictability: number; uniformity: number; repetition: number; variation: number };
  sentences: DetectionSentence[];
  model: string;
  source: "ai" | "heuristic-fallback";
};

type ModelSentence = { index: number; score: number; signal: string; explanation: string };
type ModelResult = { aiProbability: number; confidence: DetectionConfidence; readability: number; profile: DetectionApiResult["profile"]; sentences: ModelSentence[] };

const model = "claude-haiku-4-5";
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const words = (text: string) => text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
const splitSentences = (content: string) => content.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

function localFallback(content: string, title: string): DetectionApiResult {
  const sentences = splitSentences(content);
  const allWords = words(content);
  const uniqueRatio = new Set(allWords).size / Math.max(1, allWords.length);
  const lengths = sentences.map((sentence) => words(sentence).length);
  const mean = lengths.reduce((sum, value) => sum + value, 0) / Math.max(1, lengths.length);
  const variance = lengths.reduce((sum, value) => sum + Math.abs(value - mean), 0) / Math.max(1, lengths.length * mean);
  const profile = {
    predictability: clamp(42 + (1 - uniqueRatio) * 54),
    uniformity: clamp(42 + (1 - Math.min(1, variance * 2.1)) * 50),
    repetition: clamp(18 + Math.max(0, 0.72 - uniqueRatio) * 120),
    variation: 0,
  };
  profile.variation = clamp(100 - (profile.predictability * .38 + profile.uniformity * .28 + profile.repetition * .34));
  const sentenceSignals = sentences.map((text, index) => {
    const sentenceWords = words(text);
    const sentenceUniqueRatio = new Set(sentenceWords).size / Math.max(1, sentenceWords.length);
    const score = clamp(54 + (1 - sentenceUniqueRatio) * 36 + Math.max(0, .42 - Math.abs(sentenceWords.length - mean) / Math.max(1, mean)) * 24);
    return { text, score, signal: score >= 72 ? "Low lexical variation" : score >= 50 ? "Moderate signal" : "Natural variation", explanation: score >= 72 ? "The sentence uses a narrow vocabulary and a predictable rhythm." : "The sentence contributes a moderate or lower-confidence signal." };
  });
  return { title, content, wordCount: allWords.length, aiProbability: clamp(sentenceSignals.reduce((sum, item) => sum + item.score, 0) / Math.max(1, sentenceSignals.length) * .7 + profile.predictability * .15 + profile.uniformity * .1 + profile.repetition * .05), confidence: allWords.length >= 120 ? "high" : allWords.length >= 45 ? "medium" : "low", readability: clamp(96 - mean * 1.42 - (allWords.reduce((sum, word) => sum + word.length, 0) / Math.max(1, allWords.length)) * 5.4), profile, sentences: sentenceSignals, model: "local-signal-v1", source: "heuristic-fallback" };
}

const responseSchema = {
  name: "dicript_detection",
  strict: true,
  schema: {
    type: "object",
    properties: {
      aiProbability: { type: "integer", description: "Probability from 0 to 100 that the writing contains AI-like signals." },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      readability: { type: "integer", description: "Writing readability score from 0 to 100, separate from AI probability." },
      profile: {
        type: "object",
        properties: { predictability: { type: "integer" }, uniformity: { type: "integer" }, repetition: { type: "integer" }, variation: { type: "integer" } },
        required: ["predictability", "uniformity", "repetition", "variation"],
        additionalProperties: false,
      },
      sentences: {
        type: "array",
        items: {
          type: "object",
          properties: { index: { type: "integer" }, score: { type: "integer" }, signal: { type: "string" }, explanation: { type: "string" } },
          required: ["index", "score", "signal", "explanation"],
          additionalProperties: false,
        },
      },
    },
    required: ["aiProbability", "confidence", "readability", "profile", "sentences"],
    additionalProperties: false,
  },
} as const;

export function mergeModelResult(content: string, title: string, raw: ModelResult): DetectionApiResult {
  const sentenceTexts = splitSentences(content);
  const modelSentences = new Map(raw.sentences.map((sentence) => [sentence.index, sentence]));
  const sentences = sentenceTexts.map((text, index) => {
    const item = modelSentences.get(index);
    return { text, score: clamp(item?.score ?? raw.aiProbability), signal: item?.signal || "Model signal", explanation: item?.explanation || "This sentence contributed to the overall probability." };
  });
  return {
    title,
    content,
    wordCount: words(content).length,
    aiProbability: clamp(raw.aiProbability),
    confidence: raw.confidence,
    readability: clamp(raw.readability),
    profile: { predictability: clamp(raw.profile.predictability), uniformity: clamp(raw.profile.uniformity), repetition: clamp(raw.profile.repetition), variation: clamp(raw.profile.variation) },
    sentences,
    model,
    source: "ai",
  };
}

export async function detectWithAI(content: string, title: string): Promise<DetectionApiResult> {
  const trimmed = content.trim();
  if (trimmed.length < 40) throw new Error("Add at least 40 characters so Dicript can inspect meaningful writing patterns.");
  try {
    const response = await invokeLLM({
      model,
      max_tokens: 5000,
      messages: [
        { role: "system", content: "You are Dicript's cautious AI-writing signal analyst. Estimate probability, never certainty. Analyze predictability, sentence rhythm, phrase repetition, and stylistic variation. Do not equate AI probability with writing quality. Return only the requested JSON. Keep explanations short and evidence-based. False positives are possible, especially for formal or edited writing." },
        { role: "user", content: `Analyze this writing sample sentence by sentence. The sample contains ${splitSentences(trimmed).length} sentences. Return one sentence item for every sentence, using zero-based indexes.\n\n${trimmed.slice(0, 30000)}` },
      ],
      response_format: { type: "json_schema", json_schema: responseSchema },
    });
    const rawContent = response.choices[0]?.message?.content;
    const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) as ModelResult : null;
    if (!parsed) throw new Error("The detection model returned an empty response.");
    return mergeModelResult(trimmed, title, parsed);
  } catch (error) {
    console.warn("[Dicript] AI detection fallback:", error instanceof Error ? error.message : error);
    return localFallback(trimmed, title);
  }
}
