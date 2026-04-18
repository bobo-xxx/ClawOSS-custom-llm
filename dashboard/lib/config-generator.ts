import { getEnvModelMeta } from "./env-config";

export interface ProviderConfig {
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

export interface GeneratedConfig {
  providers: Record<string, ProviderConfig>;
  modelConfig: {
    primary: string;
    fallbacks: string[];
  };
}

export interface EnvVars {
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_FALLBACK_MODEL?: string;
  LLM_API_TYPE?: string;
  LLM_CONTEXT_WINDOW?: string;
  LLM_MAX_TOKENS?: string;
}

export interface ParsedModel {
  provider: string;
  id: string;
}

const BUILTIN_PROVIDERS = new Set(["kimi-coding", "minimax"]);

export function parseModelString(model: string): ParsedModel {
  if (model.includes("/")) {
    const [provider, id] = model.split("/");
    return { provider: provider || "custom", id: id || model };
  }
  return { provider: "custom", id: model };
}

export function generateProviderConfig(env: EnvVars): GeneratedConfig {
  const providers: Record<string, ProviderConfig> = {};
  const fallbacks: string[] = [];
  
  const model = env.LLM_MODEL;
  const apiKey = env.LLM_API_KEY;
  const baseUrl = env.LLM_BASE_URL;
  const fallbackModel = env.LLM_FALLBACK_MODEL;
  const apiType = env.LLM_API_TYPE || "openai-completions";
  
  if (!model) {
    return {
      providers,
      modelConfig: {
        primary: "minimax/MiniMax-M2.7",
        fallbacks: [],
      },
    };
  }
  
  if (fallbackModel) {
    fallbacks.push(fallbackModel);
  }
  
  const { provider, id } = parseModelString(model);
  
  if (apiKey && !BUILTIN_PROVIDERS.has(provider)) {
    const meta = getEnvModelMeta();
    const providerConfig: ProviderConfig = {
      apiKey,
      api: apiType,
      authHeader: true,
      models: [
        {
          id,
          name: model,
          reasoning: true,
          input: ["text"],
          contextWindow: meta.contextWindow,
          maxTokens: meta.maxTokens,
        },
      ],
    };
    
    if (baseUrl) {
      providerConfig.baseUrl = baseUrl;
    }
    
    providers[provider] = providerConfig;
  }
  
  return {
    providers,
    modelConfig: {
      primary: model,
      fallbacks,
    },
  };
}
