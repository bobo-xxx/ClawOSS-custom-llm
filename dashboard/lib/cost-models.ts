import { getEnvCostConfig, getEnvModel } from "./env-config";

export interface CostModel {
  name: string;
  provider: string;
  inputCostPerToken: number;
  outputCostPerToken: number;
}

export const COST_MODELS: Record<string, CostModel> = {
  "kimi-coding/k2p5": {
    name: "Kimi K2.5 (Kimi Code)",
    provider: "kimi-code",
    inputCostPerToken: 0.6 / 1_000_000,
    outputCostPerToken: 3.0 / 1_000_000,
  },
  "z-ai/glm-5": {
    name: "GLM-5",
    provider: "openrouter",
    inputCostPerToken: 0.72 / 1_000_000,
    outputCostPerToken: 2.3 / 1_000_000,
  },
  "moonshotai/kimi-k2.5": {
    name: "Kimi K2.5 (OpenRouter)",
    provider: "openrouter",
    inputCostPerToken: 0.45 / 1_000_000,
    outputCostPerToken: 2.2 / 1_000_000,
  },
  "minimax/MiniMax-M2.7": {
    name: "MiniMax M2.7",
    provider: "minimax",
    inputCostPerToken: 0.3 / 1_000_000,
    outputCostPerToken: 1.2 / 1_000_000,
  },
  "minimax/MiniMax-M1-80k": {
    name: "MiniMax M2.5 (legacy)",
    provider: "openrouter",
    inputCostPerToken: 0.25 / 1_000_000,
    outputCostPerToken: 1.2 / 1_000_000,
  },
  "minimax/MiniMax-M1": {
    name: "MiniMax M1",
    provider: "openrouter",
    inputCostPerToken: 0.25 / 1_000_000,
    outputCostPerToken: 1.2 / 1_000_000,
  },
  "anthropic/claude-sonnet-4-20250514": {
    name: "Claude Sonnet 4",
    provider: "openrouter",
    inputCostPerToken: 3.0 / 1_000_000,
    outputCostPerToken: 15.0 / 1_000_000,
  },
  "openai/gpt-4o": {
    name: "GPT-4o",
    provider: "openrouter",
    inputCostPerToken: 2.5 / 1_000_000,
    outputCostPerToken: 10.0 / 1_000_000,
  },
  "deepseek/deepseek-v3.2": {
    name: "DeepSeek V3.2",
    provider: "deepseek",
    inputCostPerToken: 0.5 / 1_000_000,
    outputCostPerToken: 2.0 / 1_000_000,
  },
  "siliconflow/Pro/zai-org/GLM-5.1": {
    name: "GLM-5.1 (SiliconFlow)",
    provider: "siliconflow",
    inputCostPerToken: 0.5 / 1_000_000,
    outputCostPerToken: 2.0 / 1_000_000,
  },
};

const DEFAULT_MODEL_FALLBACK = "minimax/MiniMax-M2.7";

export function getDefaultModel(): string {
  return getEnvModel() || DEFAULT_MODEL_FALLBACK;
}

export const DEFAULT_MODEL = getDefaultModel();
export const DEFAULT_COST_MODEL = COST_MODELS[DEFAULT_MODEL] || COST_MODELS[DEFAULT_MODEL_FALLBACK];

export function getCostModel(model: string): CostModel | null {
  if (COST_MODELS[model]) {
    return COST_MODELS[model];
  }
  
  const envCostConfig = getEnvCostConfig();
  if (envCostConfig) {
    const [provider, id] = model.includes("/") ? model.split("/") : ["custom", model];
    return {
      name: model,
      provider: provider || "custom",
      inputCostPerToken: envCostConfig.inputCost,
      outputCostPerToken: envCostConfig.outputCost,
    };
  }
  
  return null;
}

export function computeTokenCost(
  inputTokens: number,
  outputTokens: number,
  model?: string
): number {
  const envCostConfig = getEnvCostConfig();
  if (envCostConfig) {
    return inputTokens * envCostConfig.inputCost + outputTokens * envCostConfig.outputCost;
  }
  
  const costModel = (model && getCostModel(model)) || DEFAULT_COST_MODEL;
  return (
    inputTokens * costModel.inputCostPerToken +
    outputTokens * costModel.outputCostPerToken
  );
}
