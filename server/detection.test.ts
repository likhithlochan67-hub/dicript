import { describe, expect, it } from "vitest";
import { analyzeText, sampleText } from "../client/src/lib/detection";

describe("Dicript writing signals", () => {
  it("returns bounded profile and sentence-level signals", () => {
    const result = analyzeText(sampleText, "Sample draft");

    expect(result.title).toBe("Sample draft");
    expect(result.wordCount).toBeGreaterThan(30);
    expect(result.sentences.length).toBeGreaterThan(2);
    expect(result.aiProbability).toBeGreaterThanOrEqual(0);
    expect(result.aiProbability).toBeLessThanOrEqual(100);
    expect(result.readability).toBeGreaterThanOrEqual(0);
    expect(result.readability).toBeLessThanOrEqual(100);
    expect(result.sentences.every((sentence) => sentence.score >= 0 && sentence.score <= 100)).toBe(true);
  });

  it("keeps short drafts low-confidence instead of overstating certainty", () => {
    const result = analyzeText("A short sentence. Another thought.");

    expect(result.confidence).toBe("low");
    expect(result.wordCount).toBeLessThan(45);
  });
});
