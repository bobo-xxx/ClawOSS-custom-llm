import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("model-info", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getModelDisplayName()", () => {
    it('returns "GPT-4o" for "openai/gpt-4o"', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName("openai/gpt-4o")).toBe("GPT-4o");
    });

    it('returns "MiniMax M2.7" for "minimax/MiniMax-M2.7"', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName("minimax/MiniMax-M2.7")).toBe("MiniMax M2.7");
    });

    it('returns "DeepSeek V3.2" for "deepseek/deepseek-v3.2"', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName("deepseek/deepseek-v3.2")).toBe("DeepSeek V3.2");
    });

    it('returns "GLM-5.1 (SiliconFlow)" for "siliconflow/Pro/zai-org/GLM-5.1"', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName("siliconflow/Pro/zai-org/GLM-5.1")).toBe("GLM-5.1 (SiliconFlow)");
    });

    it('returns model string as-is for unknown model', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName("custom/my-model")).toBe("custom/my-model");
    });

    it('returns "Unknown" for null input', async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getModelDisplayName } = await import("../model-info");
      expect(getModelDisplayName(null)).toBe("Unknown");
    });
  });

  describe("getCurrentModelInfo()", () => {
    it("returns model info from env + cost-models", async () => {
      vi.stubEnv("LLM_MODEL", "openai/gpt-4o");
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("BUDGET_CAP_USD", "100");
      vi.resetModules();
      const { getCurrentModelInfo } = await import("../model-info");
      
      const info = getCurrentModelInfo();
      expect(info.model).toBe("openai/gpt-4o");
      expect(info.displayName).toBe("GPT-4o");
      expect(info.provider).toBe("openrouter");
      expect(info.inputCost).toBeDefined();
      expect(info.outputCost).toBeDefined();
      expect(info.budgetEnabled).toBe(true);
      expect(info.budgetCap).toBe(100);
    });

    it("returns MiniMax M2.7 as default when LLM_MODEL not set", async () => {
      vi.stubEnv("LLM_MODEL", undefined);
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.stubEnv("BUDGET_CAP_USD", undefined);
      vi.resetModules();
      const { getCurrentModelInfo } = await import("../model-info");
      
      const info = getCurrentModelInfo();
      expect(info.model).toBe("minimax/MiniMax-M2.7");
      expect(info.displayName).toBe("MiniMax M2.7");
      expect(info.provider).toBe("minimax");
      expect(info.budgetEnabled).toBe(false);
    });

    it("uses env costs when LLM_INPUT_COST/LLM_OUTPUT_COST are set", async () => {
      vi.stubEnv("LLM_MODEL", "custom/my-model");
      vi.stubEnv("LLM_INPUT_COST", "0.0005");
      vi.stubEnv("LLM_OUTPUT_COST", "0.001");
      vi.stubEnv("BUDGET_CAP_USD", undefined);
      vi.resetModules();
      const { getCurrentModelInfo } = await import("../model-info");
      
      const info = getCurrentModelInfo();
      expect(info.model).toBe("custom/my-model");
      expect(info.displayName).toBe("custom/my-model");
      expect(info.inputCost).toBeCloseTo(0.0005, 10);
      expect(info.outputCost).toBeCloseTo(0.001, 10);
    });
  });
});
