import { describe, it, expect } from "vitest";
import { calculateBudgetStatus } from "../budget-calculator";

describe("budget-calculator", () => {
  describe("calculateBudgetStatus()", () => {
    it("returns { spent, cap, remaining, percentUsed, isOverBudget }", () => {
      const result = calculateBudgetStatus(30, 50);
      
      expect(result).toHaveProperty("spent", 30);
      expect(result).toHaveProperty("cap", 50);
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("percentUsed");
      expect(result).toHaveProperty("isOverBudget");
    });

    it("when spent=30, cap=50: remaining=20, percentUsed=60, isOverBudget=false", () => {
      const result = calculateBudgetStatus(30, 50)!;
      
      expect(result.spent).toBe(30);
      expect(result.cap).toBe(50);
      expect(result.remaining).toBe(20);
      expect(result.percentUsed).toBe(60);
      expect(result.isOverBudget).toBe(false);
    });

    it("when spent=50, cap=50: remaining=0, percentUsed=100, isOverBudget=true", () => {
      const result = calculateBudgetStatus(50, 50)!;
      
      expect(result.spent).toBe(50);
      expect(result.cap).toBe(50);
      expect(result.remaining).toBe(0);
      expect(result.percentUsed).toBe(100);
      expect(result.isOverBudget).toBe(true);
    });

    it("when spent=60, cap=50: remaining=-10, percentUsed=120, isOverBudget=true", () => {
      const result = calculateBudgetStatus(60, 50)!;
      
      expect(result.spent).toBe(60);
      expect(result.cap).toBe(50);
      expect(result.remaining).toBe(-10);
      expect(result.percentUsed).toBe(120);
      expect(result.isOverBudget).toBe(true);
    });

    it("when cap is null: returns null (no budget tracking)", () => {
      const result = calculateBudgetStatus(100, null);
      
      expect(result).toBeNull();
    });

    it("handles zero spent correctly", () => {
      const result = calculateBudgetStatus(0, 50)!;
      
      expect(result.spent).toBe(0);
      expect(result.remaining).toBe(50);
      expect(result.percentUsed).toBe(0);
      expect(result.isOverBudget).toBe(false);
    });

    it("handles decimal values correctly", () => {
      const result = calculateBudgetStatus(25.5, 100)!;
      
      expect(result.spent).toBe(25.5);
      expect(result.remaining).toBe(74.5);
      expect(result.percentUsed).toBe(25.5);
      expect(result.isOverBudget).toBe(false);
    });

    it("rounds percentUsed to 1 decimal place", () => {
      const result = calculateBudgetStatus(33.33, 100)!;
      
      expect(result.percentUsed).toBe(33.3);
    });
  });
});
