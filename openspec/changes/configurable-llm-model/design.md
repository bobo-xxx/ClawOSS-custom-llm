## Context

ClawOSS currently hardcodes MiniMax M2.7 as the primary model and Kimi Code k2p5 as the fallback across multiple configuration layers. OpenClaw supports 40+ providers via `provider/model` format, but ClawOSS cannot leverage this flexibility without manual file editing.

**Current State:**
- `config/openclaw.json`: 5 hardcoded `minimax/MiniMax-M2.7` references + `kimi-coding/k2p5` fallback
- `workspace/hooks/dashboard-reporter/handler.ts`: Hardcoded cost rates ($0.60/M input, $3.00/M output) and model name
- `scripts/restart.sh`: Python injection specifically handles `KIMI_API_KEY` and `MINIMAX_API_KEY`
- `scripts/start.sh`: Hardcoded `--model "kimi-coding/k2p5"` flag
- `scripts/dashboard-sync.sh`: Default model fallback to `kimi-coding/k2p5`

**OpenClaw Config Structure:**
```json
{
  "agents": { "defaults": { "model": { "primary": "...", "fallbacks": [...] } } },
  "models": { "providers": { "<name>": { "baseUrl", "apiKey", "api", "models": [...] } } }
}
```

**OpenClaw Provider Modes:**
1. **Built-in providers** (openai, anthropic, google, etc.): Just need API key env var (e.g., `OPENAI_API_KEY`)
2. **Custom providers**: Need `baseUrl` + `apiKey` + `api` type in `models.providers` config

## Goals / Non-Goals

**Goals:**
- Make all model configuration driven by environment variables
- Support any OpenAI-compatible or Anthropic-compatible API endpoint
- Enable easy switching between providers without code changes
- Maintain backward compatibility with existing MINIMAX_API_KEY / KIMI_API_KEY setups

**Non-Goals:**
- Multi-provider load balancing (single primary + optional fallback only)
- Per-task model selection (agent-wide config only)
- Changing OpenClaw's provider format (use existing `provider/model` syntax)

## Decisions

### 1. Environment Variable Naming

**Decision:** Use `LLM_*` prefix for all model configuration.

**Rationale:** Clear namespace, easy to document, avoids collision with provider-specific vars.

**Variables:**
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_MODEL` | Yes | — | Primary model in `provider/model` format (e.g., `openai/gpt-4o`) |
| `LLM_API_KEY` | Yes* | — | API key for primary model |
| `LLM_BASE_URL` | Conditional | — | Custom API endpoint (required for custom providers) |
| `LLM_API_TYPE` | No | `openai-completions` | API protocol (`openai-completions` or `anthropic-messages`) |
| `LLM_FALLBACK_MODEL` | No | — | Fallback model in `provider/model` format |
| `LLM_FALLBACK_API_KEY` | Conditional | — | API key for fallback (required if fallback differs from primary) |
| `LLM_INPUT_COST` | No | `0.6` | Cost per million input tokens (USD) |
| `LLM_OUTPUT_COST` | No | `3.0` | Cost per million output tokens (USD) |
| `LLM_CONTEXT_WINDOW` | No | `128000` | Model context window size |
| `LLM_MAX_TOKENS` | No | `8192` | Max output tokens |

**Alternative considered:** Provider-specific env vars (e.g., `OPENAI_MODEL`, `ANTHROPIC_MODEL`). Rejected because it requires knowing the provider upfront, defeating the goal of generic configuration.

### 2. Provider Name Derivation

**Decision:** Extract provider name from `LLM_MODEL` format (`provider/model`).

**Rationale:** OpenClaw already uses this format. Built-in providers (openai, anthropic, etc.) are auto-recognized.

**Examples:**
- `LLM_MODEL=openai/gpt-4o` → provider: `openai` (built-in, no baseUrl needed)
- `LLM_MODEL=anthropic/claude-opus-4-6` → provider: `anthropic` (built-in)
- `LLM_MODEL=custom/my-model` → provider: `custom` (requires LLM_BASE_URL)

**Alternative considered:** Separate `LLM_PROVIDER` env var. Rejected as redundant — the provider is already encoded in the model string.

### 3. Config Template Strategy

**Decision:** Use placeholder tokens in `config/openclaw.json` that are replaced by `restart.sh`.

**Rationale:** Consistent with existing `__WORKSPACE_PATH__` pattern. Single source of truth.

**Implementation:**
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "${LLM_MODEL}",
        "fallbacks": ["${LLM_FALLBACK_MODEL}"]
      }
    }
  },
  "models": {
    "providers": {
      "${LLM_PROVIDER}": {
        "baseUrl": "${LLM_BASE_URL}",
        "apiKey": "${LLM_API_KEY}",
        "api": "${LLM_API_TYPE}",
        "models": [{ "id": "${LLM_MODEL_ID}", "contextWindow": ${LLM_CONTEXT_WINDOW}, "maxTokens": ${LLM_MAX_TOKENS} }]
      }
    }
  }
}
```

### 4. Dashboard Reporter Changes

**Decision:** Read cost and model from environment, with fallback defaults.

**Rationale:** Maintains backward compatibility while enabling accurate cost tracking for any provider.

**Implementation:**
```typescript
const INPUT_COST_PER_TOKEN = (parseFloat(process.env.LLM_INPUT_COST || "0.6")) / 1_000_000;
const OUTPUT_COST_PER_TOKEN = (parseFloat(process.env.LLM_OUTPUT_COST || "3.0")) / 1_000_000;
const LLM_MODEL = process.env.LLM_MODEL || "kimi-coding/k2p5";
```

### 5. Backward Compatibility

**Decision:** Support legacy `MINIMAX_API_KEY` / `KIMI_API_KEY` via automatic mapping.

**Rationale:** Existing deployments shouldn't break. Users can migrate incrementally.

**Implementation in restart.sh:**
```python
# If LLM_* not set but legacy keys exist, derive them
if not os.environ.get('LLM_API_KEY'):
    if os.environ.get('MINIMAX_API_KEY'):
        os.environ['LLM_MODEL'] = os.environ.get('LLM_MODEL', 'minimax/MiniMax-M2.7')
        os.environ['LLM_API_KEY'] = os.environ['MINIMAX_API_KEY']
    elif os.environ.get('KIMI_API_KEY'):
        os.environ['LLM_MODEL'] = os.environ.get('LLM_MODEL', 'kimi-coding/k2p5')
        os.environ['LLM_API_KEY'] = os.environ['KIMI_API_KEY']
```

**Alternative considered:** Require users to set `LLM_*` vars. Rejected as breaking change.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Missing LLM_MODEL breaks startup | Python script validates required vars, exits with clear error message |
| Invalid provider/model format | OpenClaw returns clear error on model resolution; agent logs show the issue |
| Cost tracking inaccurate for unknown providers | Defaults (0.6/3.0) are reasonable estimates; users can override |
| Breaking existing .env files | Legacy key detection ensures backward compatibility |
| Built-in provider detection fails | `LLM_BASE_URL` requirement for non-standard providers; documentation clarifies |

## Migration Plan

### Phase 1: Add new vars (non-breaking)
1. Update `config/openclaw.json` with `${LLM_*}` placeholders
2. Update `restart.sh` Python logic to inject `LLM_*` from legacy keys if not set
3. Update `handler.ts` to read from env with defaults
4. Update `start.sh` and `dashboard-sync.sh` to use `$LLM_MODEL`

### Phase 2: Update documentation
1. Add `LLM_*` vars to `.env.example` with comments
2. Update README with provider examples
3. Deprecate `MINIMAX_API_KEY` / `KIMI_API_KEY` in docs

### Phase 3: Remove legacy support (future)
1. After migration period, remove legacy key detection
2. Require `LLM_MODEL` and `LLM_API_KEY` as mandatory

### Rollback Strategy
If issues arise, revert to previous `config/openclaw.json` and `restart.sh`. Legacy key detection ensures existing setups continue working.
