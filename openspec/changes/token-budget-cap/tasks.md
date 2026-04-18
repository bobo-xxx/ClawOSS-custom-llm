## 1. Environment Configuration

- [ ] 1.1 Add `BUDGET_CAP_USD` to `.env.example` with default value of `50.0`
- [ ] 1.2 Add `DAILY_BUDGET_USD` to `.env.example` as optional override (commented out)

## 2. Dashboard Budget API Endpoint

- [ ] 2.1 Create `dashboard/app/api/metrics/budget/route.ts` with GET handler
- [ ] 2.2 Implement budget calculation logic (query metricsTokens, compute percentages)
- [ ] 2.3 Handle edge cases: missing data, invalid cap values, database errors
- [ ] 2.4 Add proper TypeScript types for budget response

## 3. HEARTBEAT Budget Check Integration

- [ ] 3.1 Update `workspace/HEARTBEAT.md` step 0b to include budget check
- [ ] 3.2 Add curl call to `/api/metrics/budget` endpoint
- [ ] 3.3 Implement idle mode logic (skip steps 3-5 when budget exceeded)
- [ ] 3.4 Add `BUDGET_EXCEEDED` logging to dashboard
- [ ] 3.5 Handle API failure gracefully (fail-open with warning log)

## 4. Safety-Checker Budget Implementation

- [ ] 4.1 Update `workspace/skills/safety-checker/SKILL.md` Check 1 with implementation details
- [ ] 4.2 Add logic to read `memory/daily-cost.md`
- [ ] 4.3 Implement daily allocation calculation from `BUDGET_CAP_USD`
- [ ] 4.4 Add budget exceeded abort logic with proper result logging

## 5. Daily Cost File Management

- [ ] 5.1 Update `workspace/hooks/dashboard-reporter/handler.ts` to write daily cost file
- [ ] 5.2 Create `memory/daily-cost.md` write logic at end of agent run
- [ ] 5.3 Implement date checking and reset logic for new day
- [ ] 5.4 Use YAML frontmatter format for easy parsing

## 6. Dashboard UI Budget Indicator

- [ ] 6.1 Add budget indicator component to `dashboard/app/page.tsx`
- [ ] 6.2 Fetch budget data from `/api/metrics/budget` endpoint
- [ ] 6.3 Implement color-coded progress bar (green/yellow/red)
- [ ] 6.4 Add budget exceeded warning banner when `isOverBudget` is true

## 7. Testing and Verification

- [ ] 7.1 Verify budget endpoint returns correct values with test data
- [ ] 7.2 Verify HEARTBEAT correctly skips work when budget exceeded
- [ ] 7.3 Verify safety-checker aborts when daily budget exceeded
- [ ] 7.4 Verify daily cost file is written and reset correctly
- [ ] 7.5 Verify dashboard UI shows budget indicator correctly
