## Why

The dashboard hardcodes Kimi K2.5 and MiniMax M2.5/M2.7 model names, pricing, and provider labels in UI components, cost models, and API routes. When a user configures a different model (e.g., OpenAI GPT-4o, DeepSeek V3), the dashboard still shows "Kimi Code direct API" and computes costs using wrong pricing. The dashboard must reflect the actual runtime model.

## What Changes

- Update `dashboard/lib/cost-models.ts` to use `LLM_MODEL` env var as default model instead of hardcoded `minimax/MiniMax-M2.7`
- Add env-var-driven cost model: if `LLM_INPUT_COST` and `LLM_OUTPUT_COST` are set, register a dynamic cost model for the configured model
- Update `dashboard/app/api/ingest/metrics/route.ts` to use `computeTokenCost()` with the actual model name from the request, remove hardcoded "Kimi K2.5 pricing" fallback
- Update `dashboard/app/api/metrics/overview/route.ts` to remove hardcoded "$1.8/M tokens" Kimi estimate, use actual cost data from DB
- Update `dashboard/components/overview/metric-cards.tsx` to read model name from state API instead of hardcoded "kimi k2.5"
- Update `dashboard/components/live/gateway-status.tsx` to read model from state API instead of hardcoded "kimi-coding/k2p5"
- Update `dashboard/app/page.tsx` to read model from state API instead of hardcoded "kimi-k2.5"
- Update `dashboard/components/layout/header.tsx` to read model from state/config instead of hardcoded "Kimi Code direct API"
- Add budget display to dashboard (connects to budget-cap change)

## Capabilities

### New Capabilities
- `runtime-model-display`: Dashboard reads and displays the actual configured LLM model and pricing

### Modified Capabilities

## Impact

- **dashboard/lib/cost-models.ts**: Default model and cost resolution changes
- **dashboard/app/api/ingest/metrics/route.ts**: Cost computation logic changes
- **dashboard/app/api/metrics/overview/route.ts**: Cost estimate logic changes
- **dashboard/components/**: 4-5 UI components change model display source
- **Depends on**: `configurable-llm-model` change (for env vars) and `token-budget-cap` change (for budget display)
