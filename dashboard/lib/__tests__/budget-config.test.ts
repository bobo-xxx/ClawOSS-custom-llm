import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("budget-config", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getBudgetCapUsd()", () => {
    it("returns process.env.BUDGET_CAP_USD parsed as float when set", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "50.5");
      vi.resetModules();
      const { getBudgetCapUsd } = await import("../budget-config");
      expect(getBudgetCapUsd()).toBe(50.5);
    });

    it("returns null when env not set (no cap)", async () => {
      vi.stubEnv("BUDGET_CAP_USD", undefined);
      vi.resetModules();
      const { getBudgetCapUsd } = await import("../budget-config");
      expect(getBudgetCapUsd()).toBeNull();
    });

    it("returns null for negative values", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "-10");
      vi.resetModules();
      const { getBudgetCapUsd } = await import("../budget-config");
      expect(getBudgetCapUsd()).toBeNull();
    });

    it("returns null for zero", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "0");
      vi.resetModules();
      const { getBudgetCapUsd } = await import("../budget-config");
      expect(getBudgetCapUsd()).toBeNull();
    });

    it("returns null for non-numeric values", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "invalid");
      vi.resetModules();
      const { getBudgetCapUsd } = await import("../budget-config");
      expect(getBudgetCapUsd()).toBeNull();
    });
  });

  describe("isBudgetEnabled()", () => {
    it("returns true when BUDGET_CAP_USD is a valid positive number", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "100");
      vi.resetModules();
      const { isBudgetEnabled } = await import("../budget-config");
      expect(isBudgetEnabled()).toBe(true);
    });

    it("returns false when BUDGET_CAP_USD is not set", async () => {
      vi.stubEnv("BUDGET_CAP_USD", undefined);
      vi.resetModules();
      const { isBudgetEnabled } = await import("../budget-config");
      expect(isBudgetEnabled()).toBe(false);
    });

    it("returns false when BUDGET_CAP_USD is zero", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "0");
      vi.resetModules();
      const { isBudgetEnabled } = await import("../budget-config");
      expect(isBudgetEnabled()).toBe(false);
    });

    it("returns false when BUDGET_CAP_USD is negative", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "-50");
      vi.resetModules();
      const { isBudgetEnabled } = await import("../budget-config");
      expect(isBudgetEnabled()).toBe(false);
    });

    it("returns false when BUDGET_CAP_USD is non-numeric", async () => {
      vi.stubEnv("BUDGET_CAP_USD", "abc");
      vi.resetModules();
      const { isBudgetEnabled } = await import("../budget-config");
      expect(isBudgetEnabled()).toBe(false);
    });
  });
});
