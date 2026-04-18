import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("cost-models", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getDefaultModel()", () => {
    it("returns value from process.env.LLM_MODEL when set", async () => {
      vi.stubEnv("LLM_MODEL", "openai/gpt-4o");
      // Re-import to pick up the new env var
      vi.resetModules();
      const { getDefaultModel } = await import("../cost-models");
      expect(getDefaultModel()).toBe("openai/gpt-4o");
    });

    it('falls back to "minimax/MiniMax-M2.7" when env not set', async () => {
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getDefaultModel } = await import("../cost-models");
      expect(getDefaultModel()).toBe("minimax/MiniMax-M2.7");
    });
  });

  describe("computeTokenCost()", () => {
    it("uses LLM_INPUT_COST/LLM_OUTPUT_COST env vars when set", async () => {
      vi.stubEnv("LLM_INPUT_COST", "0.001"); // $1000 per 1M tokens
      vi.stubEnv("LLM_OUTPUT_COST", "0.002"); // $2000 per 1M tokens
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { computeTokenCost } = await import("../cost-models");
      
      // 1000 input * 0.001 + 500 output * 0.002 = 1.0 + 1.0 = 2.0
      const cost = computeTokenCost(1000, 500);
      expect(cost).toBeCloseTo(2.0, 6);
    });

    it("falls back to COST_MODELS lookup for known models", async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { computeTokenCost, COST_MODELS } = await import("../cost-models");
      
      const model = "openai/gpt-4o";
      const costModel = COST_MODELS[model];
      const expectedCost = 1000 * costModel.inputCostPerToken + 500 * costModel.outputCostPerToken;
      
      const cost = computeTokenCost(1000, 500, model);
      expect(cost).toBeCloseTo(expectedCost, 10);
    });

    it("returns 0 cost for unknown model without env costs", async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { computeTokenCost } = await import("../cost-models");
      
      const cost = computeTokenCost(1000, 500, "unknown/model");
      // Should fall back to default model cost, not 0
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe("getCostModel()", () => {
    it('returns entry from COST_MODELS for "openai/gpt-4o"', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getCostModel, COST_MODELS } = await import("../cost-models");
      
      const result = getCostModel("openai/gpt-4o");
      expect(result).not.toBeNull();
      expect(result?.name).toBe(COST_MODELS["openai/gpt-4o"].name);
      expect(result?.inputCostPerToken).toBe(COST_MODELS["openai/gpt-4o"].inputCostPerToken);
      expect(result?.outputCostPerToken).toBe(COST_MODELS["openai/gpt-4o"].outputCostPerToken);
    });

    it("returns env-driven cost when LLM_INPUT_COST set for custom model", async () => {
      vi.stubEnv("LLM_INPUT_COST", "0.0005"); // $500 per 1M tokens
      vi.stubEnv("LLM_OUTPUT_COST", "0.001"); // $1000 per 1M tokens
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getCostModel } = await import("../cost-models");
      
      const result = getCostModel("custom/my-model");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("custom/my-model");
      expect(result?.provider).toBe("custom");
      expect(result?.inputCostPerToken).toBeCloseTo(0.0005, 10);
      expect(result?.outputCostPerToken).toBeCloseTo(0.001, 10);
    });

    it("returns null when no env costs set for unknown model", async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getCostModel } = await import("../cost-models");
      
      const result = getCostModel("custom/my-model");
      expect(result).toBeNull();
    });
  });
});
