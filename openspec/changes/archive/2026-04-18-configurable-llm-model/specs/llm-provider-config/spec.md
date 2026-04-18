## ADDED Requirements

### Requirement: Environment-driven model configuration

The system SHALL derive all LLM model configuration from environment variables, not hardcoded values.

#### Scenario: Primary model configured via LLM_MODEL
- **WHEN** `LLM_MODEL=openai/gpt-4o` is set in environment
- **THEN** the agent uses `openai/gpt-4o` as the primary model

#### Scenario: Fallback model configured via LLM_FALLBACK_MODEL
- **WHEN** `LLM_FALLBACK_MODEL=anthropic/claude-3-opus` is set
- **THEN** the agent falls back to `anthropic/claude-3-opus` if primary fails

#### Scenario: Missing LLM_MODEL causes startup failure
- **WHEN** `LLM_MODEL` is not set and no legacy keys exist
- **THEN** the startup script exits with error message explaining required configuration

---

### Requirement: Provider name derivation from model string

The system SHALL extract the provider name from the `LLM_MODEL` value using the `provider/model` format.

#### Scenario: Built-in provider recognized
- **WHEN** `LLM_MODEL=openai/gpt-4o`
- **THEN** provider is recognized as `openai` (built-in, no custom baseUrl needed)

#### Scenario: Custom provider requires base URL
- **WHEN** `LLM_MODEL=custom/my-model` and `LLM_BASE_URL` is set
- **THEN** a custom provider configuration is generated with the specified base URL

#### Scenario: Custom provider without base URL fails
- **WHEN** `LLM_MODEL=unknown-provider/model` and provider is not built-in and `LLM_BASE_URL` is not set
- **THEN** the system logs a warning and OpenClaw attempts resolution (may fail at runtime)

---

### Requirement: API key configuration

The system SHALL support both unified and per-provider API key configuration.

#### Scenario: Unified API key via LLM_API_KEY
- **WHEN** `LLM_API_KEY=sk-xxx` is set
- **THEN** the key is used for the primary provider

#### Scenario: Fallback API key via LLM_FALLBACK_API_KEY
- **WHEN** `LLM_FALLBACK_MODEL=anthropic/claude-opus` and `LLM_FALLBACK_API_KEY=sk-yyy`
- **THEN** the fallback model uses its own API key

#### Scenario: Fallback uses primary key if not specified
- **WHEN** `LLM_FALLBACK_MODEL` is set but `LLM_FALLBACK_API_KEY` is not
- **THEN** the system uses `LLM_API_KEY` for the fallback

---

### Requirement: Custom API endpoint support

The system SHALL allow configuration of custom OpenAI-compatible or Anthropic-compatible endpoints.

#### Scenario: OpenAI-compatible endpoint
- **WHEN** `LLM_BASE_URL=https://api.custom.com/v1` and `LLM_API_TYPE=openai-completions`
- **THEN** requests are sent to the custom endpoint using OpenAI format

#### Scenario: Anthropic-compatible endpoint
- **WHEN** `LLM_BASE_URL=https://api.custom.com/v1` and `LLM_API_TYPE=anthropic-messages`
- **THEN** requests use Anthropic message format

#### Scenario: Default API type is OpenAI
- **WHEN** `LLM_API_TYPE` is not set
- **THEN** `openai-completions` is used as the default

---

### Requirement: Cost tracking configuration

The system SHALL support environment-configurable cost tracking for accurate dashboard reporting.

#### Scenario: Custom input cost
- **WHEN** `LLM_INPUT_COST=0.5` is set
- **THEN** the dashboard reporter calculates input costs at $0.50 per million tokens

#### Scenario: Custom output cost
- **WHEN** `LLM_OUTPUT_COST=2.0` is set
- **THEN** the dashboard reporter calculates output costs at $2.00 per million tokens

#### Scenario: Default costs when not specified
- **WHEN** `LLM_INPUT_COST` and `LLM_OUTPUT_COST` are not set
- **THEN** defaults of $0.60/M input and $3.00/M output are used

---

### Requirement: Model metadata configuration

The system SHALL support environment-configurable context window and max output tokens.

#### Scenario: Custom context window
- **WHEN** `LLM_CONTEXT_WINDOW=200000` is set
- **THEN** the model config includes `contextWindow: 200000`

#### Scenario: Custom max tokens
- **WHEN** `LLM_MAX_TOKENS=16384` is set
- **THEN** the model config includes `maxTokens: 16384`

#### Scenario: Default metadata values
- **WHEN** `LLM_CONTEXT_WINDOW` and `LLM_MAX_TOKENS` are not set
- **THEN** defaults of 128000 context window and 8192 max tokens are used

---

### Requirement: Backward compatibility with legacy keys

The system SHALL support existing `MINIMAX_API_KEY` and `KIMI_API_KEY` configurations without modification.

#### Scenario: MINIMAX_API_KEY auto-maps to LLM vars
- **WHEN** `MINIMAX_API_KEY=xxx` is set but `LLM_API_KEY` is not
- **THEN** `LLM_MODEL` defaults to `minimax/MiniMax-M2.7` and `LLM_API_KEY` is set to the MINIMAX key

#### Scenario: KIMI_API_KEY auto-maps to LLM vars
- **WHEN** `KIMI_API_KEY=yyy` is set but `LLM_API_KEY` and `MINIMAX_API_KEY` are not
- **THEN** `LLM_MODEL` defaults to `kimi-coding/k2p5` and `LLM_API_KEY` is set to the KIMI key

#### Scenario: LLM vars take precedence over legacy keys
- **WHEN** both `LLM_API_KEY` and `MINIMAX_API_KEY` are set
- **THEN** `LLM_API_KEY` is used, `MINIMAX_API_KEY` is ignored for model config

---

### Requirement: Config template placeholders

The system SHALL use `${VAR}` placeholder syntax in `config/openclaw.json` for all model-related values.

#### Scenario: Model placeholders in config
- **WHEN** `config/openclaw.json` contains `${LLM_MODEL}` in model fields
- **THEN** `restart.sh` Python logic substitutes the environment variable value

#### Scenario: Empty optional vars produce empty strings
- **WHEN** `LLM_BASE_URL` is not set
- **THEN** the resulting config has empty `baseUrl` field (OpenClaw ignores for built-in providers)

---

### Requirement: Dashboard reporter model awareness

The system SHALL pass the configured model name to the dashboard for accurate reporting.

#### Scenario: Model name in heartbeat
- **WHEN** `LLM_MODEL=openai/gpt-4o` is configured
- **THEN** dashboard heartbeat includes `model: "openai/gpt-4o"`

#### Scenario: Model name in metrics
- **WHEN** the agent reports token usage
- **THEN** metrics include the configured model name

#### Scenario: Default model when LLM_MODEL not set
- **WHEN** `LLM_MODEL` is not available in the hook's environment
- **THEN** `kimi-coding/k2p5` is used as fallback for dashboard display

---

### Requirement: Start script model flag

The system SHALL use the configured model in `scripts/start.sh` agent registration.

#### Scenario: Model from environment
- **WHEN** `scripts/start.sh` runs and `LLM_MODEL` is set
- **THEN** `openclaw agents add` uses `--model "$LLM_MODEL"`

#### Scenario: Fallback when not set
- **WHEN** `LLM_MODEL` is not set in start.sh environment
- **THEN** defaults to `kimi-coding/k2p5` for registration
