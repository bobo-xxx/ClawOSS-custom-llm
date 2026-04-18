import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env-config", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getEnvModel()", () => {
    it("returns process.env.LLM_MODEL or null", async () => {
      vi.stubEnv("LLM_MODEL", "anthropic/claude-sonnet-4");
      vi.resetModules();
      const { getEnvModel } = await import("../env-config");
      expect(getEnvModel()).toBe("anthropic/claude-sonnet-4");
    });

    it("returns null when LLM_MODEL is not set", async () => {
      vi.stubEnv("LLM_MODEL", undefined);
      vi.resetModules();
      const { getEnvModel } = await import("../env-config");
      expect(getEnvModel()).toBeNull();
    });
  });

  describe("getEnvApiKey()", () => {
    it("returns process.env.LLM_API_KEY or null", async () => {
      vi.stubEnv("LLM_API_KEY", "sk-test-12345");
      vi.resetModules();
      const { getEnvApiKey } = await import("../env-config");
      expect(getEnvApiKey()).toBe("sk-test-12345");
    });

    it("returns null when LLM_API_KEY is not set", async () => {
      vi.stubEnv("LLM_API_KEY", undefined);
      vi.resetModules();
      const { getEnvApiKey } = await import("../env-config");
      expect(getEnvApiKey()).toBeNull();
    });
  });

  describe("getEnvBaseUrl()", () => {
    it("returns process.env.LLM_BASE_URL or null", async () => {
      vi.stubEnv("LLM_BASE_URL", "https://api.custom.com/v1");
      vi.resetModules();
      const { getEnvBaseUrl } = await import("../env-config");
      expect(getEnvBaseUrl()).toBe("https://api.custom.com/v1");
    });

    it("returns null when LLM_BASE_URL is not set", async () => {
      vi.stubEnv("LLM_BASE_URL", undefined);
      vi.resetModules();
      const { getEnvBaseUrl } = await import("../env-config");
      expect(getEnvBaseUrl()).toBeNull();
    });
  });

  describe("getEnvApiType()", () => {
    it('returns process.env.LLM_API_TYPE or "openai-completions"', async () => {
      vi.stubEnv("LLM_API_TYPE", "anthropic");
      vi.resetModules();
      const { getEnvApiType } = await import("../env-config");
      expect(getEnvApiType()).toBe("anthropic");
    });

    it('returns "openai-completions" when LLM_API_TYPE is not set', async () => {
      vi.stubEnv("LLM_API_TYPE", undefined);
      vi.resetModules();
      const { getEnvApiType } = await import("../env-config");
      expect(getEnvApiType()).toBe("openai-completions");
    });
  });

  describe("getEnvFallbackModel()", () => {
    it("returns process.env.LLM_FALLBACK_MODEL or null", async () => {
      vi.stubEnv("LLM_FALLBACK_MODEL", "kimi-coding/k2p5");
      vi.resetModules();
      const { getEnvFallbackModel } = await import("../env-config");
      expect(getEnvFallbackModel()).toBe("kimi-coding/k2p5");
    });

    it("returns null when LLM_FALLBACK_MODEL is not set", async () => {
      vi.stubEnv("LLM_FALLBACK_MODEL", undefined);
      vi.resetModules();
      const { getEnvFallbackModel } = await import("../env-config");
      expect(getEnvFallbackModel()).toBeNull();
    });
  });

  describe("getEnvCostConfig()", () => {
    it("returns {inputCost, outputCost} from env or null", async () => {
      vi.stubEnv("LLM_INPUT_COST", "0.002");
      vi.stubEnv("LLM_OUTPUT_COST", "0.004");
      vi.resetModules();
      const { getEnvCostConfig } = await import("../env-config");
      const config = getEnvCostConfig();
      expect(config).toEqual({ inputCost: 0.002, outputCost: 0.004 });
    });

    it("returns null when env costs are not set", async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.resetModules();
      const { getEnvCostConfig } = await import("../env-config");
      expect(getEnvCostConfig()).toBeNull();
    });

    it("returns null when only input cost is set", async () => {
      vi.stubEnv("LLM_INPUT_COST", "0.002");
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      vi.resetModules();
      const { getEnvCostConfig } = await import("../env-config");
      expect(getEnvCostConfig()).toBeNull();
    });

    it("returns null when only output cost is set", async () => {
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", "0.004");
      vi.resetModules();
      const { getEnvCostConfig } = await import("../env-config");
      expect(getEnvCostConfig()).toBeNull();
    });
  });

  describe("getEnvModelMeta()", () => {
    it("returns {contextWindow, maxTokens} from env or defaults", async () => {
      vi.stubEnv("LLM_CONTEXT_WINDOW", "128000");
      vi.stubEnv("LLM_MAX_TOKENS", "8192");
      vi.resetModules();
      const { getEnvModelMeta } = await import("../env-config");
      const meta = getEnvModelMeta();
      expect(meta).toEqual({ contextWindow: 128000, maxTokens: 8192 });
    });

    it("returns defaults when env vars are not set", async () => {
      vi.stubEnv("LLM_CONTEXT_WINDOW", undefined);
      vi.stubEnv("LLM_MAX_TOKENS", undefined);
      vi.resetModules();
      const { getEnvModelMeta } = await import("../env-config");
      const meta = getEnvModelMeta();
      // Default values: MiniMax M2.7 specs
      expect(meta).toEqual({ contextWindow: 204800, maxTokens: 131072 });
    });
  });
});
