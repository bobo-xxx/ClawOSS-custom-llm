import { COST_MODELS, getDefaultModel, getCostModel } from "./cost-models";
import { getBudgetCapUsd, isBudgetEnabled } from "./budget-config";

export function getModelDisplayName(model: string | null): string {
  if (!model) {
    return "Unknown";
  }

  const costModel = COST_MODELS[model];
  if (costModel) {
    return costModel.name;
  }

  return model;
}

export interface ModelInfo {
  model: string;
  displayName: string;
  provider: string;
  inputCost: number;
  outputCost: number;
  budgetEnabled: boolean;
  budgetCap: number | null;
}

export function getCurrentModelInfo(): ModelInfo {
  const model = getDefaultModel();
  const costModel = getCostModel(model);

  const displayName = getModelDisplayName(model);
  const provider = costModel?.provider || "unknown";
  const inputCost = costModel?.inputCostPerToken || 0;
  const outputCost = costModel?.outputCostPerToken || 0;
  const budgetEnabled = isBudgetEnabled();
  const budgetCap = getBudgetCapUsd();

  return {
    model,
    displayName,
    provider,
    inputCost,
    outputCost,
    budgetEnabled,
    budgetCap,
  };
}
