# Repository Blueprint

## 1. Purpose

This file defines the intended repository structure and implementation conventions so a coding agent does not spend cycles inventing them.

## 2. Monorepo conventions

- one Git repository
- Rust workspace under `crates/`
- TypeScript desktop shell under `desktop/`
- Tauri backend under `desktop/src-tauri/`
- generated schemas under `contracts/generated/`
- fixtures under `fixtures/`
- canonical examples under `examples/`
- all major commands exposed through root scripts or a `justfile`
- `plugin/` may remain as legacy scaffolding, but it is not the primary product path

## 3. Proposed root files

```text
.
|- AGENTS.md
|- MASTER_SPEC.md
|- 00-START-HERE.md
|- Cargo.toml
|- rust-toolchain.toml
|- package.json
|- pnpm-workspace.yaml
|- tsconfig.base.json
|- justfile            # or Makefile
|- .editorconfig
|- .gitignore
|- .github/workflows/ci.yml
|- docs/
|- codex/
|- contracts/
|- crates/
|- desktop/
|- plugin/             # legacy scaffold, not the active delivery surface
|- fixtures/
`- examples/
```

## 4. Suggested crate breakdown

### `polybash-contracts`
- pure types
- serde
- schema generation
- report types
- no business logic beyond basic validation helpers

### `polybash-domain`
- project aggregate
- command application
- normalization
- invariant enforcement

### `polybash-ops`
- transforms
- connector matching
- region deformation helpers
- metrics utilities

### `polybash-validate`
- validation pipeline
- typed messages
- budget and metadata checks

### `polybash-export`
- normalized scene to GLB
- export bundle
- deterministic artifact generation

### `polybash-llm`
- command DSL
- preview/apply helpers
- validation for generated commands

### `polybash-cli`
- command line entry points

### `polybash-wasm`
- optional wasm-bindgen interface to selected core functions

## 5. Suggested desktop layout

```text
desktop/
|- package.json
|- tsconfig.json
|- vite.config.ts
|- index.html
|- src/
|  |- main.ts
|  |- documentPaths.ts
|  |- documentInspector.ts
|  |- sceneProjection.ts
|  |- viewportController.ts
|  |- styles.css
|  |- types.ts
|  `- *.spec.ts
`- src-tauri/
   |- Cargo.toml
   |- tauri.conf.json
   |- capabilities/
   `- src/
      |- main.rs
      `- lib.rs
```

## 6. Contract generation strategy

Recommended flow:
1. define contracts in Rust
2. derive JSON Schema
3. copy or generate schema files into `contracts/generated/`
4. consume schemas from TypeScript using AJV or equivalent runtime validation
5. add parity tests to ensure desktop expectations match Rust output

## 7. Style guide

### Rust
- small modules
- explicit error types
- avoid giant god structs
- favor pure functions in ops/validate layers
- document public APIs

### TypeScript
- workflow modules should be framework-light and testable
- native and Tauri APIs must stay behind adapters or narrow command wrappers
- UI should consume projections and typed workflow state, not raw domain mutation logic
- avoid desktop-wide mutable globals beyond a single state root

## 8. Commit and branch strategy

Recommended:
- one work package per branch or worktree
- keep changesets cohesive
- merge contracts before dependent work
- do not stack unrelated risky changes in one agent task

## 9. Naming conventions

### Files
- kebab-case for markdown/docs
- snake_case or standard Rust crate/module conventions in Rust
- camelCase for TS modules if aligned with repo style

### IDs
- stable string ids for modules, style packs, rigs, palettes, sockets

Examples:
- `fighter_torso_base_a`
- `zx_fighter_v1`
- `biped_fighter_v1`
- `weapon_r`

## 10. Example top-level commands

A root `justfile` or script aliases should expose:

```text
just setup
just build
just test
just lint
just coverage
just validate-examples
just export-example
```

Suggested intent:
- reduce command discovery cost
- improve consistency across agent tasks
- make CI mirrors obvious

## 11. Example development flow

1. add or update fixture
2. add failing Rust or TS test
3. implement minimal change
4. run targeted test
5. run broader suite
6. update docs or examples if contract changed

## 12. First release artifact set

The first release should include:
- desktop bundle or runnable desktop build instructions
- CLI binary or instructions
- example style pack
- example fighter project
- example export bundle
- release notes summarizing gaps
