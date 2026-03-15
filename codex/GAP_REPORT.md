# Gap Report

## Direction

- active product direction is the standalone Tauri desktop app under `desktop/`
- Rust core crates remain authoritative for contracts, domain rules, validation, and export
- the old plugin-oriented path still exists in the repo as legacy scaffolding, not the primary release path

## Completed

- `T-26` explicit Blender-owned UV/material boundary
  - docs, fixtures, and validator evidence now make the metadata-first reusable-module import seam explicit
  - UV unwrap/editing remains Blender-owned by design rather than as an undocumented limitation
- `T-21` visible viewport transform guides as the interaction path
  - selected-module translate, uniform scale, and rotate now start from visible viewport guides instead of hidden modifier keys
  - a targeted viewport interaction spec covers guide-hit prioritization over plain mesh hits
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
  - users can assemble from existing and imported style-pack modules, create deterministic or custom-named authored copies, rename and delete those browser entries, filter reusable modules by source or current usage, search the reusable library by module id, source, connector and material metadata, source-asset path, or usage, inspect live compatible placement targets in the browser preview, keep an explicit add-without-snapping fallback, use a recommended add-and-snap CTA plus an alternative-target summary and connector-grouped alternative add-and-snap actions against the remaining suggested target list, back those actions with a pure request seam, a combined add-and-snap bridge command, a bridge-level right-hand snap outcome test, and selected-instance feedback in the preview when that reusable module is active in the scene, including repeated-placement counts when relevant, edit reusable metadata, and save or reload authored style-pack JSON content, but broader reusable-library management is still thin
  - transform edits exist through the shared command path
  - viewport direct manipulation now supports module-drag translate plus guide-driven translate, uniform scale, and rotate on the selected module
  - the desktop shell now surfaces visible undo, redo, and recent action history on top of the bounded history model
  - basic mirror placement exists through the desktop bridge, including symmetric connector replay for open counterpart slots
  - connector attach and detach exists
  - explicit backend snap exists for compatible connectors
  - a minimal inspector snap action exists, but target selection is still heuristic and not yet a richer viewport-driven flow
  - region, material, and rig metadata edits exist
  - minimal paint/decal authoring exists in the desktop shell through Rust-backed bridge commands
  - current texture workflow is still limited to material zones, fill layers, and decals; imported reusable-module contracts now fail if they omit, duplicate, or blank out material zones, but there is still no broader texturing pipeline yet
  - UV unwrap/editing is not an in-app M2 goal and should remain Blender-owned for now
  - deterministic preview/diff metadata exists for structured edit commands and is exposed through the desktop invoke surface
  - narrow preview/apply/cancel flows now exist in the desktop shell for material assignment, transform edits, region edits, rig-template assignment, connector attachment and clearing, and socket attachment
  - pure preview-state helper coverage exists in `desktop/src/materialPreviewState.ts` and `desktop/src/materialPreviewState.spec.ts`
  - validation and export run through Rust
- selected-module validation issues now project into the desktop inspector with actionable suggested-fix text, but the native launched smoke path is still manual-only
  - the desktop shell now has a clearer selection-first module browser plus a canonical imported-module contract path, style-pack-versus-imported-versus-session-authored-versus-in-use filter chips, text search by module id, source, connector and material metadata, source-asset path, or usage, and live compatible placement suggestions in the preview, explicit manual fallback copy, and a recommended add-and-snap CTA, but it still needs richer rendered previews, fuller interactive gizmo-driven transforms, richer viewport-first snap workflows, broader preview/diff UI coverage, fuller desktop smoke coverage, and more productized Blender handoff guidance
- acceptance coverage
  - Rust and desktop slices are covered
  - desktop-first acceptance mapping is stronger than before
  - command preview, diff, and undo semantics are stronger than before, but still thinner than the ideal acceptance target

## Stubbed

- selected-module guide-driven transforms now exist, but the viewport still lacks a fuller multi-axis tool palette and richer viewport-first snap polish
- the module browser now has deterministic preview cards, placement hints, live compatible placement suggestions, an explicit add-without-snapping fallback, and both recommended plus connector-grouped alternative add-and-snap actions for the suggested target list, but it still lacks richer rendered thumbnails and rotating live previews
- connector points and snap guides are now visible in the viewport, but the current overlays are informative rather than a fully interactive viewport-first snap workflow
- the reusable metadata draft editor now exists in the desktop shell, and users can now import canonical Blender-authored parts, duplicate reusable modules into deterministic or custom-named authored copies, rename and delete those entries, distinguish session-authored and currently in-use items in the browser, search the reusable library by module id, source, connector and material metadata, source-asset path, or usage, plus save and reload authored style-pack content, but reusable-library management is still only a thin save/reload path
- Blender handoff docs and pipeline guidance now make the metadata-first `.glb` plus declared material-zone contract explicit across both `.moduleimport.json` and descriptor-style `.module.json` imports, but deeper mesh and UV inspection remains intentionally out of scope
- paint/decal authoring is still minimal even though it now runs through the Rust command path
- advanced paint tooling remains beyond the current material zone and decal model
- the current texture workflow stops at material assignment, fill layers, and decals; it is not yet a fuller texturing pipeline
- UV editing is intentionally out of scope for in-app M2 work and should remain Blender-owned until the authoring/import pipeline is stable
- preview/apply UI now exists for material assignment, transform edits, region edits, rig-template assignment, connector attachment and clearing, and socket attachment; snap and other structured edit paths still apply immediately
- manual end-to-end desktop smoke is still outside automated verification

## Risks

- architecture drift if future work splits effort between `plugin/` and `desktop/`
- viewport interaction work can balloon if it is not kept to narrow validated slices
- undo and diff semantics for command preview and apply are still thinner than the long-term product target
- preview/diff coverage is now visible in the desktop shell for several edit families, but future work still needs to generalize the UX without duplicating command logic
- if module import, Blender handoff, and style-pack authoring stay undocumented, the app risks remaining a toy assembly shell instead of a real asset-production tool
- the desktop Tauri Rust test lane still depends on a prior frontend build in clean environments because the app embeds static assets at compile time
- some source-of-truth and legacy documents outside this edit scope still contain plugin-first language
  - especially `AGENTS.md` and older scaffold docs that were intentionally left untouched in this pass

## Next Task Ids

- deepen reusable style-pack library management beyond the current named-duplicate, rename, delete, text-search, in-use filter, and save/reload baseline
- finish Blender handoff docs and broaden the imported-module fixture set around the current contract
- deepen the Blender handoff validator so imported modules check more than referenced `.glb` paths and metadata seams
- deepen the module browser with richer rendered thumbnails or live rotating previews
- add richer viewport snap workflows on top of the existing backend snap, mirror, and connector attachment paths
- expand desktop preview/diff UI beyond the current material, transform, region, rig-template, connector, and socket flows
- deepen command DSL acceptance around preview diff and multi-step undo payloads
- reconcile remaining standalone-language mismatches in files outside this edit scope








