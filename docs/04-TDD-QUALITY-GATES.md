# TDD, Validation, and Quality Gates

## 1. Engineering policy

This repository follows a strict quality model:

- **Red → Green → Refactor** is mandatory.
- Validation is part of the feature, not a post-pass.
- All critical paths must be headless-testable.
- No code path is “temporarily” exempt from correctness without a tracked task.

## 2. Required workflow for every task

1. choose one task from `codex/taskboard.yaml`
2. identify the relevant acceptance criteria
3. write or modify a failing test first
4. implement the minimum code to pass
5. refactor while keeping tests green
6. run narrow tests
7. run broader impacted suites
8. update fixtures and docs
9. record gaps honestly

## 3. Test pyramid

## 3.1 Contract tests
Purpose:
- ensure schema correctness
- ensure versioning behavior
- ensure invalid examples fail loudly

Examples:
- `.zxmodel` deserialize/serialize round-trip
- style pack schema validation
- report schema validation

## 3.2 Unit tests
Purpose:
- validate small deterministic units

Examples:
- connector compatibility
- transform math
- material budget calculations
- region clamp logic

## 3.3 Property tests
Purpose:
- catch edge cases that examples miss

Examples:
- transform composition/decomposition invariants
- parameter clamping invariants
- connector compatibility symmetry rules
- report aggregation invariants

## 3.4 Integration tests
Purpose:
- validate cross-module workflows

Examples:
- project load → validate → export
- plugin controller dispatch → WASM bridge → validation result
- CLI `validate` and `export` commands

## 3.5 Golden / snapshot tests
Purpose:
- lock down deterministic outputs

Examples:
- canonical validation report snapshots
- canonical normalized project snapshots
- canonical GLB export checksum or metadata snapshot

## 3.6 Acceptance tests
Purpose:
- prove the walking skeleton from the PRD

Examples:
- create fighter example
- place modules
- deform regions
- assign material zones
- apply rig template
- export GLB
- produce report

## 3.7 Manual smoke tests
Purpose:
- cover a thin layer of host integration not suitable for the first overnight pass

Examples:
- load plugin in Blockbench
- open example project
- run export button once

Manual smoke tests must be minimal and clearly isolated from automated correctness.

## 4. Coverage policy

### Rust core minimums
- `polybash-contracts`: 90% line coverage
- `polybash-domain`: 90% line coverage
- `polybash-ops`: 90% line coverage
- `polybash-validate`: 90% line coverage
- `polybash-export`: 85% line coverage
- `polybash-llm`: 85% line coverage
- `polybash-cli`: critical command paths covered by integration tests

### TypeScript plugin minimums
- controllers/state/bridge: 80% line coverage
- adapters: test at least success/failure seams
- UI rendering: smoke-level coverage acceptable if controller logic is fully tested

### Overall rule
All P0 acceptance paths must be covered by tests, even if line coverage is imperfect.

## 5. Mandatory quality gates

A change is not done until all applicable gates are green.

### Rust gates
- `cargo fmt --check`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `cargo test --workspace`
- coverage job on core crates

### TypeScript gates
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

### Repository gates
- no untracked schema drift
- examples updated if contracts changed
- docs updated if behavior changed

## 6. Recommended command surface

A top-level `justfile`, `Makefile`, or script aliases should provide:

- `test`
- `test-rust`
- `test-ts`
- `lint`
- `build`
- `coverage`
- `validate-examples`
- `export-example`

This is not just convenience. It lowers agent error rates.

## 7. Definition of done per change

A work item is done only when:
- tests were written first or updated first
- implementation passes
- refactor completed
- acceptance criteria traced
- docs/fixtures updated
- command outputs recorded in summary
- no hidden failing tests remain

## 8. Validation strategy details

## 8.1 Validation categories
- schema
- invariants
- compatibility
- budgets
- metadata completeness
- export readiness

## 8.2 Validation message contract
Each message must contain:
- `code`
- `severity`
- `path`
- `summary`
- `detail`
- `suggested_fix` (optional but preferred)

## 8.3 Validator behavior rules
- must never panic on bad user input
- must accumulate recoverable issues where sensible
- must stop export on fatal errors
- must distinguish warnings from errors

## 9. Determinism rules

- serialized JSON should use stable field ordering where practical in snapshots
- report ordering must be deterministic
- export metadata must be deterministic
- time stamps are excluded from snapshots or injected via seam

## 10. Fixture policy

Fixtures are first-class:
- every key feature gets at least one positive and one negative fixture
- fixtures live under `fixtures/`
- examples under `examples/` should mirror important fixtures
- when a bug is fixed, add a regression fixture if applicable

Suggested fixture folders:
- `fixtures/projects/valid`
- `fixtures/projects/invalid`
- `fixtures/stylepacks/valid`
- `fixtures/stylepacks/invalid`
- `fixtures/commands/valid`
- `fixtures/commands/invalid`

## 11. Release gate for the overnight target

The overnight target passes release gate only if:

1. all P0 tests are green
2. the fighter example exports to GLB
3. validator report is generated
4. project round-trip passes
5. the plugin bundle builds
6. CI is green
7. documented gaps do not include any critical path blocker

## 12. Anti-patterns prohibited

- implementation before failing tests
- skipped tests without task ids
- brittle assertions that mirror implementation internals rather than behavior
- “fixing” bugs by weakening tests
- hidden fallback behavior
- giant commits crossing unrelated work packages
- undocumented schema changes

## 13. Stretch hardening after M1

Only after M1 is green:
- fuzzing on import/deserialization
- mutation testing for validator logic
- heavier host integration smoke automation
- performance benchmarks on representative assets
