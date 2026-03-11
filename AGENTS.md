# AGENTS.md

## Project identity

**Project codename:** PolyBash

PolyBash is a beginner-friendly retro 3D asset builder for game-ready meshes. It targets a workflow between Asset Forge and Blender: guided kitbashing, constrained shaping, palette/material assignment, basic painting, rig templates, clean GLB export, and a strict validator for Nethercore ZX-style constraints.

This repository exists to deliver an **end-to-end vertical slice first**, then expand to the broader v1 feature set described in the docs.

## Source of truth

When working in this repository, use these files in this order:

1. `MASTER_SPEC.md`
2. `docs/01-PRD.md`
3. `docs/02-TECHNICAL-ARCHITECTURE.md`
4. `docs/04-TDD-QUALITY-GATES.md`
5. `docs/05-ACCEPTANCE-TEST-MATRIX.md`
6. `codex/taskboard.yaml`

If there is a conflict:
- `MASTER_SPEC.md` wins over everything else.
- The PRD wins over implementation convenience.
- The acceptance matrix wins over undocumented assumptions.

## Hard engineering rules

1. **TDD is mandatory.**
   - Every feature starts with a failing test, failing fixture, or failing contract check.
   - Follow **Red → Green → Refactor** on every work item.
   - Do not write implementation-first code unless the work item is strictly mechanical and already covered by tests.

2. **Keep trunk green.**
   - No broken builds on the main branch.
   - No skipped tests unless explicitly allowed in the docs.
   - No TODO/FIXME comments without a linked task ID in `codex/taskboard.yaml`.

3. **Prefer the smallest vertical slice.**
   - If a full feature is too large, land the thinnest end-to-end slice that still satisfies the acceptance criteria.
   - Do not expand scope to “nice to have” work until the current acceptance criteria are green.

4. **Validation is a product feature.**
   - Do not bypass validators to make tests pass.
   - Validation errors must be explicit, typed, and tested.
   - Silent fallback behavior is prohibited unless documented and covered by tests.

5. **Determinism matters.**
   - Serialization, export, and validation outputs should be deterministic.
   - Snapshot and golden tests must be stable.
   - Avoid time-dependent or nondeterministic behavior in exported artifacts unless intentionally injected behind a seam.

6. **Preserve architectural boundaries.**
   - TypeScript plugin code handles UI, host integration, and orchestration.
   - Rust core handles contracts, domain rules, validation, export logic, and deterministic transforms.
   - Shared contracts must be versioned and test-covered.

7. **No hidden AI magic.**
   - LLM assistance must emit structured edit commands or structured suggestions.
   - No direct opaque text-to-mesh behavior.
   - Every generated edit must be previewable, reversible, and validated.

## Scope discipline

### Mandatory overnight target
The “overnight” target is **not** the whole long-term product. It is the first complete walking skeleton:

- monorepo scaffold
- Rust workspace with contracts, validation, export core, and CLI
- Blockbench plugin shell in TypeScript
- `.zxmodel` authoring format
- style pack loading
- module placement and snap/connect logic
- constrained deformation on authored regions
- material zone assignment
- rig template assignment (rig metadata only is acceptable in the first slice)
- GLB export
- validator report
- fixture-driven tests and CI

### Explicitly out of overnight scope unless all mandatory items are green
- rich freehand paint tools
- full animation timeline
- smooth skin painting UI
- marketplace/distribution
- multiplayer collaboration
- shader graph
- booleans/CSG modeling
- procedural node graphs
- direct online LLM integration

## Decision defaults

If a choice is unspecified, use these defaults:

- coordinate system: right-handed, Y-up
- units: meters
- authoring source format: `.zxmodel` JSON
- export format: `.glb`
- texture format: PNG
- plugin language: TypeScript
- plugin build: `pnpm` + `esbuild`
- core language: Rust stable
- schema generation: Rust source of truth with generated JSON Schema
- TS runtime contract validation: AJV against generated schemas
- Rust testing: `cargo test`, `proptest`, integration fixtures
- TS testing: `vitest`
- CI: GitHub Actions
- versioning: SemVer for schema and package versions

## How to behave during implementation

For each task:

1. Read the relevant spec section.
2. Write or update the failing test(s) first.
3. Implement the smallest passing change.
4. Refactor for clarity and boundary hygiene.
5. Run the narrow test set.
6. Run the relevant full suite.
7. Update docs, fixtures, and task status.
8. Record remaining risks honestly.

When blocked:
- reduce scope
- preserve the architecture
- keep the repository buildable
- leave a clear gap report rather than half-finished code

## Required output in task summaries

Every task summary should include:

1. what was implemented
2. what tests were added first
3. what validation commands were run
4. what remains incomplete
5. what assumptions were made

## Approval rules for LLM-related features

Any natural-language-driven operation must:
- compile into explicit structured commands
- run through the same validators as manual edits
- support preview before apply
- support undo after apply
- log its operations for debugging

## Repository navigation hints

- `docs/` contains product and engineering specs
- `codex/` contains orchestration material and prompts
- `examples/` contains canonical fixtures for development and tests

Do not invent alternate contracts when the examples or docs already define one.


## OpenAI and Codex documentation lookup

Always use the OpenAI developer documentation MCP server if you need to work with the OpenAI API, ChatGPT Apps SDK, Codex, or related docs without me having to explicitly ask.
