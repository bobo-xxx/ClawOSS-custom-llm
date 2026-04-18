## Context

ClawOSS is an autonomous OSS contributor that runs continuously, spawning sub-agents to fix bugs, submit PRs, and handle follow-ups. Currently, there is **no budget enforcement mechanism** — the agent will spend unlimited tokens and money until manually stopped.

### Current State
- **Token tracking exists**: `dashboard-reporter/handler.ts` accumulates input/output tokens and posts cost to `/api/ingest/metrics` at the end of each run
- **Cost calculation exists**: Dashboard's `/api/metrics/overview` already computes `costToday` from `metricsTokens` table
- **Circuit breaker exists**: `HEARTBEAT.md` step 0b checks `errors_this_hour >= 5` and pauses, but has no budget checks
- **Budget stub exists**: `safety-checker/SKILL.md` Check 1 mentions "Budget Check" but is unimplemented (lines 26-28)

### Stakeholders
- **Operator**: Needs cost control to prevent runaway spending
- **Agent**: Needs to know when to stop spawning new work
- **Dashboard**: Needs to display budget status for monitoring

## Goals / Non-Goals

**Goals:**
1. Add `BUDGET_CAP_USD` environment variable for total spending limit
2. Enforce budget check in HEARTBEAT step 0b before any work begins
3. Create `/api/metrics/budget` endpoint returning current budget status
4. Implement the safety-checker budget check stub
5. Enter idle mode (no new sub-agents) when budget exceeded
6. Create `memory/daily-cost.md` for local cost tracking

**Non-Goals:**
- Per-repo or per-task budget limits (future consideration)
- Budget reset scheduling (relies on manual env var update)
- Historical budget tracking beyond what dashboard already provides
- Automatic budget increase/decrease based on time of day

## Decisions

### 1. Budget Scope: Cumulative vs Daily

**Decision**: Use **cumulative** budget against `BUDGET_CAP_USD` env var, with daily tracking in `memory/daily-cost.md` for informational purposes.

**Rationale**: 
- Cumulative is simpler — one env var, one check
- Daily tracking in memory file enables safety-checker to see today's spend without network calls
- Dashboard already tracks all-time cumulative in `metricsTokens` table

**Alternatives considered**:
- Daily budget: Requires separate `DAILY_BUDGET_USD` var, more complex reset logic
- Per-task budget: Too granular, hard to predict costs per issue

### 2. Enforcement Point: HEARTBEAT Step 0b

**Decision**: Add budget check to existing HEARTBEAT step 0b (circuit breaker section) before any work begins.

**Rationale**:
- Step 0b already runs first-thing every cycle
- Existing pattern: check state, decide to proceed or pause
- Natural extension of error-based circuit breaker

**Implementation**:
```markdown
## 0b. Circuit breakers
Read wake-state.md. If:
- errors_this_hour >= 5: pause 2 minutes
- budget_exceeded: skip steps 3-5, go to step 6 (handle results) then step 7 (report)
```

### 3. Budget Check Method: Dashboard API Call

**Decision**: Query `/api/metrics/budget` endpoint from HEARTBEAT, rather than reading local files.

**Rationale**:
- Dashboard has authoritative cumulative cost in database
- Single source of truth avoids sync issues
- Local `memory/daily-cost.md` is for safety-checker use only (runs in sub-agent context without dashboard access)

**Alternatives considered**:
- Read from `metricsTokens` directly: Sub-agents don't have DB access
- File-based budget tracking: Sync complexity, not authoritative

### 4. Idle Mode Behavior

**Decision**: When budget exceeded, agent enters **idle mode**:
- Skip steps 3-5 (discovery, triage, spawn)
- Still run steps 1-2, 6-7 (stall recovery, PR follow-ups, results, report)
- Log `BUDGET_EXCEEDED` to dashboard with current spend

**Rationale**:
- Allows existing PRs to complete naturally (not kill in-progress work)
- Still reports status for operator visibility
- Easy to resume when budget reset

**Alternatives considered**:
- Full stop: Prevents handling of urgent PR feedback
- Kill all sub-agents: Wastes work already done

### 5. Safety-Checker Implementation

**Decision**: Safety-checker reads `memory/daily-cost.md` and compares to `DAILY_BUDGET_USD` (if set) or calculates daily allocation from `BUDGET_CAP_USD`.

**Rationale**:
- Sub-agents run in isolated context without dashboard API access
- File-based check works in all contexts
- Falls back gracefully if file doesn't exist

**Implementation**:
```markdown
### 1. Budget Check
Read memory/daily-cost.md for today's spend. If over budget:
- Log budget-exceeded state
- Abort submission
- Reply BUDGET_EXCEEDED
```

### 6. API Endpoint Design

**Decision**: Create `/api/metrics/budget` returning:
```json
{
  "cap": 50.0,
  "spent": 23.45,
  "remaining": 26.55,
  "percentUsed": 46.9,
  "isOverBudget": false,
  "spentToday": 3.21
}
```

**Rationale**:
- Single endpoint for all budget-related queries
- Returns both cumulative and daily spend
- `isOverBudget` flag for simple conditional checks

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Dashboard API unreachable during budget check | Graceful fallback: proceed with warning log, don't block cycle |
| Budget env var not set | Default to $50 cap, log warning on first check |
| Race condition: cost posted after budget check | Cost is accumulated per-run; budget checked at run start. Next cycle catches overshoot. |
| Daily cost file sync lag | Safety-checker treats missing file as $0 spend (safe default) |
| Sub-agent already spawned when budget exceeded | Let it complete; don't kill mid-flight work |
| Large PRs submitted just before budget cap | Accept as cost of continuous operation; budget catches on next cycle |

## Migration Plan

1. **Add `BUDGET_CAP_USD` to `.env.example`** with default $50
2. **Create `/api/metrics/budget` endpoint** in dashboard
3. **Update HEARTBEAT.md step 0b** with budget check logic
4. **Implement safety-checker budget check** reading `memory/daily-cost.md`
5. **Update `dashboard-reporter`** to write `memory/daily-cost.md` after each run
6. **Add budget indicator to dashboard UI** (optional, can be separate task)

**Rollback**: Set `BUDGET_CAP_USD` to a very high value (e.g., 999999) to effectively disable.

## Open Questions

None — design is complete and ready for implementation.
