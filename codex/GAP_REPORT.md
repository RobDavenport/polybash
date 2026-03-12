# Gap Report

## Direction

- active product direction is the standalone Tauri desktop app under `desktop/`
- Rust core crates remain authoritative for contracts, domain rules, validation, and export
- the old plugin-oriented path still exists in the repo as legacy scaffolding, not the primary release path

## Completed

- `T-08` bridge slice
  - real Rust validate and export bridge
  - structured bridge errors
  - TS `WasmCoreFacade`
  - bridge parity tests
- `T-07` CLI hardening
  - `validate` integration tests
  - `export` integration tests
  - valid and invalid fixture coverage
- standalone desktop pivot slice
  - `desktop/` web shell
  - `desktop/src-tauri/` Rust backend
  - canonical load, validate, and export commands
  - fighter template creation from style pack
- standalone desktop authoring and document slices
  - native dialog-backed open and save flows
  - interactive 3D proxy viewport with module selection
  - pointer-driven viewport translate and `Shift` + drag uniform scaling
  - style-pack-backed module library with add and remove authoring
  - command-backed transform edits from the inspector
  - bounded desktop history helpers with labeled past/future snapshots and tested redo semantics
  - mirrored module creation through the inspector
  - command-backed region and material editing from the inspector
  - explicit backend snap command with deterministic alignment and connector compatibility checks
  - minimal inspector snap UI with deterministic compatible-target suggestions
  - deterministic preview and diff metadata for structured edit commands
  - preview command registration in the desktop Tauri invoke layer
  - minimal desktop-native fill and decal authoring through the Rust desktop bridge
  - rig template selection and socket authoring
  - connector attach and detach through the desktop inspector
  - Rust-owned validation and export preview through the desktop bridge
- standalone clean-build hardening
  - frontend output is standardized to `desktop/dist`
  - Tauri config points at the same build output
  - CI orders desktop build before Tauri Rust verification in clean environments
  - clean desktop Rust tests are documented to rely on prior frontend build artifacts because Tauri embeds them at compile time
- docs and handoff rewrite
  - `README.md`, `codex/`, and the main product docs now describe the standalone desktop direction instead of the old Blockbench and plugin path
  - primary rewrites now cover the PRD, technical architecture, WBS, and acceptance matrix

## Partial

- standalone desktop shell
  - native document flows exist
  - proxy viewport and module authoring exist
  - transform edits exist through the shared command path
  - viewport direct manipulation now supports translate and uniform scale
  - bounded undo/redo-capable history helpers exist and the desktop shell currently surfaces single-step undo
  - basic mirror placement exists through the desktop bridge, including symmetric connector replay for open counterpart slots
  - connector attach and detach exists
  - explicit backend snap exists for compatible connectors
  - a minimal inspector snap action exists, but target selection is still heuristic and not yet a richer viewport-driven flow
  - region, material, and rig metadata edits exist
  - minimal paint/decal authoring exists in the desktop shell through Rust-backed bridge commands
  - deterministic preview/diff metadata exists for structured edit commands and is exposed through the desktop invoke surface
  - a narrow material-assignment preview/apply/cancel flow now exists in the desktop shell
  - pure preview-state helper coverage exists in `desktop/src/materialPreviewState.ts` and `desktop/src/materialPreviewState.spec.ts`
  - validation and export run through Rust
  - still missing rotate drag/gizmo support, richer snap workflow polish, broader preview/diff UI coverage, and fuller desktop smoke coverage
- acceptance coverage
  - Rust and desktop slices are covered
  - desktop-first acceptance mapping is stronger than before
  - command preview, diff, and undo semantics are stronger than before, but still thinner than the ideal acceptance target

## Stubbed

- rotate drag/gizmo support, richer snap workflow polish, and deeper command-history UX are not implemented yet
- paint/decal authoring is still minimal even though it now runs through the Rust command path
- advanced paint tooling remains beyond the current material zone and decal model
- preview/apply UI now exists only for material assignment; other structured edit paths still apply immediately
- manual end-to-end desktop smoke is still outside automated verification

## Risks

- architecture drift if future work splits effort between `plugin/` and `desktop/`
- viewport interaction work can balloon if it is not kept to narrow validated slices
- undo and diff semantics for command preview and apply are still thinner than the long-term product target
- preview/diff coverage is now visible in the desktop shell for one edit family only, so future work still needs to generalize the UX without duplicating command logic
- the desktop Tauri Rust test lane still depends on a prior frontend build in clean environments because the app embeds static assets at compile time
- some source-of-truth and legacy documents outside this edit scope still contain plugin-first language
  - especially `AGENTS.md` and older scaffold docs that were intentionally left untouched in this pass

## Next Task Ids

- implement rotate-focused viewport gizmos and direct manipulation on top of the current translate/uniform-scale path
- add richer viewport snap workflows on top of the existing backend snap, mirror, and connector attachment paths
- expand desktop preview/diff UI beyond the current material-assignment flow
- deepen command DSL acceptance around preview diff and multi-step undo payloads
- reconcile remaining standalone-language mismatches in files outside this edit scope
