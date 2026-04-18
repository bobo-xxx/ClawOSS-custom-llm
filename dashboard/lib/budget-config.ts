export function getBudgetCapUsd(): number | null {
  const budgetCapStr = process.env.BUDGET_CAP_USD;
  
  if (!budgetCapStr) {
    return null;
  }
  
  const budgetCap = parseFloat(budgetCapStr);
  
  if (isNaN(budgetCap) || budgetCap <= 0) {
    return null;
  }
  
  return budgetCap;
}

export function isBudgetEnabled(): boolean {
  return getBudgetCapUsd() !== null;
}
