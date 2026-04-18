## 1. Config Template Updates

- [ ] 1.1 Replace hardcoded `minimax/MiniMax-M2.7` with `${LLM_MODEL}` in `config/openclaw.json` (5 locations: agents.defaults.model.primary, agents.defaults.model.fallbacks, agents.defaults.subagents.model, agents.list[0].model, agents.list[0].heartbeat.model)
- [ ] 1.2 Replace hardcoded `kimi-coding/k2p5` fallback with `${LLM_FALLBACK_MODEL}` in `config/openclaw.json`
- [ ] 1.3 Replace hardcoded `minimax` provider block with `${LLM_PROVIDER}` placeholder structure for custom providers
- [ ] 1.4 Add model metadata placeholders (`${LLM_CONTEXT_WINDOW}`, `${LLM_MAX_TOKENS}`) to models.providers config

## 2. Restart Script Python Logic

- [ ] 2.1 Add `LLM_*` environment variable extraction in `scripts/restart.sh` Python block
- [ ] 2.2 Implement provider name derivation from `LLM_MODEL` (split on `/`)
- [ ] 2.3 Implement backward compatibility mapping for `MINIMAX_API_KEY` and `KIMI_API_KEY`
- [ ] 2.4 Generate OpenClaw config with proper provider block based on `LLM_*` vars
- [ ] 2.5 Handle missing `LLM_BASE_URL` for built-in providers (omit or empty string)
- [ ] 2.6 Validate required vars and exit with clear error if `LLM_MODEL` missing

## 3. Dashboard Reporter Updates

- [ ] 3.1 Replace hardcoded `INPUT_COST_PER_TOKEN` with `process.env.LLM_INPUT_COST` fallback
- [ ] 3.2 Replace hardcoded `OUTPUT_COST_PER_TOKEN` with `process.env.LLM_OUTPUT_COST` fallback
- [ ] 3.3 Replace hardcoded model name `kimi-coding/k2p5` with `process.env.LLM_MODEL` fallback in `postState()`
- [ ] 3.4 Replace hardcoded model name in heartbeat metadata
- [ ] 3.5 Replace hardcoded model name in metrics payload

## 4. Start Script Updates

- [ ] 4.1 Replace hardcoded `--model "kimi-coding/k2p5"` with `--model "${LLM_MODEL:-kimi-coding/k2p5}"` in `scripts/start.sh`

## 5. Dashboard Sync Script Updates

- [ ] 5.1 Find and replace hardcoded model fallback references in `scripts/dashboard-sync.sh`

## 6. Post-tool Script Updates

- [ ] 6.1 Find and update any model references in `workspace/hooks/dashboard-reporter/post-tool.sh`

## 7. Environment Documentation

- [ ] 7.1 Add all `LLM_*` variables to `.env.example` with descriptions and examples
- [ ] 7.2 Document backward compatibility behavior (MINIMAX_API_KEY / KIMI_API_KEY auto-mapping)
- [ ] 7.3 Add migration note deprecating legacy API key variables

## 8. Testing & Verification

- [ ] 8.1 Test with `LLM_MODEL=openai/gpt-4o` and valid OpenAI API key
- [ ] 8.2 Test with `LLM_MODEL=anthropic/claude-opus-4-6` and valid Anthropic API key
- [ ] 8.3 Test backward compatibility with only `MINIMAX_API_KEY` set
- [ ] 8.4 Test backward compatibility with only `KIMI_API_KEY` set
- [ ] 8.5 Test custom provider with `LLM_BASE_URL` pointing to OpenAI-compatible endpoint
- [ ] 8.6 Verify dashboard shows correct model name and cost calculations
- [ ] 8.7 Verify agent starts successfully and can spawn subagents with configured model
