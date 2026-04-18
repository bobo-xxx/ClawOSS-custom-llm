## 1. Config API Endpoint

- [x] 1.1 Create `/api/config/model/route.ts` endpoint with GET handler returning model + provider + pricing fields
- [ ] 1.2 Add `revalidate = 60` export for 60-second cache
- [x] 1.3 Implement model name parsing: extract friendly name from model ID (last segment after `/`)
- [x] 1.4 Add fallback to `DEFAULT_MODEL` when `LLM_MODEL` env var not set

## 2. Cost Models Library

- [ ] 2.1 Add `getEffectiveCostModel(modelOverride?: string)` function to `cost-models.ts`
- [x] 2.2 Implement three-tier fallback: env vars → known models → default
- [x] 2.3 Update `computeTokenCost()` to use effective model pricing logic
- [ ] 2.4 Export `getEffectiveCostModel` for use by API routes

## 3. Model Config Hook

- [x] 3.1 Create `dashboard/lib/hooks/use-model-info.ts` with `useModelInfo()` hook
- [x] 3.2 Fetch from `/api/config/model` with SWR for caching
- [x] 3.3 Return model/provider/pricing + loading/error state
- [x] 3.4 Add TypeScript interface for config response

## 4. UI Components Update

- [x] 4.1 Update `metric-cards.tsx` line 140: replace hardcoded model label with runtime model info
- [x] 4.2 Update `gateway-status.tsx` line 103: replace hardcoded model with runtime model ID
- [x] 4.3 Update `page.tsx` line 129: replace hardcoded model with config-derived model
- [x] 4.4 Update `page.tsx` line 224: replace hardcoded model with config-derived model
- [x] 4.5 Update `header.tsx` line 38: replace hardcoded provider text with runtime provider info

## 5. API Routes Update

- [x] 5.1 Update `/api/ingest/metrics/route.ts`: remove "Kimi K2.5 pricing" comment on line 47
- [x] 5.2 Update `/api/metrics/overview/route.ts`: remove hardcoded cost estimate fallback
- [x] 5.3 Update `/api/metrics/overview/route.ts`: use actual `costToday` from database instead of estimated fallback

## 6. Testing

- [x] 6.1 Test config endpoint returns correct model when `LLM_MODEL` is set
- [x] 6.2 Test config endpoint returns default model when `LLM_MODEL` is not set
- [x] 6.3 Test cost computation with env var pricing
- [x] 6.4 Test cost computation fallback to known model
- [ ] 6.5 Test UI components display correct model name after hook integration
- [x] 6.6 Run `npm run build` to verify no TypeScript errors
- [ ] 6.7 Run `npm run lint` to verify no lint errors
