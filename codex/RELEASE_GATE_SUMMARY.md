# Release Gate Summary

## Target
M1 walking skeleton

## Decision
Conditional pass for the current implemented slices, not a full M1 pass yet.

## Evidence

- Rust tests:
  - `cargo test --workspace`
  - includes contract, domain, ops, validator, exporter, bridge, and CLI integration coverage
- TypeScript tests and checks:
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
- Fixture-backed command coverage:
  - `crates/polybash-cli/tests/cli_validate.rs`
  - `crates/polybash-cli/tests/cli_export.rs`
- Desktop workflow coverage:
  - `desktop/src/sceneProjection.spec.ts`
  - `desktop/src/historyState.spec.ts`
  - `desktop/src/documentInspector.spec.ts`
  - `desktop/src/desktopAcceptance.spec.ts`
  - `desktop/src/materialPreviewState.spec.ts`
- Desktop backend bridge coverage:
  - `desktop/src-tauri/src/lib.rs`
- Desktop invoke and shell coverage:
  - `desktop/src-tauri/src/main.rs`
  - `desktop/src/documentInspector.spec.ts`
- Deterministic preview and diff coverage:
  - `crates/polybash-domain/tests/command_apply.rs`
  - `crates/polybash-llm/tests/command_dsl.rs`
- Bridge parity coverage:
  - `crates/polybash-wasm/tests/bridge_parity.rs`
- Acceptance traceability:
  - `codex/ACCEPTANCE_SUMMARY.md`
- Clean-build hardening:
  - desktop frontend output is standardized to `desktop/dist`
  - desktop CI now builds the frontend before the Tauri Rust test lane in clean environments
  - clean desktop Rust tests still depend on prior frontend build artifacts because Tauri embeds them at compile time

## Open Issues

- AC-01 and AC-03 are only partially covered as end-to-end acceptance scenarios.
- AC-13 command DSL diff/undo acceptance coverage is still incomplete.
- AC-17 desktop validation-state coverage is thinner than the acceptance matrix expects.
- rotate-focused direct manipulation and richer snap UX are still not finished.
- the current snap UI is minimal and heuristic, rather than a fuller viewport-driven snapping workflow.
- the desktop preview/diff UI is currently narrow and only covers material assignment.
- AC-18 manual desktop smoke remains pending.

## Conclusion

The repository is buildable and materially closer to subagent-ready M1 execution than the initial scaffold:

- prompts are present
- bridge is no longer stubbed
- CLI is integration-tested
- desktop shell now has translate plus uniform-scale direct manipulation, bounded history helpers with current single-step undo UI, Rust-backed minimal paint/decal authoring, backend snap support, and a narrow material preview/apply/cancel flow
- deterministic preview/diff metadata exists through the desktop bridge and is wired through the desktop preview invoke surface plus the current material-preview UI slice
- desktop frontend validation is green at 6 Vitest files / 32 tests, including `desktop/src/materialPreviewState.spec.ts`
- CI matches the real desktop build gate and clean-build ordering

It is not honest to mark full M1 complete yet. The remaining work is concentrated and can be handed off as small acceptance-driven tasks.
