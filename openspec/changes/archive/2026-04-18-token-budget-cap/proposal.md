## Why

ClawOSS has no budget enforcement. The agent will spend unlimited tokens and money until manually stopped. The `safety-checker` skill mentions a budget check stub but it's completely unimplemented. Without a cap, a misconfiguration or runaway agent can incur significant costs with no automatic stop.

## What Changes

- Add `BUDGET_CAP_USD` env var to set a total spending limit (e.g., `50.0` for $50)
- Add budget check to HEARTBEAT.md step 0b circuit breaker: query dashboard API for cumulative spend, compare to cap
- Add `/api/metrics/budget` dashboard endpoint returning `{ cap, spent, remaining, percentUsed, isOverBudget }`
- Implement the safety-checker budget check stub: read today's cost from dashboard or memory, compare to daily allocation
- When budget exceeded: agent enters idle mode (stops spawning sub-agents, skips work discovery, logs budget-exceeded state)
- Add `memory/daily-cost.md` file for the agent to track daily spend locally (as referenced by safety-checker skill)

## Capabilities

### New Capabilities
- `budget-cap`: Token spending limit with automatic idle mode when exceeded

### Modified Capabilities

## Impact

- **workspace/HEARTBEAT.md**: New budget check in circuit breaker step
- **workspace/skills/safety-checker/SKILL.md**: Implement existing budget check stub
- **workspace/hooks/dashboard-reporter/handler.ts**: No change needed (already tracks cost)
- **dashboard/app/api/metrics/budget/route.ts**: New file
- **dashboard/app/page.tsx**: Add budget indicator to UI
- **.env.example**: New `BUDGET_CAP_USD` var
- **workspace/memory/daily-cost.md**: New memory file
