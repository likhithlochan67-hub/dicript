export type Confidence = "low" | "medium" | "high";

export type SentenceSignal = {
  text: string;
  score: number;
  signal: string;
  explanation: string;
};

export type DetectionResult = {
  title: string;
  content: string;
  wordCount: number;
  aiProbability: number;
  confidence: Confidence;
  readability: number;
  profile: {
    predictability: number;
    uniformity: number;
    repetition: number;
    variation: number;
  };
  sentences: SentenceSignal[];
};

const transitions = /\b(additionally|furthermore|moreover|in conclusion|overall|therefore|however|ultimately|it is important to note)\b/gi;
const words = (text: string) => text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function splitSentences(content: string) {
  return content.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function sentenceSignal(sentence: string, index: number, allSentences: string[]): SentenceSignal {
  const sentenceWords = words(sentence);
  const uniqueRatio = new Set(sentenceWords).size / Math.max(1, sentenceWords.length);
  const length = sentenceWords.length;
  const lengths = allSentences.map((item) => words(item).length);
  const meanLength = average(lengths);
  const lengthDistance = Math.abs(length - meanLength) / Math.max(1, meanLength);
  const transitionCount = (sentence.match(transitions) ?? []).length;
  const score = clamp(54 + (1 - uniqueRatio) * 36 + Math.max(0, 0.42 - lengthDistance) * 24 + transitionCount * 5);

  if (score >= 72) {
    return {
      text: sentence,
      score,
      signal: transitionCount ? "Predictable transition" : "Low lexical variation",
      explanation: transitionCount
        ? "A familiar transition pattern makes the sentence easy to predict in context."
        : "The sentence reuses a narrow set of terms and follows a highly regular rhythm.",
    };
  }
  if (score >= 50) {
    return {
      text: sentence,
      score,
      signal: "Moderate signal",
      explanation: "Some regularity is present, but the sentence still shows useful variation.",
    };
  }
  return {
    text: sentence,
    score,
    signal: "Natural variation",
    explanation: "Word choice and sentence rhythm introduce a lower-confidence AI-like signal.",
  };
}

export function analyzeText(content: string, title = "Untitled analysis"): DetectionResult {
  const cleanContent = content.trim();
  const sentenceTexts = splitSentences(cleanContent);
  const allWords = words(cleanContent);
  const uniqueRatio = new Set(allWords).size / Math.max(1, allWords.length);
  const sentenceLengths = sentenceTexts.map((sentence) => words(sentence).length);
  const meanLength = average(sentenceLengths);
  const lengthVariance = average(sentenceLengths.map((length) => Math.abs(length - meanLength))) / Math.max(1, meanLength);
  const transitionCount = (cleanContent.match(transitions) ?? []).length;
  const sentenceSignals = sentenceTexts.map((sentence, index) => sentenceSignal(sentence, index, sentenceTexts));
  const predictability = clamp(42 + (1 - uniqueRatio) * 54 + transitionCount * 3);
  const uniformity = clamp(42 + (1 - Math.min(1, lengthVariance * 2.1)) * 50);
  const repetition = clamp(18 + Math.max(0, 0.72 - uniqueRatio) * 120);
  const variation = clamp(100 - (predictability * 0.38 + uniformity * 0.28 + repetition * 0.34));
  const aiProbability = clamp(average(sentenceSignals.map((sentence) => sentence.score)) * 0.62 + predictability * 0.15 + uniformity * 0.12 + repetition * 0.11);
  const readability = clamp(96 - meanLength * 1.42 - (allWords.reduce((sum, word) => sum + word.length, 0) / Math.max(1, allWords.length)) * 5.4);
  const confidence: Confidence = allWords.length >= 120 ? "high" : allWords.length >= 45 ? "medium" : "low";

  return {
    title,
    content: cleanContent,
    wordCount: allWords.length,
    aiProbability,
    confidence,
    readability,
    profile: { predictability, uniformity, repetition, variation },
    sentences: sentenceSignals,
  };
}

export const sampleText = `Artificial intelligence has transformed the way people create and communicate online. Additionally, it is important to note that modern writing tools can make content faster, clearer, and more accessible. However, writers should still review every draft carefully to ensure that the final work reflects their own perspective and voice. Overall, the best results come from combining useful tools with thoughtful human judgment.`;
