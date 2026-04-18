import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockValidateApiKey = vi.fn();
const mockComputeTokenCost = vi.fn();
const mockGetCostModel = vi.fn();

vi.mock("@/lib/auth-api", () => ({
  validateApiKey: () => mockValidateApiKey(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/db", () => ({
  ensureDb: vi.fn().mockResolvedValue({}),
  db: {
    insert: () => mockInsert(),
  },
}));

vi.mock("@/lib/cost-models", () => ({
  computeTokenCost: (input: number, output: number, model?: string) => mockComputeTokenCost(input, output, model),
  getCostModel: (model: string) => mockGetCostModel(model),
}));

describe("metrics ingest route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockValidateApiKey.mockReturnValue(true);
    mockInsert.mockReturnValue({
      values: mockValues,
    });
    mockValues.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/ingest/metrics", () => {
    it("uses model from request body for cost calculation when provided", async () => {
      // GPT-4o: $2.5/M input, $10/M output
      mockGetCostModel.mockReturnValue({
        name: "GPT-4o",
        provider: "openrouter",
        inputCostPerToken: 2.5 / 1_000_000,
        outputCostPerToken: 10.0 / 1_000_000,
      });
      mockComputeTokenCost.mockReturnValue(0.015); // 1000 * 2.5/1M + 1000 * 10/1M = 0.0125

      const { POST } = await import("../route");
      
      const request = new NextRequest("http://localhost/api/ingest/metrics", {
        method: "POST",
        body: JSON.stringify({
          inputTokens: 1000,
          outputTokens: 1000,
          model: "openai/gpt-4o",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      // Verify computeTokenCost was called with the model from request
      expect(mockComputeTokenCost).toHaveBeenCalledWith(1000, 1000, "openai/gpt-4o");
    });

    it("falls back to LLM_MODEL env or default when model not provided", async () => {
      vi.stubEnv("LLM_MODEL", "minimax/MiniMax-M2.7");
      vi.stubEnv("LLM_INPUT_COST", undefined);
      vi.stubEnv("LLM_OUTPUT_COST", undefined);
      
      mockComputeTokenCost.mockReturnValue(0.0015); // Default MiniMax M2.7 cost

      const { POST } = await import("../route");
      
      const request = new NextRequest("http://localhost/api/ingest/metrics", {
        method: "POST",
        body: JSON.stringify({
          inputTokens: 1000,
          outputTokens: 1000,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      // Verify computeTokenCost was called without model (falls back to default)
      expect(mockComputeTokenCost).toHaveBeenCalledWith(1000, 1000, undefined);
    });

    it("uses costUsd directly when provided in body (no auto-calculation)", async () => {
      const { POST } = await import("../route");
      
      const providedCost = 0.05;
      const request = new NextRequest("http://localhost/api/ingest/metrics", {
        method: "POST",
        body: JSON.stringify({
          inputTokens: 1000,
          outputTokens: 1000,
          costUsd: providedCost,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      // When costUsd is provided, computeTokenCost should NOT be called
      expect(mockComputeTokenCost).not.toHaveBeenCalled();
    });

    it("computes cost from env costs for unknown model when LLM_INPUT_COST set", async () => {
      vi.stubEnv("LLM_INPUT_COST", "0.0005");
      vi.stubEnv("LLM_OUTPUT_COST", "0.001");
      
      mockGetCostModel.mockReturnValue({
        name: "custom-unknown-model",
        provider: "custom",
        inputCostPerToken: 0.0005,
        outputCostPerToken: 0.001,
      });
      mockComputeTokenCost.mockReturnValue(1.5); // 1000 * 0.0005 + 1000 * 0.001

      const { POST } = await import("../route");
      
      const request = new NextRequest("http://localhost/api/ingest/metrics", {
        method: "POST",
        body: JSON.stringify({
          inputTokens: 1000,
          outputTokens: 1000,
          model: "unknown/custom-model",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockComputeTokenCost).toHaveBeenCalledWith(1000, 1000, "unknown/custom-model");
    });

    it("stores model in database when provided", async () => {
      mockComputeTokenCost.mockReturnValue(0.01);

      const { POST } = await import("../route");
      
      const request = new NextRequest("http://localhost/api/ingest/metrics", {
        method: "POST",
        body: JSON.stringify({
          inputTokens: 1000,
          outputTokens: 1000,
          model: "deepseek/deepseek-v3.2",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Verify values was called with the model
      expect(mockValues).toHaveBeenCalled();
      const callArgs = mockValues.mock.calls[0][0];
      expect(callArgs.model).toBe("deepseek/deepseek-v3.2");
    });
  });
});
