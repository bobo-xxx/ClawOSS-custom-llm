## Context

The ClawOSS dashboard displays model information and computes token costs using hardcoded values scattered across multiple files:

- `dashboard/lib/cost-models.ts`: Hardcoded `DEFAULT_MODEL = "minimax/MiniMax-M2.7"` with 8 static cost entries
- `dashboard/app/api/ingest/metrics/route.ts`: Comment says "Auto-compute cost using Kimi K2.5 pricing if not provided"
- `dashboard/app/api/metrics/overview/route.ts`: Hardcoded "$1.8/M tokens" fallback estimate
- `dashboard/components/overview/metric-cards.tsx`: Line 140 shows hardcoded "kimi k2.5"
- `dashboard/components/live/gateway-status.tsx`: Line 103 shows hardcoded "kimi-coding/k2p5"
- `dashboard/app/page.tsx`: Lines 129 and 224 show hardcoded "kimi-k2.5"
- `dashboard/components/layout/header.tsx`: Line 38 says "Using Kimi Code direct API"

**Problem**: When a user configures a different model via `LLM_MODEL` env var (from `configurable-llm-model` change), the dashboard still shows the old hardcoded model name and uses wrong pricing.

**Dependencies**:
- `configurable-llm-model`: Provides `LLM_MODEL`, `LLM_INPUT_COST`, `LLM_OUTPUT_COST` env vars
- `token-budget-cap`: May want to display budget info alongside model (not required for this change)

## Goals / Non-Goals

**Goals:**
1. Dashboard reads actual model from environment/config API instead of hardcoding
2. Cost computation uses env-var-driven pricing (`LLM_INPUT_COST`, `LLM_OUTPUT_COST`) when available
3. All UI components display the actual configured model name
4. Backward compatibility: if env vars not set, fall back to existing cost models

**Non-Goals:**
- Modifying the agent's model selection logic (handled by `configurable-llm-model`)
- Adding budget cap enforcement (handled by `token-budget-cap`)
- Creating a database table for model configuration (use env vars + settings table)
- Supporting per-request model switching (model is per-deployment)

## Decisions

### D1: Model Configuration Source

**Decision**: Use environment variables (`LLM_MODEL`, `LLM_INPUT_COST`, `LLM_OUTPUT_COST`) via server-side `/api/config` endpoint.

**Alternatives considered**:
1. **Direct env access in components**: Rejected — Next.js client components can't access server env vars directly; would require exposing via NEXT_PUBLIC_ prefix which leaks config to browser.
2. **Database settings table**: Rejected — adds complexity for data that rarely changes; env vars are the source of truth per `configurable-llm-model`.
3. **Hardcoded in config file**: Rejected — same problem as current state.

**Rationale**: Server-side API endpoint keeps env vars private while allowing client components to fetch config. Matches existing pattern of `/api/state` endpoint.

### D2: Cost Model Resolution Strategy

**Decision**: Three-tier fallback for cost computation:
1. If `LLM_INPUT_COST` and `LLM_OUTPUT_COST` env vars are set → use them
2. If `LLM_MODEL` matches a known model in `COST_MODELS` → use that entry
3. Otherwise → use `DEFAULT_COST_MODEL` (MiniMax M2.7 pricing)

**Code location**: Update `dashboard/lib/cost-models.ts`:
```typescript
export function getEffectiveCostModel(modelOverride?: string): CostModel {
  // Check env-var pricing first
  const inputCost = process.env.LLM_INPUT_COST;
  const outputCost = process.env.LLM_OUTPUT_COST;
  if (inputCost && outputCost) {
    return {
      name: modelOverride || process.env.LLM_MODEL || "Unknown",
      provider: "env-configured",
      inputCostPerToken: parseFloat(inputCost) / 1_000_000,
      outputCostPerToken: parseFloat(outputCost) / 1_000_000,
    };
  }
  // Fall back to known models
  const model = modelOverride || process.env.LLM_MODEL || DEFAULT_MODEL;
  return COST_MODELS[model] || DEFAULT_COST_MODEL;
}
```

**Rationale**: Env vars take precedence (user knows their pricing), then known models, then sensible default.

### D3: Config API Endpoint

**Decision**: Create `/api/config` endpoint returning:
```json
{
  "model": "minimax/MiniMax-M2.7",
  "modelName": "MiniMax M2.7",
  "provider": "minimax",
  "inputCostPerMillion": 0.30,
  "outputCostPerMillion": 1.20
}
```

**Rationale**: Single endpoint for all config; components fetch once and cache. Avoids multiple env reads. `modelName` and `provider` derived from `COST_MODELS` lookup or parsed from model ID.

### D4: Client-Side Model Display

**Decision**: Create `useModelConfig` hook that fetches `/api/config` and caches result.

**Components updated**:
- `metric-cards.tsx`: Line 140 — use `modelConfig.modelName` instead of "kimi k2.5"
- `gateway-status.tsx`: Line 103 — use `modelConfig.model` instead of "kimi-coding/k2p5"
- `page.tsx`: Lines 129, 224 — use `modelConfig.modelName` instead of "kimi-k2.5"
- `header.tsx`: Line 38 — use `modelConfig.provider` for tooltip text

### D5: API Route Cost Computation

**Decision**: Update API routes to use `getEffectiveCostModel()`:

1. **`/api/ingest/metrics/route.ts`**: 
   - Already calls `computeTokenCost(inputTokens, outputTokens, model)`
   - Update comment to remove "Kimi K2.5" reference
   - Ensure `computeTokenCost` uses `getEffectiveCostModel()` internally

2. **`/api/metrics/overview/route.ts`**:
   - Lines 111-114: Replace hardcoded "$1.8/M tokens" with actual cost data
   - Query `metrics_tokens` table for average cost per token instead of estimating

**Rationale**: Remove all hardcoded pricing; use actual data or configured values.

## Risks / Trade-offs

### R1: Env Var Not Set → Hardcoded Fallback Still Exists
**Risk**: If user doesn't set `LLM_MODEL`, dashboard still shows old default.
**Mitigation**: Document clearly; add warning log when falling back to default. This is acceptable — default works for the common case.

### R2: Client Hydration Mismatch
**Risk**: Server-side renders with one model, client fetches different config.
**Mitigation**: Config is deployment-level, not user-specific. All requests see same config. No hydration issue.

### R3: Cost Model Changes During Session
**Risk**: User changes env vars mid-session, cached config becomes stale.
**Mitigation**: Config is deployment-level; requires restart to change. This matches Next.js server behavior. Document that config changes require redeploy.

### R4: Unknown Model Has No Friendly Name
**Risk**: `LLM_MODEL=custom/xyz` has no entry in `COST_MODELS`, so `modelName` = "xyz" (model ID).
**Mitigation**: Acceptable — better to show actual model ID than wrong name. Could add `LLM_MODEL_NAME` env var for display override if needed.

### R5: API Backward Compatibility
**Risk**: Existing `/api/ingest/metrics` callers sending `model` field expect old cost lookup.
**Mitigation**: No change to API contract. `computeTokenCost` still accepts optional model parameter. If provided, it takes precedence over env default.

## Migration Plan

1. **Add `/api/config` endpoint** — No dependencies, can be deployed first
2. **Update `cost-models.ts`** — Add `getEffectiveCostModel()`, update `computeTokenCost`
3. **Create `useModelConfig` hook** — New file, no breaking changes
4. **Update UI components** — One at a time, each is independent
5. **Update API routes** — Remove hardcoded pricing comments/estimates
6. **Deploy** — All changes are additive; no migration needed

**Rollback**: Revert commits in reverse order. No data migration required.

## Open Questions

1. **Q**: Should `/api/config` require authentication?
   **A**: No — model config is not sensitive. Cost info is informational only. Keep public for simplicity.

2. **Q**: Should we cache the config endpoint?
   **A**: Yes — use `export const revalidate = 60` for 60-second cache. Config rarely changes.

3. **Q**: How to handle models not in `COST_MODELS`?
   **A**: Use `LLM_INPUT_COST`/`LLM_OUTPUT_COST` env vars for pricing. Display name derived from model ID (last segment after `/`).
