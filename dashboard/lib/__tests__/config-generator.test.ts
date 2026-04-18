import { describe, it, expect } from "vitest";

interface ProviderConfig {
  baseUrl?: string;
  apiKey: string;
  api: string;
  authHeader?: boolean;
  models: Array<{
    id: string;
    name: string;
    reasoning?: boolean;
    input: string[];
    cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
    contextWindow: number;
    maxTokens: number;
  }>;
}

interface GeneratedConfig {
  providers: Record<string, ProviderConfig>;
  modelConfig: {
    primary: string;
    fallbacks: string[];
  };
}

interface EnvVars {
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_FALLBACK_MODEL?: string;
  LLM_API_TYPE?: string;
  LLM_CONTEXT_WINDOW?: string;
  LLM_MAX_TOKENS?: string;
}

describe("config-generator", () => {
  describe("generateProviderConfig()", () => {
    it("when LLM_MODEL and LLM_API_KEY set, generates provider config with correct model", async () => {
      const env: EnvVars = {
        LLM_MODEL: "openai/gpt-4o",
        LLM_API_KEY: "sk-test-key",
      };
      
      const { generateProviderConfig } = await import("../config-generator");
      const config: GeneratedConfig = generateProviderConfig(env);
      
      expect(config.modelConfig.primary).toBe("openai/gpt-4o");
      expect(config.providers).toHaveProperty("openai");
      expect(config.providers.openai.apiKey).toBe("sk-test-key");
      expect(config.providers.openai.models[0].id).toBe("gpt-4o");
    });

    it("when LLM_BASE_URL set, generates custom provider with that baseUrl", async () => {
      const env: EnvVars = {
        LLM_MODEL: "custom/my-model",
        LLM_API_KEY: "custom-key",
        LLM_BASE_URL: "https://api.custom.com/v1",
      };
      
      const { generateProviderConfig } = await import("../config-generator");
      const config: GeneratedConfig = generateProviderConfig(env);
      
      expect(config.providers.custom).toBeDefined();
      expect(config.providers.custom.baseUrl).toBe("https://api.custom.com/v1");
    });

    it("when LLM_FALLBACK_MODEL set, adds to fallbacks array", async () => {
      const env: EnvVars = {
        LLM_MODEL: "openai/gpt-4o",
        LLM_API_KEY: "sk-test",
        LLM_FALLBACK_MODEL: "kimi-coding/k2p5",
      };
      
      const { generateProviderConfig } = await import("../config-generator");
      const config: GeneratedConfig = generateProviderConfig(env);
      
      expect(config.modelConfig.fallbacks).toContain("kimi-coding/k2p5");
    });

    it("when only LLM_MODEL set (no LLM_BASE_URL), relies on built-in provider", async () => {
      const env: EnvVars = {
        LLM_MODEL: "kimi-coding/k2p5",
        LLM_API_KEY: "kimi-key",
      };
      
      const { generateProviderConfig } = await import("../config-generator");
      const config: GeneratedConfig = generateProviderConfig(env);
      
      expect(config.providers.custom).toBeUndefined();
    });

    it('Model ID extraction: "openai/gpt-4o" -> provider="openai", id="gpt-4o"', async () => {
      const env: EnvVars = {
        LLM_MODEL: "openai/gpt-4o",
        LLM_API_KEY: "sk-test",
        LLM_BASE_URL: "https://api.openai.com/v1",
      };
      
      const { generateProviderConfig, parseModelString } = await import("../config-generator");
      
      const parsed = parseModelString("openai/gpt-4o");
      expect(parsed.provider).toBe("openai");
      expect(parsed.id).toBe("gpt-4o");
      
      const config: GeneratedConfig = generateProviderConfig(env);
      expect(config.providers.openai.models[0].id).toBe("gpt-4o");
    });
  });
});
