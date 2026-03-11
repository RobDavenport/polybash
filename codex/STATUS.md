# Codex Status Ledger

Use this file to record:
- which prompt was run
- which task ids are done
- what evidence exists
- what remains blocked

This file should be updated by the agent after every meaningful pass.

## 2026-03-12 - Prompt 00 Launch Pass

- Prompt run: `codex/prompts/00-LAUNCH-THIS-REPO.md`
- M1 scaffold audit:
  - contracts: present with fixtures and generated schemas
  - core: domain, ops, validator, exporter, CLI present and testable
  - bridge: Rust WASM crate and TS loader/facade were stubbed
  - plugin: controller/state shell present with headless tests
  - qa: CI file exists, but acceptance harness/release gate tracking is still thin
- Task ids completed in this pass: `T-08`
- Acceptance criteria targeted:
  - bridge lane requirement from `codex/taskboard.yaml`
  - `docs/03-WBS-AND-MILESTONES.md` WP-08 done criteria
  - `docs/05-ACCEPTANCE-TEST-MATRIX.md` bridge coverage expectations
- Failing tests added first:
  - `crates/polybash-wasm/tests/bridge_parity.rs`
  - `plugin/src/tests/bridge.spec.ts`
- Implementation changes:
  - replaced the `polybash-wasm` placeholder with JSON validate/export bridge functions and wasm-bindgen wrappers
  - added structured bridge error payloads and base64 export bundle serialization
  - added `WasmCoreFacade` and improved `wasmLoader` to return concrete bindings
  - fixed an existing Rust lifetime compile issue in `crates/polybash-validate/src/lib.rs`
  - fixed plugin `tsconfig.json` so `typecheck` includes `vitest.config.ts` without `rootDir` failure
- Validation commands run:
  - `cargo test -p polybash-wasm`
  - `cargo test --workspace`
  - `cargo fmt --check`
  - `corepack pnpm --dir plugin test -- bridge.spec.ts`
  - `corepack pnpm --dir plugin typecheck`
  - `corepack pnpm --dir plugin test`
  - `corepack pnpm --dir plugin build`
- Results:
  - Rust bridge parity tests pass
  - full Rust workspace tests pass
  - plugin typecheck passes
  - full plugin test suite passes
  - plugin build passes
- Remaining M1 gaps and assumptions:
  - plugin bootstrap still uses test-time facades; no generated wasm package is wired into a real runtime entry yet
  - CLI integration tests expected by the acceptance matrix are still missing
  - acceptance harness/release gate summary is not yet fully populated
  - manual host smoke coverage is still pending by design
