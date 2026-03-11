# PolyBash

Ready-made monorepo scaffold for building **PolyBash** with Codex.

This repository is not the finished product. It is the **build-ready starting point**:
- the full spec pack is already embedded
- the monorepo layout is already created
- Rust and TypeScript boundaries are already defined
- canonical fixtures/examples are already seeded
- CI, prompts, and launch instructions are already in place

The intended result is that you can drop this into GitHub, point Codex at it, and have it work from a repo that already knows what it is supposed to become.

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

## Overnight target

The target for the first serious Codex run is **M1: walking skeleton**, not the full long-term product.

M1 means:
- monorepo stays green
- contracts and schemas exist
- fixtures exist
- validator works
- export path works
- CLI works
- plugin shell works
- project round-trip works
- release gate and gap report exist

## What is already included

- `AGENTS.md` with repo rules and TDD expectations
- `MASTER_SPEC.md` as single-file source of truth
- `docs/` for PRD, architecture, WBS, quality gates, acceptance, and risk control
- `codex/` for orchestration, prompts, taskboard, and runbook
- `crates/` Rust workspace scaffold
- `plugin/` TypeScript Blockbench plugin scaffold
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
├─ README.md
├─ AGENTS.md
├─ MASTER_SPEC.md
├─ 00-START-HERE.md
├─ docs/
├─ codex/
├─ contracts/generated/
├─ crates/
├─ plugin/
├─ fixtures/
├─ examples/
├─ .github/workflows/ci.yml
├─ .vscode/mcp.json
├─ Cargo.toml
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ justfile
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

## First prompt to paste into Codex

Use the contents of `codex/prompts/00-LAUNCH-THIS-REPO.md`.

That file is written to force:
- TDD
- red / green / refactor
- narrow vertical slices
- heavy validation
- honest gap reporting
- zero architecture drift

## Notes for the agent

- The Rust side owns contracts, normalization, validation, export, and deterministic transforms.
- The TypeScript side owns plugin shell, host integration, controllers, and state.
- `.zxmodel` is the authoring source of truth.
- `.glb` is export output.
- Validation is a product feature, not a cleanup step.
- LLM features must compile into structured commands, not opaque edits.

## Current state of the code

This repo includes a **starter implementation skeleton** and fixture data.
Some parts are intentionally thin.
That is by design.

The goal is not to pretend the product is already built.
The goal is to remove repo-setup friction so Codex can spend its time on real implementation work.

## Suggested success criterion for the first Codex run

By the end of the first serious pass, you should have:
- canonical fixtures under test
- a validator report generated from the sample fighter
- a deterministic placeholder GLB export path
- CLI validate/export commands
- plugin controllers talking to a core facade
- CI reflecting the real commands Codex must keep green

## Do not do this

- do not turn this into a general DCC
- do not jump to sculpting or animation timeline work
- do not bypass the validator to claim export works
- do not add opaque text-to-mesh behavior
- do not expand to M2 before M1 is green
