export function getEnvModel(): string | null {
  return process.env.LLM_MODEL || null;
}

export function getEnvApiKey(): string | null {
  return process.env.LLM_API_KEY || null;
}

export function getEnvBaseUrl(): string | null {
  return process.env.LLM_BASE_URL || null;
}

export function getEnvApiType(): string {
  return process.env.LLM_API_TYPE || "openai-completions";
}

export function getEnvFallbackModel(): string | null {
  return process.env.LLM_FALLBACK_MODEL || null;
}

export interface EnvCostConfig {
  inputCost: number;
  outputCost: number;
}

export function getEnvCostConfig(): EnvCostConfig | null {
  const inputCostStr = process.env.LLM_INPUT_COST;
  const outputCostStr = process.env.LLM_OUTPUT_COST;
  
  if (!inputCostStr || !outputCostStr) {
    return null;
  }
  
  const inputCost = parseFloat(inputCostStr);
  const outputCost = parseFloat(outputCostStr);
  
  if (isNaN(inputCost) || isNaN(outputCost)) {
    return null;
  }
  
  return { inputCost, outputCost };
}

export interface EnvModelMeta {
  contextWindow: number;
  maxTokens: number;
}

export function getEnvModelMeta(): EnvModelMeta {
  const contextWindowStr = process.env.LLM_CONTEXT_WINDOW;
  const maxTokensStr = process.env.LLM_MAX_TOKENS;
  
  const contextWindow = contextWindowStr ? parseInt(contextWindowStr, 10) : 204800;
  const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 131072;
  
  return {
    contextWindow: isNaN(contextWindow) ? 204800 : contextWindow,
    maxTokens: isNaN(maxTokens) ? 131072 : maxTokens,
  };
}
