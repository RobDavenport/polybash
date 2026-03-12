# Prompt 09 - 24 Hour Autonomous Runloop

You are the **master orchestrator** for a long unattended PolyBash run.

This is a subagent-first execution mode.
Do not default to doing implementation work yourself.
Your job is to:
- split work into disjoint lanes
- dispatch workers
- validate after each landed wave
- relaunch stalled lanes
- keep the repo and handoff docs truthful

## Read first

1. `AGENTS.md`
2. `README.md`
3. `codex/STATUS.md`
4. `codex/ACCEPTANCE_SUMMARY.md`
5. `codex/GAP_REPORT.md`
6. `codex/taskboard.yaml`
7. `codex/STANDALONE_PIVOT.md`

## Mission

Use the unattended run to move PolyBash toward a **real usable standalone low-poly asset tool**.

Do not spend the run polishing infrastructure while core usability and content-pipeline gaps remain open.

## Product stance for this run

- PolyBash owns:
  - module browsing and kitbash assembly
  - connector authoring and visibility
  - region/material metadata
  - inspector and viewport editing UX
  - validation, preview/apply, and export
  - reusable module/style-pack workflows
- Blender remains the near-term source for:
  - mesh authoring
  - UV unwrap/editing
  - heavy texture baking

Do not turn the unattended run into “build a full UV editor.”

## Priority order for unattended work

### Wave priority A: usability blockers
- module preview/browser workflow
- visible undo/redo controls and history UX
- viewport orientation and transform gizmos
- visible connector points and snap targets

### Wave priority B: reusable content pipeline
- module authoring/import pipeline
- Blender-to-PolyBash handoff
- style-pack/module packaging workflow
- material/texture strategy that assumes UV work remains in Blender

### Wave priority C: broader product hardening
- broader preview/diff UI coverage
- richer validation-state UX
- stronger smoke/acceptance coverage
- docs and launch prompts that match the real product path

## Orchestration rules

- Keep a live wave roster in every update:
  - active workers
  - exact owned files
  - current goal
  - completed slices
  - next queued lanes
- Give each worker a disjoint write scope.
- Prefer small waves over massive parallel churn.
- Timebox workers.
- If a worker has no completion signal after two wait windows, inspect its owned files directly.
- If the files are unchanged or inconsistent, mark the lane stalled and relaunch it smaller.
- Never silently wait forever.
- Do not let multiple workers write the same file set at once.

## Validation cadence

After each landed wave:
1. run the narrow tests for that slice
2. run the relevant desktop frontend validations
3. run the relevant Rust validations
4. keep the baseline green before starting the next risky wave

Default baseline for desktop waves:
- `corepack pnpm --dir desktop typecheck`
- `corepack pnpm --dir desktop test`
- `corepack pnpm --dir desktop build`
- `cargo test --manifest-path desktop/src-tauri/Cargo.toml`

Run `cargo test --workspace` at major checkpoints, not after every tiny lane unless the slice crosses shared Rust boundaries.

## Documentation requirements

After each meaningful wave:
- update `codex/STATUS.md`
- update `codex/GAP_REPORT.md`
- update `codex/ACCEPTANCE_SUMMARY.md` when acceptance evidence changes
- keep `README.md` honest when user-facing behavior changes

Do not claim generalized UX when only a narrow slice has landed.

## Suggested unattended sequence

1. clear the current top usability blocker from priority A
2. validate
3. clear the next priority A blocker
4. validate
5. only then start priority B content-pipeline work
6. reserve the final pass for docs, validation, and honest handoff

## Summary format for each wave

- task ids completed or advanced
- workers used
- failing tests added first
- validation commands run
- results
- remaining gaps
- next queued lanes

Begin with the highest-value unblocked priority A lane from `codex/taskboard.yaml`.
