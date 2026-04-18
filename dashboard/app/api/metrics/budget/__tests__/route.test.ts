import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockGetBudgetCapUsd = vi.fn();
const mockIsBudgetEnabled = vi.fn();

vi.mock("@/lib/db", () => ({
  ensureDb: vi.fn().mockResolvedValue({}),
  db: {
    select: () => mockSelect(),
  },
}));

vi.mock("@/lib/budget-config", () => ({
  getBudgetCapUsd: () => mockGetBudgetCapUsd(),
  isBudgetEnabled: () => mockIsBudgetEnabled(),
}));

describe("budget API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/metrics/budget", () => {
    it("returns { enabled: false } when BUDGET_CAP_USD not set", async () => {
      mockGetBudgetCapUsd.mockReturnValue(null);
      mockIsBudgetEnabled.mockReturnValue(false);

      const { GET } = await import("../route");
      const response = await GET();
      const data = await response.json();

      expect(data).toEqual({ enabled: false });
    });

    it("returns budget status with cap=50 when BUDGET_CAP_USD=50", async () => {
      mockGetBudgetCapUsd.mockReturnValue(50);
      mockIsBudgetEnabled.mockReturnValue(true);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockResolvedValue([{ totalCost: 30.25 }]);

      vi.resetModules();
      const { GET } = await import("../route");
      const response = await GET();
      const data = await response.json();

      expect(data.enabled).toBe(true);
      expect(data.cap).toBe(50);
      expect(data.spent).toBe(30.25);
      expect(data.remaining).toBeCloseTo(19.75, 2);
      expect(data.percentUsed).toBeCloseTo(60.5, 1);
      expect(data.isOverBudget).toBe(false);
    });

    it("returns isOverBudget=true when spent exceeds cap", async () => {
      mockGetBudgetCapUsd.mockReturnValue(50);
      mockIsBudgetEnabled.mockReturnValue(true);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockResolvedValue([{ totalCost: 75 }]);

      vi.resetModules();
      const { GET } = await import("../route");
      const response = await GET();
      const data = await response.json();

      expect(data.enabled).toBe(true);
      expect(data.cap).toBe(50);
      expect(data.spent).toBe(75);
      expect(data.remaining).toBe(-25);
      expect(data.percentUsed).toBe(150);
      expect(data.isOverBudget).toBe(true);
    });

    it("spent value comes from cumulative cost in metricsTokens table", async () => {
      const mockTotalCost = 42.75;
      
      mockGetBudgetCapUsd.mockReturnValue(100);
      mockIsBudgetEnabled.mockReturnValue(true);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockResolvedValue([{ totalCost: mockTotalCost }]);

      vi.resetModules();
      const { GET } = await import("../route");
      const response = await GET();
      const data = await response.json();

      expect(data.spent).toBe(mockTotalCost);
    });

    it("handles zero spent correctly", async () => {
      mockGetBudgetCapUsd.mockReturnValue(50);
      mockIsBudgetEnabled.mockReturnValue(true);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockResolvedValue([{ totalCost: 0 }]);

      vi.resetModules();
      const { GET } = await import("../route");
      const response = await GET();
      const data = await response.json();

      expect(data.spent).toBe(0);
      expect(data.remaining).toBe(50);
      expect(data.percentUsed).toBe(0);
      expect(data.isOverBudget).toBe(false);
    });
  });
});
