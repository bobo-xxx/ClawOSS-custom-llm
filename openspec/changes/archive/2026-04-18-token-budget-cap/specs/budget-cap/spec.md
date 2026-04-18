## ADDED Requirements

### Requirement: Budget cap environment variable

The system SHALL recognize a `BUDGET_CAP_USD` environment variable that sets the maximum cumulative spending limit.

#### Scenario: Default budget cap when not configured
- **WHEN** `BUDGET_CAP_USD` environment variable is not set
- **THEN** the system SHALL use a default cap of $50.00 USD
- **AND** the system SHALL log a warning on first budget check

#### Scenario: Custom budget cap configured
- **WHEN** `BUDGET_CAP_USD` is set to a valid dollar amount (e.g., "100.0")
- **THEN** the system SHALL use that amount as the cumulative spending limit

#### Scenario: Invalid budget cap value
- **WHEN** `BUDGET_CAP_USD` is set to a non-numeric or negative value
- **THEN** the system SHALL fall back to the default $50.00 cap
- **AND** the system SHALL log an error with the invalid value

### Requirement: Budget status API endpoint

The system SHALL provide a `/api/metrics/budget` endpoint that returns current budget status.

#### Scenario: Successful budget status query
- **WHEN** a GET request is made to `/api/metrics/budget`
- **THEN** the response SHALL be JSON with fields: `cap`, `spent`, `remaining`, `percentUsed`, `isOverBudget`, `spentToday`
- **AND** `cap` SHALL equal the configured `BUDGET_CAP_USD`
- **AND** `spent` SHALL equal the cumulative cost from `metricsTokens` table
- **AND** `remaining` SHALL equal `cap - spent` (minimum 0)
- **AND** `percentUsed` SHALL equal `(spent / cap) * 100` (maximum 100)
- **AND** `isOverBudget` SHALL be `true` if `spent >= cap`, else `false`
- **AND** `spentToday` SHALL equal today's cost from `metricsTokens` table

#### Scenario: Budget endpoint handles missing data
- **WHEN** the `metricsTokens` table has no records
- **THEN** `spent` SHALL be 0
- **AND** `spentToday` SHALL be 0
- **AND** `isOverBudget` SHALL be `false`

### Requirement: Budget check in HEARTBEAT circuit breaker

The HEARTBEAT loop SHALL check budget status in step 0b and enter idle mode when exceeded.

#### Scenario: Budget under cap - normal operation
- **WHEN** cumulative spend is less than `BUDGET_CAP_USD`
- **THEN** the agent SHALL proceed with all HEARTBEAT steps normally

#### Scenario: Budget exceeded - enter idle mode
- **WHEN** cumulative spend is greater than or equal to `BUDGET_CAP_USD`
- **THEN** the agent SHALL skip steps 3-5 (discovery, triage, spawn)
- **AND** the agent SHALL still run steps 1-2, 6-7 (stall recovery, PR follow-ups, results, report)
- **AND** the agent SHALL log `BUDGET_EXCEEDED` status to dashboard
- **AND** the agent SHALL report budget status in heartbeat

#### Scenario: Budget check fails - graceful degradation
- **WHEN** the `/api/metrics/budget` endpoint is unreachable or returns an error
- **THEN** the agent SHALL log a warning
- **AND** the agent SHALL proceed with normal operation (fail-open)
- **AND** the agent SHALL retry budget check on next cycle

### Requirement: Safety-checker budget validation

The `safety-checker` skill SHALL validate budget before allowing new PR submissions.

#### Scenario: Daily budget check in safety-checker
- **WHEN** the safety-checker skill runs Check 1 (Budget Check)
- **THEN** it SHALL read `memory/daily-cost.md` for today's spend
- **AND** it SHALL compare to `DAILY_BUDGET_USD` env var if set
- **OR** it SHALL calculate daily allocation as `BUDGET_CAP_USD / 30` if only total cap is set
- **AND** if daily spend exceeds allocation, it SHALL abort submission with `BUDGET_EXCEEDED`

#### Scenario: Safety-checker with missing daily cost file
- **WHEN** `memory/daily-cost.md` does not exist
- **THEN** the safety-checker SHALL treat today's spend as $0
- **AND** the check SHALL pass (safe default)

#### Scenario: Safety-checker budget exceeded
- **WHEN** budget check fails due to exceeded daily allocation
- **THEN** the safety-checker SHALL abort submission
- **AND** it SHALL log `ABORTED: daily budget exceeded` to subagent result
- **AND** it SHALL NOT submit the PR

### Requirement: Daily cost tracking file

The system SHALL maintain `memory/daily-cost.md` for local cost tracking.

#### Scenario: Daily cost file creation
- **WHEN** the dashboard-reporter hook completes a run
- **THEN** it SHALL write or update `memory/daily-cost.md`
- **AND** the file SHALL contain: date, inputTokens, outputTokens, costUsd

#### Scenario: Daily cost file format
- **WHEN** reading `memory/daily-cost.md`
- **THEN** the file SHALL be parseable YAML or Markdown with frontmatter
- **AND** it SHALL include fields: `date`, `inputTokens`, `outputTokens`, `costUsd`
- **AND** the date SHALL be in YYYY-MM-DD format

#### Scenario: Daily cost reset on new day
- **WHEN** the date in `memory/daily-cost.md` differs from current date
- **THEN** the file SHALL be overwritten with new date and reset counters
- **AND** the new `costUsd` SHALL start at 0 for the new day

### Requirement: Dashboard UI budget indicator

The dashboard SHALL display budget status prominently on the main page.

#### Scenario: Budget indicator display
- **WHEN** the dashboard main page loads
- **THEN** it SHALL show a budget indicator with current spend and cap
- **AND** it SHALL use color coding: green (<70%), yellow (70-90%), red (>90%)
- **AND** it SHALL show percentage used

#### Scenario: Budget exceeded warning
- **WHEN** budget is exceeded (`isOverBudget` is true)
- **THEN** the dashboard SHALL show a prominent warning banner
- **AND** the banner SHALL display current spend vs cap
