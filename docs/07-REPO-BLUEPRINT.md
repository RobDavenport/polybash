# Repository Blueprint

## 1. Purpose

This file defines the intended repository structure and implementation conventions so a coding agent does not spend cycles inventing them.

## 2. Monorepo conventions

- one Git repository
- Rust workspace under `crates/`
- TypeScript plugin under `plugin/`
- generated schemas under `contracts/generated/`
- fixtures under `fixtures/`
- canonical examples under `examples/`
- all major commands exposed through root scripts or a `justfile`

## 3. Proposed root files

```text
.
├─ AGENTS.md
├─ MASTER_SPEC.md
├─ 00-START-HERE.md
├─ Cargo.toml
├─ rust-toolchain.toml
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ justfile            # or Makefile
├─ .editorconfig
├─ .gitignore
├─ .github/workflows/ci.yml
├─ docs/
├─ codex/
├─ contracts/
├─ crates/
├─ plugin/
├─ fixtures/
└─ examples/
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
- wasm-bindgen interface to selected core functions

## 5. Suggested plugin layout

```text
plugin/
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ esbuild.config.mjs
├─ src/
│  ├─ index.ts
│  ├─ bridge/
│  │  ├─ coreFacade.ts
│  │  └─ wasmLoader.ts
│  ├─ adapters/
│  │  ├─ blockbenchHost.ts
│  │  └─ mockHost.ts
│  ├─ controllers/
│  │  ├─ projectController.ts
│  │  ├─ assemblyController.ts
│  │  ├─ deformationController.ts
│  │  ├─ materialController.ts
│  │  ├─ rigController.ts
│  │  └─ validationController.ts
│  ├─ state/
│  │  ├─ store.ts
│  │  ├─ selectors.ts
│  │  └─ actions.ts
│  ├─ ui/
│  │  ├─ panels/
│  │  ├─ dialogs/
│  │  └─ viewmodels/
│  └─ tests/
└─ dist/
```

## 6. Contract generation strategy

Recommended flow:
1. define contracts in Rust
2. derive JSON Schema
3. copy or generate schema files into `contracts/generated/`
4. consume schemas from TypeScript using AJV
5. add parity tests to ensure plugin expectations match Rust output

## 7. Style guide

### Rust
- small modules
- explicit error types
- avoid giant god structs
- favor pure functions in ops/validate layers
- document public APIs

### TypeScript
- controllers should be framework-light and testable
- host APIs must stay behind adapters
- UI should consume viewmodels, not raw domain mutation logic
- avoid plugin-wide mutable globals beyond a single state root

## 8. Commit and branch strategy

Recommended:
- one work package per branch/worktree
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
6. update docs/examples if contract changed

## 12. First release artifact set

The first release should include:
- plugin bundle
- CLI binary or instructions
- example style pack
- example fighter project
- example export bundle
- release notes summarizing gaps
