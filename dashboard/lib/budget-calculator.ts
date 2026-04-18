export interface BudgetStatus {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  spentToday: number;
}

export function calculateBudgetStatus(spent: number, cap: number | null): BudgetStatus | null {
  if (cap === null) {
    return null;
  }

  const remaining = cap - spent;
  const percentUsed = Math.round((spent / cap) * 1000) / 10;
  const isOverBudget = spent >= cap;

  return {
    spent,
    cap,
    remaining,
    percentUsed,
    isOverBudget,
    spentToday: 0, // caller must override with today's spend
  };
}
