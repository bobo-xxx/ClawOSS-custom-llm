/** Trim whitespace/newlines from env var values (Vercel CLI <<< adds trailing newline) */
function clean(v: string | undefined): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed || null;
}

export function getEnvModel(): string | null {
  return clean(process.env.LLM_MODEL);
}

export function getEnvApiKey(): string | null {
  return clean(process.env.LLM_API_KEY);
}

export function getEnvBaseUrl(): string | null {
  return clean(process.env.LLM_BASE_URL);
}

export function getEnvApiType(): string {
  return clean(process.env.LLM_API_TYPE) || "openai-completions";
}

export function getEnvFallbackModel(): string | null {
  return clean(process.env.LLM_FALLBACK_MODEL);
}

export interface EnvCostConfig {
  inputCost: number;
  outputCost: number;
}

export function getEnvCostConfig(): EnvCostConfig | null {
  const inputCostStr = clean(process.env.LLM_INPUT_COST);
  const outputCostStr = clean(process.env.LLM_OUTPUT_COST);
  
  if (!inputCostStr || !outputCostStr) {
    return null;
  }
  
  const inputCostPerMillion = parseFloat(inputCostStr);
  const outputCostPerMillion = parseFloat(outputCostStr);
  
  if (isNaN(inputCostPerMillion) || isNaN(outputCostPerMillion)) {
    return null;
  }
  
  return {
    inputCost: inputCostPerMillion / 1_000_000,
    outputCost: outputCostPerMillion / 1_000_000,
  };
}

export interface EnvModelMeta {
  contextWindow: number;
  maxTokens: number;
}

export function getEnvModelMeta(): EnvModelMeta {
  const contextWindowStr = clean(process.env.LLM_CONTEXT_WINDOW);
  const maxTokensStr = clean(process.env.LLM_MAX_TOKENS);
  
  const contextWindow = contextWindowStr ? parseInt(contextWindowStr, 10) : 128000;
  const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 8192;
  
  return {
    contextWindow: isNaN(contextWindow) ? 128000 : contextWindow,
    maxTokens: isNaN(maxTokens) ? 8192 : maxTokens,
  };
}
