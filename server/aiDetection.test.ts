import { describe, expect, it } from "vitest";
import { mergeModelResult } from "./aiDetection";

describe("Dicript AI detection response", () => {
  it("maps structured model scores back onto every source sentence", () => {
    const content = "First sentence with a clear idea. Second sentence adds another idea.";
    const result = mergeModelResult(content, "Draft", {
      aiProbability: 64,
      confidence: "medium",
      readability: 71,
      profile: { predictability: 62, uniformity: 58, repetition: 20, variation: 74 },
      sentences: [
        { index: 0, score: 70, signal: "Moderate signal", explanation: "Some regularity." },
        { index: 1, score: 55, signal: "Natural variation", explanation: "More variation." },
      ],
    });

    expect(result.source).toBe("ai");
    expect(result.model).toBe("claude-haiku-4-5");
    expect(result.wordCount).toBe(11);
    expect(result.sentences).toHaveLength(2);
    expect(result.sentences[0]).toMatchObject({ text: "First sentence with a clear idea.", score: 70 });
    expect(result.sentences[1]).toMatchObject({ text: "Second sentence adds another idea.", score: 55 });
  });

  it("clamps unsafe model values before returning them to the client", () => {
    const result = mergeModelResult("A sentence long enough for a test.", "Draft", {
      aiProbability: 130,
      confidence: "high",
      readability: -2,
      profile: { predictability: 101, uniformity: -4, repetition: 44, variation: 77 },
      sentences: [{ index: 0, score: 140, signal: "Signal", explanation: "Explanation" }],
    });

    expect(result.aiProbability).toBe(100);
    expect(result.readability).toBe(0);
    expect(result.profile.predictability).toBe(100);
    expect(result.profile.uniformity).toBe(0);
    expect(result.sentences[0]?.score).toBe(100);
  });
});
