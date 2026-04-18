## ADDED Requirements

### Requirement: Dashboard displays configured model name

The dashboard SHALL read the configured LLM model from the `/api/config` endpoint and display it in all UI components that currently show hardcoded model names.

#### Scenario: Model displayed in system identity bar
- **WHEN** the dashboard loads the overview page
- **THEN** the system identity bar shows the actual configured model name instead of hardcoded "kimi-k2.5"

#### Scenario: Model displayed in pipeline bar
- **WHEN** the dashboard renders the pipeline telemetry bar
- **THEN** the model label shows the actual configured model name instead of hardcoded "kimi-k2.5"

#### Scenario: Model displayed in metric cards
- **WHEN** the dashboard renders the Cost/24h metric card
- **THEN** the subtitle shows the actual model name instead of hardcoded "kimi k2.5"

#### Scenario: Model displayed in gateway status
- **WHEN** the dashboard renders the gateway status panel
- **THEN** the Model row shows the actual configured model ID instead of hardcoded "kimi-coding/k2p5"

#### Scenario: Model displayed in header tooltip
- **WHEN** the user hovers over the "pii:off" badge in the header
- **THEN** the tooltip shows the actual provider name instead of hardcoded "Kimi Code direct API"

---

### Requirement: Config API endpoint provides model and pricing

The dashboard SHALL expose a `/api/config` endpoint that returns the current model configuration including name, provider, and pricing.

#### Scenario: Config endpoint returns model info
- **WHEN** a GET request is made to `/api/config`
- **THEN** the response contains `model` (model ID), `modelName` (friendly name), `provider`, `inputCostPerMillion`, and `outputCostPerMillion`

#### Scenario: Config endpoint uses env vars
- **WHEN** `LLM_MODEL` environment variable is set
- **THEN** the config endpoint returns that model ID in the `model` field

#### Scenario: Config endpoint falls back to default
- **WHEN** `LLM_MODEL` environment variable is not set
- **THEN** the config endpoint returns the default model "minimax/MiniMax-M2.7"

---

### Requirement: Cost computation uses env-var pricing

The cost computation functions SHALL use `LLM_INPUT_COST` and `LLM_OUTPUT_COST` environment variables when set, falling back to hardcoded cost models.

#### Scenario: Env var pricing used when set
- **WHEN** `LLM_INPUT_COST` and `LLM_OUTPUT_COST` environment variables are set
- **THEN** `computeTokenCost()` uses those values for cost calculation

#### Scenario: Known model pricing used when env vars not set
- **WHEN** `LLM_INPUT_COST` and `LLM_OUTPUT_COST` are not set but `LLM_MODEL` matches a known model
- **THEN** `computeTokenCost()` uses the pricing from `COST_MODELS` for that model

#### Scenario: Default pricing used when unknown model
- **WHEN** neither env vars nor known model match
- **THEN** `computeTokenCost()` uses `DEFAULT_COST_MODEL` pricing

---

### Requirement: Metrics ingestion uses actual pricing

The metrics ingestion API SHALL compute costs using the configured model pricing instead of hardcoded fallback.

#### Scenario: Cost computed from actual pricing
- **WHEN** a POST request is made to `/api/ingest/metrics` without a `costUsd` field
- **THEN** the cost is computed using `computeTokenCost()` with the actual configured model pricing

#### Scenario: Provided cost takes precedence
- **WHEN** a POST request is made to `/api/ingest/metrics` with a `costUsd` field
- **THEN** the provided cost is used instead of computing from pricing

---

### Requirement: Overview metrics use actual cost data

The overview API SHALL report actual costs from the database instead of hardcoded estimates.

#### Scenario: Cost from database used
- **WHEN** the `/api/metrics/overview` endpoint is called
- **THEN** `costToday` is computed from the `metrics_tokens` table's `cost_usd` column

#### Scenario: No hardcoded cost fallback
- **WHEN** no metrics data exists for today
- **THEN** the estimated cost is 0, not a hardcoded value based on assumed pricing

---

### Requirement: useModelConfig hook fetches and caches config

The dashboard SHALL provide a React hook `useModelConfig` that fetches model configuration from the API and caches the result.

#### Scenario: Hook returns model config
- **WHEN** a component calls `useModelConfig()`
- **THEN** the hook returns `{ model, modelName, provider, inputCostPerMillion, outputCostPerMillion, isLoading }`

#### Scenario: Hook caches config
- **WHEN** multiple components call `useModelConfig()` in the same render cycle
- **THEN** only one API request is made and the result is shared
