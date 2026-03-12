# Codex Overnight Runbook

## 1. Purpose

Use a 24-72 hour unattended run to move PolyBash toward a **real standalone retro asset creation product**, not just a buildable shell.

This runbook is the operator-facing companion to:
- `codex/prompts/09-24H-AUTONOMOUS-RUNLOOP.md`
- `codex/taskboard.yaml`
- `codex/GAP_REPORT.md`
- `docs/01-PRD.md`
- `docs/03-WBS-AND-MILESTONES.md`

## 2. Product boundary for the run

### PolyBash owns

- module browsing and style-pack/library workflows
- module import and metadata authoring
- connector visibility and snap UX
- high-level assembly and constrained shaping
- material zones, fills, decals, and limited material-slot preview
- validation, preview/apply, and export
- reusable character, prop, and later environment chunk workflows

### Blender owns

- custom source mesh creation
- UV unwrap/editing
- skinning
- animation
- heavier baking workflows

Do not let the unattended run drift into building a general-purpose mesh editor or UV tool.

## 3. Current success bar

By the end of the unattended run, the product should feel materially closer to:
- a usable character/prop workflow
- a visible and recoverable editing experience
- a believable Blender-to-PolyBash content pipeline

The run is not successful if it only produces more infrastructure while the UX still feels opaque.

## 4. Preflight checklist

Before starting the unattended run, verify:

- `corepack pnpm install` has completed
- `cargo run` launches the desktop app from the repo root
- current baseline is green:
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test --manifest-path desktop/src-tauri/Cargo.toml`
  - `cargo test --workspace`
  - `cargo fmt --check`
- `README.md` still explains the real launch path
- `codex/STATUS.md`, `codex/GAP_REPORT.md`, and `codex/ACCEPTANCE_SUMMARY.md` are readable and current

Do not start a long run from a dirty or ambiguous baseline.

## 5. Priority order

### Wave group A: immediate usability blockers

1. `T-20` visible undo/redo and action history UX
2. `T-21` viewport orientation and transform gizmos
3. `T-22` visible connector points and snap targets
4. `T-19` module preview/browser workflow

### Wave group B: real content pipeline

5. `T-24` Blender handoff and module import pipeline
6. `T-23` reusable module metadata authoring workflow
7. `T-25` reusable style-pack and module library workflow
8. `T-26` texture/material strategy with Blender-owned UV contract

### Wave group C: product hardening

9. broader preview/diff UI coverage
10. validation/export UX hardening
11. stronger acceptance and smoke coverage

Characters and props remain the first release focus.
Environment/world chunk work should not preempt the items above unless an explicit task depends on it.

## 6. Wave rules

For each wave:

1. choose 1 to 3 tasks with disjoint file ownership
2. assign each worker a narrow file scope
3. require failing tests first where practical
4. land the smallest slice that materially improves the product
5. validate that slice before opening the next risky wave
6. update handoff docs after meaningful changes

Keep waves small.
Do not run multiple workers on the same files.

## 7. Worker management

### Required roster

Every progress update should show:
- active workers
- owned files
- task ids
- current validation state
- next queued lanes

### Stall policy

If a worker does not emit a completion signal after two wait windows:
1. inspect the owned files directly
2. if files are unchanged, mark the lane stalled
3. relaunch the lane with a smaller scope
4. do not silently wait forever

### Integration policy

- prefer worker-owned implementation
- use the main thread for orchestration, validation, and small integration fixes only
- keep a clean boundary between lanes

## 8. Validation cadence

### Default desktop baseline

Run after each meaningful desktop wave:
- `corepack pnpm --dir desktop typecheck`
- `corepack pnpm --dir desktop test`
- `corepack pnpm --dir desktop build`
- `cargo test --manifest-path desktop/src-tauri/Cargo.toml`

### Major checkpoint baseline

Run after cross-cutting Rust or content-pipeline waves:
- `cargo test --workspace`
- `cargo fmt --check`

Do not postpone validation until the end of the run.

## 9. Commit and push policy

Use checkpoint commits, not one giant end-of-run dump.

Recommended cadence:
- one commit per validated wave or major product slice
- push after each validated checkpoint that materially improves the repo

Suggested checkpoint boundaries:
- undo/redo UX
- gizmos/orientation
- connector visibility
- module preview/browser
- Blender import pipeline
- module metadata authoring
- style-pack/library workflow
- material strategy boundary/docs

## 10. Documentation policy

After each meaningful wave, update the relevant docs:

- `codex/STATUS.md`
- `codex/GAP_REPORT.md`
- `codex/ACCEPTANCE_SUMMARY.md` when evidence changes
- `README.md` when user-facing behavior changes

Keep claims narrow and honest.
Do not describe generalized workflows when only one narrow slice is implemented.

## 11. Stop conditions

Stop the unattended run only when one of these is true:

- the current wave is validated, documented, and the next wave is clearly queued
- a hard blocker prevents safe progress
- the repo cannot be kept green without user intervention

Do not stop merely because one worker stalled; rescope and continue.

## 12. Morning review checklist

When the run ends, review:

- latest validated baseline commands
- latest pushed commit(s)
- current `codex/STATUS.md`
- current `codex/GAP_REPORT.md`
- whether `T-19` through `T-26` moved materially
- whether the product feels more usable, not just more complete on paper

## 13. Immediate next unattended target

If starting tonight, the first wave should be:

1. visible undo/redo and action-history UX
2. viewport orientation + transform gizmos
3. visible connector points/snap targets

That is the highest-value usability pass before deeper content-pipeline work.
