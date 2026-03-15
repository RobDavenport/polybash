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
- `docs/` for PRD, architecture, WBS, quality gates, acceptance, risk control, and the current Blender handoff contract
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

For the current reusable-module import boundary, see docs/09-BLENDER-HANDOFF-CONTRACT.md.


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
3. Drag the selected module itself to move it on the authoring plane, or grab the visible red, amber, and blue guides to translate, scale, or rotate it without hidden modifier keys. The viewport now also shows a world-orientation widget, transform guides, connector markers, and snap-guide lines for the selected module.
4. Use the module browser to inspect a style-pack part before placement, then use `Edit Metadata` in the preview card to draft reusable connector, region, and material-zone metadata for that module. Use `Import Module Contract` to bring in a Blender handoff file (`.moduleimport.json` or `.module.json`), inspect its source-asset path in the browser preview, isolate style-pack, imported, session-authored, or currently in-use reusable modules with the browser filter chips, search the reusable library by module id, source, connector or material metadata, source-asset path, or usage, inspect live suggested placement targets in the preview before adding a module, use the explicit `Add Without Snapping` fallback when you want a manual placement instead, use the recommended `Add and Snap` CTA for the top-ranked target, read the alternative-target summary when more than one live option exists, or use any grouped alternative `Add and Snap` action to place against a suggested live target in one step, duplicate a reusable module into a deterministic or custom-named authored copy, rename or delete authored copies in place, and use `Save Style Pack As` when you want to persist imported or authored reusable content. Use the inspector to change transforms, material assignments, region sliders, rig metadata, connector attachments, snap targets, paint fills, decals, and mirror/remove actions, and use the sidebar history panel to undo or redo recent edits.
5. Use `Validate` to run the Rust validator and `Export Preview` to confirm the GLB export path.

The fastest way to understand the current shell is to load the canonical fighter, select `weapon_01`, try a snap action, change a material, preview/apply that material change, then run validation and export.

## Implemented desktop features

- native open/save dialogs
- canonical load plus explicit path-based load
- live proxy viewport rendering with module selection
- pointer-driven viewport translate plus guide-driven translate, uniform scale, and rotate interactions for the selected module
- visible world-orientation widget plus translate, scale, and rotate guide overlays for the selected module
- visible connector markers and snap-guide lines for the selected module in the viewport
- selection-first module browser with dedicated preview, connector metadata, scene-aware suggested placement targets, an explicit `Add Without Snapping` manual fallback, a recommended add-and-snap CTA plus an alternative-target summary, connector-grouped alternative add-and-snap actions for the remaining suggested target list, and explicit selected-instance feedback in the preview when that reusable module is selected in the scene, including repeated-placement counts when more than one instance is placed, region/material summaries, source-aware plus in-use filters, reusable-library metadata search, placed-instance preview badges, imported source-asset metadata, explicit add-from-preview placement, deterministic-or-named duplicate-as-authored, rename-authored-copy, and delete-authored-copy browser actions, and a surfaced reusable-module metadata draft editor
- command-backed transform edits from the inspector
- visible undo, redo, and recent action history on top of the bounded history model
- mirrored module creation from the inspector with symmetry-aware counterpart naming
- connector attach and detach from the inspector
- canonical imported-module contract support through the desktop bridge for `.moduleimport.json` and descriptor-style import fixtures
- command-backed region and material edits
- minimal desktop-native fill and decal authoring from the inspector through Rust-backed Tauri commands
- a narrow preview/apply/cancel UI in the inspector backed by the existing preview bridge for material, transform, region, rig-template, connector, and socket edits
- Blender handoff import through explicit `.moduleimport.json` or `.module.json` contracts backed by validated `.glb` source-asset paths
- style-pack save-as and reload support for imported or authored reusable modules
- rig template selection and socket metadata edits
- deterministic preview/diff metadata for structured edit commands through the Tauri bridge, including the registered desktop preview invoke and current material-preview UI slice
- Rust-owned validation and export preview through the Tauri bridge

## Current limitations

- preview/apply UI is still narrow and currently covers material, transform, region, rig-template, connector, and socket edits rather than every structured edit family
- transform interaction now uses visible selected-module guides instead of hidden modifier keys, but it is still a narrow single-selection gizmo slice rather than a fuller multi-axis tool palette
- snap UX is still minimal and inspector-driven even though connector markers and snap-guide lines are now visible in the viewport
- paint support is still limited to the walking-skeleton fill/decal path, not richer freehand tooling
- Blender handoff import and style-pack save/reload now exist, and the current contract explicitly requires a referenced `.glb` plus declared material zones; PolyBash validates that metadata seam while deeper mesh, pivot, and UV inspection still remain outside the current pipeline
- the browser preview is still deterministic metadata plus abstract silhouette bars, not richer rendered thumbnails yet
- the legacy `plugin/` path still exists in the repo as historical scaffolding, but it is not the product path
- manual desktop smoke and broader end-to-end workflow coverage are still thinner than the eventual product target

Clean-build note:
- the desktop frontend now builds to `desktop/dist`
- the Tauri config points at that output directly
- CI runs the desktop `typecheck`, `test`, and `build` steps before the Tauri Rust test lane so clean builds stay reproducible
- clean `cargo test --manifest-path desktop/src-tauri/Cargo.toml` still expects the frontend build artifacts to exist first because Tauri embeds them at compile time

Current desktop frontend evidence includes:
- `corepack pnpm --dir desktop test`
- 9 Vitest files / 83 tests, including `desktop/src/moduleDraft.spec.ts`, `desktop/src/moduleDraftForm.spec.ts`, and `desktop/src/viewportController.spec.ts`

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









