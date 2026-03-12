# PolyBash

Ready-made monorepo scaffold for building **PolyBash** with Codex.

This repository is not the finished product. It is the build-ready starting point for a **standalone desktop low-poly modeling tool**:
- the full spec pack is embedded
- the monorepo layout is created
- Rust and TypeScript boundaries are defined
- canonical fixtures and examples are seeded
- CI, prompts, and launch instructions are in place

The intended result is that you can point Codex or a subagent at a repo that already knows what it is trying to become.

## What PolyBash is

PolyBash is a beginner-friendly retro 3D asset builder for game-ready meshes.

It sits between **Asset Forge** and **Blender**:
- guided kitbashing
- constrained shaping
- palette and material assignment
- basic paint-layer modeling
- rig metadata templates
- deterministic GLB export
- strict validation for Nethercore ZX-style constraints

## Active product direction

The active product direction is a **standalone Tauri desktop app**.

Current architecture:
- desktop shell under `desktop/`
- Tauri Rust backend under `desktop/src-tauri/`
- Rust core crates remain the source of truth for contracts, domain rules, validation, and export
- TypeScript and web UI drive the app shell, inspector workflows, and viewport orchestration

The old `plugin/` path still exists in the repository as legacy scaffolding, but it is no longer the primary destination for product work.

## Overnight target

The target for the first serious Codex run is **M1: walking skeleton**, not the full long-term product.

M1 means:
- monorepo stays green
- contracts and schemas exist
- fixtures exist
- validator works
- export path works
- CLI works
- desktop shell works
- project round-trip works
- release gate and gap report exist

## What is already included

- `AGENTS.md` with repo rules and TDD expectations
- `MASTER_SPEC.md` as single-file source of truth
- `docs/` for PRD, architecture, WBS, quality gates, acceptance, and risk control
- `codex/` for orchestration, prompts, taskboard, and runbook
- `crates/` Rust workspace scaffold
- `desktop/` standalone desktop shell and Tauri backend
- `plugin/` legacy scaffold from the pre-standalone direction
- `contracts/generated/` starter schemas
- `fixtures/` valid and invalid fixture set
- `examples/` canonical example assets
- `.github/workflows/ci.yml`
- `.vscode/mcp.json` so editor agents can use the OpenAI docs MCP server
- `justfile` and root package scripts for consistent task entry points

## Read this first

Codex should read files in this order:

1. `AGENTS.md`
2. `MASTER_SPEC.md`
3. `docs/04-TDD-QUALITY-GATES.md`
4. `docs/05-ACCEPTANCE-TEST-MATRIX.md`
5. `codex/taskboard.yaml`

## Recommended Codex launch order

1. Push this folder to a GitHub repository.
2. Open Codex against that repo.
3. Start with `codex/prompts/00-LAUNCH-THIS-REPO.md`.
4. Then execute prompts in numerical order under `codex/prompts/`.
5. Keep each work package small and acceptance-driven.
6. Do not let Codex expand scope beyond M1 unless M1 is green.

## Repo layout

```text
.
|- README.md
|- AGENTS.md
|- MASTER_SPEC.md
|- 00-START-HERE.md
|- docs/
|- codex/
|- contracts/generated/
|- crates/
|- desktop/
|- plugin/
|- fixtures/
|- examples/
|- .github/workflows/ci.yml
|- .vscode/mcp.json
|- Cargo.toml
|- package.json
|- pnpm-workspace.yaml
|- tsconfig.base.json
`- justfile
```

## Root commands

```bash
just setup
just build
just test
just validate-examples
just export-example
```

If you do not use `just`, the same intent exists in the root `package.json` and Cargo workspace commands.

## Desktop build and test commands

```bash
corepack pnpm --dir desktop typecheck
corepack pnpm --dir desktop test
corepack pnpm --dir desktop build
cargo build -p polybash-desktop
cargo test -p polybash-desktop
```

## Run the desktop app

Install the workspace dependencies first:

```bash
corepack pnpm install
```

Then launch the current desktop app from the repo root:

```bash
cargo run
```

That command now defaults to the standalone desktop app and builds the desktop frontend assets automatically when `desktop/dist` is missing or stale.

If you want the explicit package form, this is equivalent:

```bash
cargo run -p polybash-desktop
```

If you already have the Tauri CLI installed and want a live dev loop instead of a one-shot build:

```bash
cd desktop
cargo tauri dev
```

## Try the app

Once the desktop window opens:

1. Click `Load Canonical Fighter` to load the seeded fighter fixture, or `New Fighter` to generate a fresh template from the current style pack.
2. Click a module chip in the viewport strip, such as `torso_01` or `weapon_01`, to inspect it.
3. Drag in the viewport to move the selected module. Hold `Shift` while dragging to scale uniformly, or hold `Alt` while dragging to rotate around Z.
4. Use the inspector to change transforms, material assignments, region sliders, rig metadata, connector attachments, snap targets, paint fills, decals, and mirror/remove actions.
5. Use `Validate` to run the Rust validator and `Export Preview` to confirm the GLB export path.

The fastest way to understand the current shell is to load the canonical fighter, select `weapon_01`, try a snap action, change a material, preview/apply that material change, then run validation and export.

## Implemented desktop features

- native open/save dialogs
- canonical load plus explicit path-based load
- live proxy viewport rendering with module selection
- pointer-driven viewport translate
- `Shift` + drag uniform viewport scaling with safe minimum clamping
- `Alt` + drag viewport rotation around Z
- style-pack-backed module add/remove
- command-backed transform edits from the inspector
- bounded history helpers with deep-cloned past/future snapshots and tested redo semantics; the current shell still exposes single-step undo for the latest successful document-changing action
- mirrored module creation from the inspector with symmetry-aware counterpart naming
- connector attach and detach from the inspector
- backend snap commands through the Tauri bridge plus a minimal inspector snap action with deterministic compatible-target suggestions
- command-backed region and material edits
- minimal desktop-native fill and decal authoring from the inspector through Rust-backed Tauri commands
- a narrow material-assignment preview/apply/cancel UI in the inspector backed by the existing preview bridge
- rig template selection and socket metadata edits
- deterministic preview/diff metadata for structured edit commands through the Tauri bridge, including the registered desktop preview invoke and current material-preview UI slice
- Rust-owned validation and export preview through the Tauri bridge

## Current limitations

- preview/apply UI is currently narrow and only covers material assignment
- the visible desktop history UX still centers on undo; redo exists in helper/model coverage, not as a surfaced shell control
- snap UX is still minimal and inspector-driven rather than a fuller viewport-first workflow
- paint support is still limited to the walking-skeleton fill/decal path, not richer freehand tooling
- the legacy `plugin/` path still exists in the repo as historical scaffolding, but it is not the product path
- manual desktop smoke and broader end-to-end workflow coverage are still thinner than the eventual product target

Clean-build note:
- the desktop frontend now builds to `desktop/dist`
- the Tauri config points at that output directly
- CI runs the desktop `typecheck`, `test`, and `build` steps before the Tauri Rust test lane so clean builds stay reproducible
- clean `cargo test --manifest-path desktop/src-tauri/Cargo.toml` still expects the frontend build artifacts to exist first because Tauri embeds them at compile time

Current desktop frontend evidence includes:
- `corepack pnpm --dir desktop test`
- 6 Vitest files / 32 tests, including `desktop/src/materialPreviewState.spec.ts`

## CLI commands

The headless command surface lives in `polybash-cli`.

```bash
cargo run -p polybash-cli -- validate \
  --project fixtures/projects/valid/fighter_basic.zxmodel.json \
  --stylepack fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json

cargo run -p polybash-cli -- export \
  --project fixtures/projects/valid/fighter_basic.zxmodel.json \
  --stylepack fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json \
  --out out/example
```

These flows are also covered by CLI integration tests under `crates/polybash-cli/tests/`.

## First prompt to paste into Codex

Use the contents of `codex/prompts/00-LAUNCH-THIS-REPO.md`.

That file is written to force:
- TDD
- red / green / refactor
- narrow vertical slices
- heavy validation
- honest gap reporting
- zero architecture drift

## Subagent handoff

For the next Codex or subagent pass, use this sequence:

1. read `codex/STATUS.md`
2. read `codex/ACCEPTANCE_SUMMARY.md`
3. read `codex/GAP_REPORT.md`
4. choose the smallest remaining task id from the gap report
5. inject the matching prompt from `codex/prompts/`

This keeps follow-up passes anchored to current repo reality instead of the original plugin scaffold assumptions.

## Notes for the agent

- Rust owns contracts, normalization, validation, export, and deterministic transforms.
- The TypeScript desktop shell owns the app chrome, native integration adapters, inspector workflows, and viewport orchestration.
- `.zxmodel` is the authoring source of truth.
- `.glb` is export output.
- Validation is a product feature, not a cleanup step.
- LLM features must compile into structured commands, not opaque edits.

## Current state of the code

This repo includes a real standalone desktop walking skeleton plus fixture data.
Some parts are intentionally thin.
That is by design.

The goal is not to pretend the product is already complete.
The goal is to remove repo-setup friction so Codex can spend its time on real implementation work.

## Suggested success criterion for the first Codex run

By the end of the first serious pass, you should have:
- canonical fixtures under test
- a validator report generated from the sample fighter
- a deterministic GLB export path
- CLI validate/export commands
- a desktop shell talking to the Rust bridge
- native desktop document flows and constrained inspector edits, including transforms, direct-manipulation translate, and uniform scale
- CI reflecting the real commands Codex must keep green

## Do not do this

- do not turn this into a general DCC
- do not jump to sculpting or animation timeline work
- do not bypass the validator to claim export works
- do not add opaque text-to-mesh behavior
- do not expand to M2 before M1 is green
