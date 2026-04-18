## 1. Config API Endpoint

- [ ] 1.1 Create `/api/config/route.ts` endpoint with GET handler returning `{ model, modelName, provider, inputCostPerMillion, outputCostPerMillion }`
- [ ] 1.2 Add `revalidate = 60` export for 60-second cache
- [ ] 1.3 Implement model name parsing: extract friendly name from model ID (last segment after `/`)
- [ ] 1.4 Add fallback to `DEFAULT_MODEL` when `LLM_MODEL` env var not set

## 2. Cost Models Library

- [ ] 2.1 Add `getEffectiveCostModel(modelOverride?: string)` function to `cost-models.ts`
- [ ] 2.2 Implement three-tier fallback: env vars → known models → default
- [ ] 2.3 Update `computeTokenCost()` to use `getEffectiveCostModel()` internally
- [ ] 2.4 Export `getEffectiveCostModel` for use by API routes

## 3. Model Config Hook

- [ ] 3.1 Create `dashboard/lib/hooks/use-model-config.ts` with `useModelConfig()` hook
- [ ] 3.2 Fetch from `/api/config` with SWR or React Query for caching
- [ ] 3.3 Return `{ model, modelName, provider, inputCostPerMillion, outputCostPerMillion, isLoading, error }`
- [ ] 3.4 Add TypeScript interface for config response

## 4. UI Components Update

- [ ] 4.1 Update `metric-cards.tsx` line 140: replace hardcoded "kimi k2.5" with `modelConfig?.modelName`
- [ ] 4.2 Update `gateway-status.tsx` line 103: replace hardcoded "kimi-coding/k2p5" with `modelConfig?.model`
- [ ] 4.3 Update `page.tsx` line 129: replace hardcoded "kimi-k2.5" with model from config
- [ ] 4.4 Update `page.tsx` line 224: replace hardcoded "kimi-k2.5" with model from config
- [ ] 4.5 Update `header.tsx` line 38: replace "Kimi Code direct API" with `modelConfig?.provider` reference

## 5. API Routes Update

- [ ] 5.1 Update `/api/ingest/metrics/route.ts`: remove "Kimi K2.5 pricing" comment on line 47
- [ ] 5.2 Update `/api/metrics/overview/route.ts`: remove hardcoded "$1.8/M tokens" estimate on lines 111-114
- [ ] 5.3 Update `/api/metrics/overview/route.ts`: use actual `costToday` from database instead of estimated fallback

## 6. Testing

- [ ] 6.1 Test config endpoint returns correct model when `LLM_MODEL` is set
- [ ] 6.2 Test config endpoint returns default model when `LLM_MODEL` is not set
- [ ] 6.3 Test cost computation with env var pricing
- [ ] 6.4 Test cost computation fallback to known model
- [ ] 6.5 Test UI components display correct model name after hook integration
- [ ] 6.6 Run `npm run build` to verify no TypeScript errors
- [ ] 6.7 Run `npm run lint` to verify no lint errors
