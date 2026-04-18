## Why

ClawOSS hardcodes MiniMax M2.7 as the primary model and Kimi Code k2p5 as the fallback across config templates, telemetry hooks, and scripts. This makes it impossible to use any other LLM provider (OpenAI, Anthropic, Google, DeepSeek, etc.) without manually editing multiple files. OpenClaw already supports 40+ providers via a generic `provider/model` format — the limitation is entirely in the template layer.

## What Changes

- **BREAKING**: Remove `MINIMAX_API_KEY` and `KIMI_API_KEY` as required env vars; replace with generic `LLM_API_KEY` (and optional per-provider keys)
- Add `LLM_MODEL` env var to specify the primary model (e.g., `openai/gpt-4o`, `anthropic/claude-opus-4-6`, `custom/deepseek-v3`)
- Add `LLM_BASE_URL` env var for custom OpenAI-compatible API endpoints (optional — built-in providers don't need it)
- Add `LLM_API_TYPE` env var to select API protocol (`openai-completions` or `anthropic-messages`, default: `openai-completions`)
- Add `LLM_FALLBACK_MODEL` and `LLM_FALLBACK_API_KEY` env vars for optional fallback model
- Add `LLM_INPUT_COST` and `LLM_OUTPUT_COST` env vars (USD per million tokens) for cost tracking
- Add `LLM_CONTEXT_WINDOW` and `LLM_MAX_TOKENS` env vars for model metadata
- Update `config/openclaw.json` template to use `${LLM_MODEL}` placeholders instead of hardcoded `minimax/MiniMax-M2.7`
- Update `scripts/restart.sh` Python injection to generate provider config from `LLM_*` env vars instead of KIMI/MINIMAX-specific keys
- Update `workspace/hooks/dashboard-reporter/handler.ts` to read model name and cost from env instead of hardcoding `kimi-coding/k2p5`
- Update `workspace/hooks/dashboard-reporter/post-tool.sh` to read `$LLM_MODEL` instead of hardcoded model
- Update `scripts/dashboard-sync.sh` default model fallback from `kimi-coding/k2p5` to `$LLM_MODEL`
- Update `scripts/start.sh` `--model` flag from hardcoded to `$LLM_MODEL`

## Capabilities

### New Capabilities
- `llm-provider-config`: Generic LLM provider configuration via environment variables, supporting any OpenAI-compatible or Anthropic-compatible API

### Modified Capabilities

## Impact

- **config/openclaw.json**: Template structure changes — provider block generated dynamically
- **scripts/restart.sh**: Python injection logic rewritten to be model-agnostic
- **workspace/hooks/dashboard-reporter/**: handler.ts and post-tool.sh change model/cost source
- **scripts/dashboard-sync.sh**: Default model source changes
- **scripts/start.sh**: Model flag source changes
- **.env.example**: New env vars documented, old ones deprecated
- **Backward compatibility**: `MINIMAX_API_KEY` still works if `LLM_MODEL=minimax/MiniMax-M2.7` is set; migration is additive
