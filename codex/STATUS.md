# Codex Status Ledger

Use this file to record:
- which prompt was run
- which task ids are done
- what evidence exists
- what remains blocked

This file should be updated by the agent after every meaningful pass.

Current product direction:
- the standalone Tauri desktop app is the active path
- older plugin-first entries remain below as historical ledger records, not current architecture guidance

## 2026-03-12 - Prompt 00 Launch Pass

- Prompt run: `codex/prompts/00-LAUNCH-THIS-REPO.md`
- M1 scaffold audit:
  - contracts: present with fixtures and generated schemas
  - core: domain, ops, validator, exporter, CLI present and testable
  - bridge: Rust WASM crate and TS loader/facade were stubbed
  - plugin: controller/state shell present with headless tests
  - qa: CI file exists, but acceptance harness/release gate tracking is still thin
- Task ids completed in this pass: `T-08`
- Acceptance criteria targeted:
  - bridge lane requirement from `codex/taskboard.yaml`
  - `docs/03-WBS-AND-MILESTONES.md` WP-08 done criteria
  - `docs/05-ACCEPTANCE-TEST-MATRIX.md` bridge coverage expectations
- Failing tests added first:
  - `crates/polybash-wasm/tests/bridge_parity.rs`
  - `plugin/src/tests/bridge.spec.ts`
- Implementation changes:
  - replaced the `polybash-wasm` placeholder with JSON validate/export bridge functions and wasm-bindgen wrappers
  - added structured bridge error payloads and base64 export bundle serialization
  - added `WasmCoreFacade` and improved `wasmLoader` to return concrete bindings
  - fixed an existing Rust lifetime compile issue in `crates/polybash-validate/src/lib.rs`
  - fixed plugin `tsconfig.json` so `typecheck` includes `vitest.config.ts` without `rootDir` failure
- Validation commands run:
  - `cargo test -p polybash-wasm`
  - `cargo test --workspace`
  - `cargo fmt --check`
  - `corepack pnpm --dir plugin test -- bridge.spec.ts`
  - `corepack pnpm --dir plugin typecheck`
  - `corepack pnpm --dir plugin test`
  - `corepack pnpm --dir plugin build`
- Results:
  - Rust bridge parity tests pass
  - full Rust workspace tests pass
  - plugin typecheck passes
  - full plugin test suite passes
  - plugin build passes
- Remaining M1 gaps and assumptions:
  - plugin bootstrap still uses test-time facades; no generated wasm package is wired into a real runtime entry yet
  - CLI integration tests expected by the acceptance matrix are still missing
  - acceptance harness/release gate summary is not yet fully populated
  - manual host smoke coverage is still pending by design

## 2026-03-12 - CLI and Acceptance Pass

- Prompt alignment:
  - `codex/prompts/04-CLI.md`
  - `codex/prompts/07-ACCEPTANCE-AND-CI.md`
  - `codex/prompts/08-GAP-REPORT-AND-HANDOFF.md`
- Task ids completed or materially advanced:
  - completed: `T-07`
  - advanced: `T-15`
- Acceptance criteria targeted:
  - CLI validate/export command coverage
  - fill + decal layer workflow coverage
  - rig template + socket workflow coverage
  - release gate and gap-report handoff docs
- Failing tests added first:
  - `crates/polybash-cli/tests/cli_validate.rs`
  - `crates/polybash-cli/tests/cli_export.rs`
  - `plugin/src/tests/rig-controller.spec.ts`
  - expanded `plugin/src/tests/material-controller.spec.ts`
- Implementation changes:
  - added CLI integration tests for valid/invalid validate/export flows
  - added plugin workflow coverage for decal layer persistence and rig metadata persistence
  - added `MaterialController.addDecalLayer`
  - updated CI to run the plugin build gate
  - added `codex/ACCEPTANCE_SUMMARY.md`, `codex/RELEASE_GATE_SUMMARY.md`, and `codex/GAP_REPORT.md`
- Validation commands run:
  - `cargo test -p polybash-cli --test cli_validate --test cli_export`
  - `corepack pnpm --dir plugin test -- material-controller.spec.ts rig-controller.spec.ts`
- Results:
  - CLI integration tests pass
  - targeted plugin workflow tests pass
  - acceptance/release/gap handoff docs now exist
- Remaining gaps and assumptions:
  - mirror workflow remains open
  - project/template initialization acceptance is still thin
  - command DSL acceptance coverage is still partial/open
  - deterministic repeated-export coverage is still missing

## 2026-03-12 - Workflow Coverage and Handoff Polish

- Task ids completed or materially advanced:
  - advanced: `T-13`
  - advanced: `T-14`
  - advanced: `T-15`
- Acceptance criteria targeted:
  - AC-09 fill + decal layer persistence
  - AC-10 rig template + socket persistence
  - CI/build parity and subagent handoff clarity
- Failing tests added first:
  - expanded `plugin/src/tests/material-controller.spec.ts`
  - `plugin/src/tests/rig-controller.spec.ts`
- Implementation changes:
  - added `MaterialController.addDecalLayer`
  - added rig controller workflow coverage
  - updated `README.md` with concrete CLI commands and subagent handoff sequence
  - added plugin build to `.github/workflows/ci.yml`
- Validation commands run:
  - `cargo fmt --check`
  - `cargo test --workspace`
  - `corepack pnpm --dir plugin typecheck`
  - `corepack pnpm --dir plugin test`
  - `corepack pnpm --dir plugin build`
- Results:
  - full Rust workspace tests pass
  - full plugin typecheck/test/build passes
  - acceptance and handoff docs are aligned with current repo state
- Remaining gaps and assumptions:
  - mirror placement is still the most obvious M1 workflow gap
  - command DSL acceptance coverage remains incomplete
  - explicit deterministic repeated-export coverage is still missing

## 2026-03-12 - Determinism and DSL Coverage Pass

- Task ids completed or materially advanced:
  - advanced: `T-03`
  - advanced: `T-06`
  - advanced: `T-15`
  - advanced: `T-16`
- Acceptance criteria targeted:
  - AC-13 command preview/apply fixture coverage
  - AC-14 invalid command fixture rejection
  - AC-15 repeated export determinism
  - AC-16 CI fixture validate/export evidence
- Failing tests added first:
  - expanded `crates/polybash-domain/tests/command_apply.rs`
  - expanded `crates/polybash-export/tests/export_fighter.rs`
  - `crates/polybash-llm/tests/command_dsl.rs`
- Implementation changes:
  - added deterministic repeated-export coverage
  - added valid/invalid command fixture tests
  - expanded command-apply coverage across the canonical valid command sequence
  - updated CI to run canonical fixture validate/export commands
- Validation commands run:
  - `cargo test -p polybash-export --test export_fighter -p polybash-domain --test command_apply -p polybash-llm --test command_dsl`
- Results:
  - deterministic export coverage passes
  - invalid command fixture rejection is automated
  - canonical command fixture preview/apply coverage is stronger
- Remaining gaps and assumptions:
  - mirror workflow remains open
  - command diff/undo semantics are still thinner than the acceptance matrix ideal
  - manual Blockbench smoke remains pending

## 2026-03-12 - Final Verification Update

- Validation commands run:
  - `cargo fmt --check`
  - `cargo test --workspace`
- Results:
  - full Rust workspace passes with the newer CLI, export determinism, and command DSL tests included
  - formatting is back to green after the last test additions

## 2026-03-12 - Standalone Desktop Pivot Start

- Architecture decision:
  - begin pivot from plugin-host assumptions toward a standalone desktop app
  - keep Rust core crates for validation/export/domain logic
  - use `desktop/` as the new standalone shell path
- Implemented in this pass:
  - added `desktop/src-tauri` Rust crate as `polybash-desktop`
  - added Tauri command bridge for canonical document load, validate, and export preview
  - added a minimal web UI shell under `desktop/` that calls those commands
  - added workspace/package wiring for the new desktop package
- Validation commands run:
  - `cargo test -p polybash-desktop`
  - `corepack pnpm install`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop build`
  - `cargo build -p polybash-desktop`
- Results:
  - desktop Rust backend tests pass
  - desktop web UI typechecks and builds
  - standalone Tauri binary compiles
- Remaining gaps:
  - repo-wide specs and prompts still assume the old plugin architecture and need a formal rewrite
  - the desktop shell currently loads canonical fixtures, not arbitrary user files yet
  - viewport rendering is still a placeholder shell rather than a real 3D editor surface

## 2026-03-12 - Desktop Pivot Verification

- Validation commands run:
  - `cargo fmt --check`
  - `cargo test --workspace`
- Results:
  - the workspace now passes with `polybash-desktop` included
  - the standalone desktop shell is part of the real Rust build surface, not an isolated side project

## 2026-03-12 - Desktop Viewport and Authoring Slice

- Task area materially advanced:
  - standalone desktop authoring path
- Acceptance criteria targeted:
  - replace the desktop placeholder viewport with a real interactive surface
  - expose module selection/inspection in the standalone shell
  - allow style-pack-driven module add/remove operations through the Rust desktop bridge
- Failing tests added first:
  - `desktop/src/sceneProjection.spec.ts`
  - `desktop/src/documentInspector.spec.ts`
  - expanded `desktop/src-tauri/src/lib.rs` test module with add/remove coverage
- Implementation changes:
  - added typed desktop scene projection and document inspection modules
  - added a Three.js proxy viewport controller with click selection
  - expanded the desktop shell with module strip, inspector, and style-pack-backed module library
  - added Rust desktop commands for `add_module_instance` and `remove_module_instance`
  - added deterministic default placement/material assignment for new module instances
  - pruned dependent connector attachments and decal targets when removing a module
- Validation commands run:
  - `corepack pnpm install`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test -p polybash-desktop`
  - `cargo test --workspace`
  - `cargo fmt --check`
- Results:
  - desktop typecheck passes
  - desktop projection/inspector tests pass
  - desktop build passes
  - desktop Rust tests pass
  - full Rust workspace stays green
- Remaining gaps:
  - transform gizmos and direct manipulation are still absent
  - file picker/open-save UX is still path-field based
  - prompt/taskboard docs still need a fuller standalone rewrite

## 2026-03-12 - Desktop Document Workflow and Inspector Editing

- Task area materially advanced:
  - standalone desktop document workflow
  - standalone desktop constrained editing path
  - codex orchestration rewrite
- Acceptance criteria targeted:
  - native document open/save flow in the standalone shell
  - command-backed material assignment and region editing in the inspector
  - subagent prompts/taskboard aligned to the standalone architecture
- Failing tests added first:
  - `desktop/src/documentPaths.spec.ts`
  - expanded `desktop/src/documentInspector.spec.ts`
  - expanded `desktop/src-tauri/src/lib.rs` test module with desktop edit-command coverage
- Implementation changes:
  - added Tauri dialog plugin wiring and main-window dialog capability
  - added native browse/save-as flows in the desktop shell
  - added typed desktop path helpers for dialog result normalization and save-path suggestions
  - exposed `apply_edit_command` through the desktop Rust bridge using the existing domain command path
  - upgraded the inspector with material selectors and region sliders backed by typed edit commands
  - rewrote `codex/taskboard.yaml` and the main launch/handoff prompts around the standalone desktop path
- Validation commands run:
  - `corepack pnpm install`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test -p polybash-desktop`
  - `cargo test --workspace`
  - `cargo fmt --check`
- Results:
  - desktop dialog integration compiles and desktop tests/build stay green
  - desktop Rust tests now cover command-backed region/material edits
  - codex orchestration is now pointed at the standalone app instead of the old plugin shell
- Remaining gaps:
  - transform gizmos, connector workflows, and mirror/snap authoring are still missing
  - undo/diff UX is still thinner than the long-term acceptance ideal
  - broader product/spec docs outside `codex/` still need a fuller standalone rewrite

## 2026-03-12 - Desktop Rig Metadata Slice

- Task area materially advanced:
  - standalone desktop rig metadata workflow
- Acceptance criteria targeted:
  - rig template selection in the standalone inspector
  - socket authoring in the standalone inspector
  - typed desktop Rust bridge reuse for rig metadata edits
- Failing tests added first:
  - expanded `desktop/src-tauri/src/lib.rs` test module with `assign_rig_template` and `attach_socket` coverage through `apply_edit_command`
  - expanded `desktop/src/documentInspector.spec.ts` with rig detail coverage
- Implementation changes:
  - desktop inspector now exposes rig template selection and socket authoring
  - both actions run through the typed desktop Rust bridge using the existing edit-command path
  - desktop Rust bridge coverage now includes rig template assignment and socket attachment through `apply_edit_command`
  - desktop TypeScript inspector coverage now includes rig detail projection
- Validation commands run:
  - `cargo test -p polybash-desktop`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
- Results:
  - desktop Rust tests pass with rig metadata command coverage
  - desktop typecheck passes
  - desktop inspector tests pass with rig detail coverage
- Remaining gaps:
  - transform gizmos and direct manipulation are still absent
  - connector, snap, and mirror workflows are still missing
  - broader docs outside `codex/` still need a fuller standalone rewrite

## 2026-03-12 - Standalone Docs and Handoff Reconciliation

- Task area materially advanced:
  - standalone desktop documentation and handoff alignment
- Acceptance and handoff targets:
  - repoint repo-facing docs from the old Blockbench and plugin path to the standalone Tauri desktop app
  - reflect already-implemented desktop workflows in the docs and handoff surfaces
  - reduce architecture drift between current desktop code and written guidance
- Evidence captured from the current codebase:
  - native desktop open and save dialogs are present
  - desktop module add and remove flows are present
  - command-backed material and region edits are present
  - rig template selection and socket authoring are present
  - connector attach and detach flows are present
  - validation and export remain Rust-owned through the desktop bridge
- Implementation changes:
  - rewrote `README.md` around the standalone desktop path and current workflow surface
  - updated `codex/GAP_REPORT.md` and `codex/STANDALONE_PIVOT.md` to reflect the desktop path as the active product direction
  - rewrote `docs/01-PRD.md`, `docs/02-TECHNICAL-ARCHITECTURE.md`, `docs/03-WBS-AND-MILESTONES.md`, and `docs/05-ACCEPTANCE-TEST-MATRIX.md` around the standalone desktop architecture
- Validation commands run:
  - none; docs and handoff rewrite only
- Results:
  - repo-facing product and architecture docs now consistently describe the standalone Tauri desktop app
  - acceptance and WBS language now match the implemented desktop workflows more closely
  - remaining known mismatches are narrowed to files outside this edit scope
- Remaining gaps and assumptions:
  - `AGENTS.md`, `MASTER_SPEC.md`, and some legacy docs still carry older plugin-first language
  - transform gizmos, mirror workflows, and stronger undo and diff UX are still product gaps, not just doc gaps

## 2026-03-12 - Standalone Product Docs Rewrite

- Task area materially advanced:
  - standalone product docs and acceptance surfaces
- Acceptance criteria targeted:
  - remove stale Blockbench and plugin-first assumptions from the primary product docs
  - align PRD, architecture, WBS, and acceptance matrix with the standalone desktop path
- Implementation changes:
  - rewrote `docs/01-PRD.md` around a focused standalone desktop authoring tool
  - rewrote `docs/02-TECHNICAL-ARCHITECTURE.md` so `desktop/` and the Tauri bridge are the primary UI boundary
  - rewrote `docs/03-WBS-AND-MILESTONES.md` so P0 workflow work packages run through the desktop shell
  - rewrote `docs/05-ACCEPTANCE-TEST-MATRIX.md` so acceptance coverage maps to the current desktop tests and manual desktop smoke
- Validation commands run:
  - targeted terminology audits with `rg` for `Blockbench` and `plugin`
  - `rg --files desktop/src -g "*.spec.ts"`
- Results:
  - the core product docs now describe the standalone desktop app as the primary product direction
  - acceptance guidance points at the real desktop-side test surfaces in the repository
- Remaining gaps:
  - `MASTER_SPEC.md` and some legacy repo scaffolding still describe the older plugin-first architecture

## 2026-03-12 - Desktop Transform Editing Slice

- Task area materially advanced:
  - standalone desktop transform authoring workflow
- Acceptance criteria targeted:
  - typed transform edits through the shared command path
  - inspector-backed translate, rotate, and scale editing in the standalone shell
  - viewport projection parity with authored transform changes
- Failing tests added first:
  - expanded `crates/polybash-domain/tests/command_apply.rs` with transform preview and invalid-scale coverage
  - expanded `crates/polybash-llm/tests/command_dsl.rs` with `set_transform` summary coverage
  - expanded `desktop/src-tauri/src/lib.rs` test module with desktop transform command coverage
  - expanded `desktop/src/sceneProjection.spec.ts` with transform projection coverage
- Implementation changes:
  - added typed `set_transform` support to `EditCommand` in `polybash-contracts`
  - added domain handling for transform updates plus explicit rejection of non-positive scale values
  - extended the desktop inspector with command-backed numeric inputs for position, rotation, and scale
  - extended command summarization to include transform edits
- Validation commands run:
  - `cargo test -p polybash-domain --test command_apply`
  - `cargo test -p polybash-llm --test command_dsl`
  - `cargo test -p polybash-desktop`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test --workspace`
  - `cargo fmt --check`
- Results:
  - shared transform commands now round-trip through contracts, domain logic, desktop bridge, and the standalone inspector
  - non-positive scale edits fail explicitly instead of silently corrupting state
  - desktop viewport projections reflect authored transform changes
- Remaining gaps:
  - viewport gizmos and drag-based direct manipulation are still absent
  - mirror and richer snap workflows are still open

## 2026-03-12 - Desktop Mirror Workflow Slice

- Task area materially advanced:
  - standalone desktop symmetry and mirrored placement workflow
- Acceptance criteria targeted:
  - AC-06 mirror a left-arm module into a right-arm counterpart
  - deterministic mirrored instance naming and transform defaults
  - desktop inspector access to the mirror workflow
- Failing tests added first:
  - expanded `desktop/src-tauri/src/lib.rs` test module with mirrored counterpart coverage and deterministic id coverage
- Implementation changes:
  - added `mirror_module_instance` to the Rust desktop backend
  - mirrored module ids now honor existing `_l` and `_r` fixture/style-pack naming when a counterpart module exists
  - mirrored instances clear connector attachments and preserve authored material and region metadata
  - mirrored placement now replays obvious inbound symmetric connector relationships when the mirrored slot is free
  - added a mirror action to the standalone desktop inspector
- Validation commands run:
  - `cargo test -p polybash-desktop`
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test --workspace`
  - `cargo fmt --check`
- Results:
  - desktop mirror placement now exists through the Rust bridge and inspector UI
  - AC-06 style left-arm to right-arm mirroring is covered by automated Rust tests
  - deterministic mirrored ids are verified when a counterpart instance already exists
  - missing symmetric torso slots now reconnect to the mirrored module automatically
- Remaining gaps:
  - mirrored placement still uses heuristic symmetry rather than a full viewport snap workflow
  - viewport gizmos and drag-based direct manipulation are still absent

## 2026-03-13 - Desktop Direct Manipulation and Undo Slice

- Task area materially advanced:
  - standalone desktop direct manipulation workflow
  - standalone desktop local undo workflow
- Acceptance criteria targeted:
  - pointer-driven viewport translate in the desktop shell
  - uniform viewport scale through the existing `set_transform` command path
  - reversible last-action recovery without introducing hidden state mutation
- Failing tests added first:
  - expanded `desktop/src/sceneProjection.spec.ts`
  - `desktop/src/historyState.spec.ts`
- Implementation changes:
  - added pointer-driven viewport translate with preview and typed transform commits
  - added `Shift` + drag uniform scale with safe minimum clamping
  - added `DesktopUndoSnapshot` plus deep-clone capture and restore helpers
  - wired single-level undo into the desktop shell for the latest successful document-changing action
- Validation commands run:
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
- Results:
  - desktop viewport direct manipulation now supports translate plus uniform scale
  - desktop undo restores document, selection, report, export preview, and path state from the latest captured snapshot
- Remaining gaps:
  - no rotate gizmo or rotate drag workflow yet
  - undo is single-level only and there is no redo

## 2026-03-13 - Desktop Snap and Command Preview Metadata Slice

- Task area materially advanced:
  - standalone desktop snap semantics
  - deterministic command preview and diff metadata
- Acceptance criteria targeted:
  - explicit backend snap command for compatible connectors
  - structured preview metadata before command apply
  - desktop bridge parity for preview payloads
- Failing tests added first:
  - expanded `crates/polybash-domain/tests/command_apply.rs`
  - expanded `crates/polybash-llm/tests/command_dsl.rs`
  - expanded `desktop/src-tauri/src/lib.rs` test module with preview and snap coverage
- Implementation changes:
  - added `CommandPreview`, `CommandDiff`, `CommandChange`, and `PreviewValue` in the domain layer
  - added `preview_edit_command` to the desktop bridge with deterministic before/after payloads
  - added `snap_module_instance` to the desktop backend with connector compatibility checks and deterministic transform alignment
- Validation commands run:
  - `cargo test -p polybash-domain --test command_apply`
  - `cargo test -p polybash-llm --test command_dsl`
  - `cargo test --manifest-path desktop/src-tauri/Cargo.toml`
- Results:
  - structured preview and diff metadata now round-trip through the desktop backend
  - backend snap succeeds for compatible connectors and rejects incompatible connector kinds
- Remaining gaps:
  - preview coverage is still centered on structured edit commands, not the full action surface
  - snap is a backend command today, not yet a richer viewport-driven workflow

## 2026-03-13 - Desktop Paint/Decal and Clean-Build Hardening Slice

- Task area materially advanced:
  - standalone desktop paint/decal workflow
  - standalone desktop clean-build hardening
- Acceptance criteria targeted:
  - minimal desktop-native fill and decal authoring
  - clean CI verification for the desktop shell and Tauri backend
  - remove legacy build-output ambiguity from the standalone path
- Failing tests added first:
  - expanded `desktop/src/documentInspector.spec.ts`
  - expanded `desktop/src/desktopAcceptance.spec.ts`
- Implementation changes:
  - added desktop inspector helpers and UI for fill palette selection plus decal add/remove
  - added desktop acceptance coverage for a minimal paint and decal authoring flow
  - moved frontend build output to `desktop/dist`
  - aligned `tauri.conf.json` and CI ordering around the clean desktop build path
- Validation commands run:
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test --manifest-path desktop/src-tauri/Cargo.toml`
  - `cargo test --workspace`
  - `cargo fmt --check`
- Results:
  - desktop paint/decal authoring now exists in the standalone shell
  - clean desktop build output and CI ordering are aligned with the current Tauri setup
  - full workspace validation stays green after the desktop build runs first
- Remaining gaps:
  - paint and decal edits are still desktop-local helpers, not Rust command-backed operations
  - automated desktop smoke remains thinner than the eventual product target

## 2026-03-13 - Standalone Handoff Docs Refresh

- Task area materially advanced:
  - standalone handoff and current-state documentation
- Acceptance and handoff targets:
  - reflect the newest standalone desktop slices in repo-facing docs
  - remove stale claims that still treated direct manipulation, snap, preview metadata, or paint/decal work as absent
- Implementation changes:
  - updated `README.md`, `codex/STATUS.md`, `codex/ACCEPTANCE_SUMMARY.md`, `codex/GAP_REPORT.md`, and `codex/RELEASE_GATE_SUMMARY.md`
  - aligned the current-state docs with translate plus uniform scale, single-level undo, backend snap, deterministic preview/diff metadata, minimal desktop paint/decal support, and clean-build hardening
- Validation commands run:
  - none; docs-only reconciliation pass
- Results:
  - handoff surfaces now describe the standalone desktop repo state more accurately
- Remaining gaps:
  - docs remain explicit that rotate gizmos, richer snap UX, redo/history depth, and manual desktop smoke are still open

## 2026-03-13 - Current-State Docs Sync

- Task area materially advanced:
  - repo-visible standalone desktop status sync
- Acceptance and handoff targets:
  - reflect the newest standalone desktop slices in the allowed current-state docs only
  - make the docs explicit about what is implemented versus still thin in the snap, preview, paint/decal, and undo paths
- Implementation changes:
  - updated `README.md`, `codex/STATUS.md`, `codex/ACCEPTANCE_SUMMARY.md`, `codex/GAP_REPORT.md`, and `codex/RELEASE_GATE_SUMMARY.md`
  - aligned the current-state docs with frontend snap UI, preview-command registration, deterministic preview/diff metadata, backend snap, minimal desktop paint/decal workflow, clean-build hardening, translate plus uniform scale, and single-level undo
  - made the remaining limitations more explicit, especially heuristic snap UX, frontend-local paint/decal edits, single-level undo, and the Tauri frontend-build dependency in clean environments
- Validation commands run:
  - none; docs-only synchronization pass
- Results:
  - repo-facing current-state docs now describe the latest landed standalone desktop slices more accurately
- Remaining gaps:
  - rotate-focused direct manipulation is still missing
  - snap remains a minimal inspector-driven workflow rather than a richer viewport UX
  - paint and decal edits are still not Rust command-backed
  - undo is still single-level only, with no redo
  - manual desktop smoke remains pending

## 2026-03-13 - Desktop History and Rust Paint Bridge Sync

- Task area materially advanced:
  - standalone desktop history model
  - standalone desktop paint/decal bridge path
  - standalone handoff docs
- Acceptance and handoff targets:
  - repair the desktop history lane so bounded past/future snapshots and redo semantics are covered
  - move desktop fill/decal actions onto the Rust desktop bridge
  - expose stable desktop request-builder shapes for paint/decal bridge payloads
- Failing tests added first:
  - existing failures in `desktop/src/historyState.spec.ts`
  - existing failures in `desktop/src/documentInspector.spec.ts`
  - existing failures in `desktop/src/desktopAcceptance.spec.ts`
- Implementation changes:
  - added `createHistoryState`, `pushHistoryEntry`, `undoHistory`, and `redoHistory` in `desktop/src/historyState.ts`
  - kept deep-cloned snapshot handling and added bounded past/future history trimming with redo-label semantics
  - rewired `desktop/src/main.ts` fill and decal actions to call `set_fill_layer_palette_command`, `add_module_decal_layer_command`, and `remove_module_decal_layer_command`
  - added stable request-builder exports in `desktop/src/documentInspector.ts` for fill/decal bridge payloads
  - updated current-state docs to reflect the stronger history model and Rust-backed paint/decal flow
- Validation commands run:
  - `corepack pnpm --dir desktop test -- historyState.spec.ts`
  - `corepack pnpm --dir desktop test -- documentInspector.spec.ts desktopAcceptance.spec.ts`
- Results:
  - desktop history tests now pass with redo-capable bounded helper behavior
  - desktop fill/decal bridge-shape tests and desktop acceptance tests pass
  - current-state docs no longer describe the fill/decal workflow as desktop-local
- Remaining gaps:
  - the visible desktop UI still exposes undo only; redo is implemented at the helper/model level, not yet surfaced in the shell
  - at the close of this pass, preview/diff metadata existed through the desktop bridge, but preview/apply UI was still missing
  - rotate-focused direct manipulation, richer snap UX, and manual desktop smoke remain open

## 2026-03-13 - Desktop Material Preview Slice

- Task area materially advanced:
  - standalone desktop preview/diff UX
  - standalone desktop preview helper coverage
  - standalone handoff docs
- Acceptance and handoff targets:
  - surface a minimal preview/apply/cancel UI for one structured edit family
  - keep preview scope narrow and deterministic rather than generalizing prematurely
  - update repo-facing docs to reflect the new visible preview slice
- Failing tests added first:
  - `desktop/src/materialPreviewState.spec.ts`
- Implementation changes:
  - added a narrow material-assignment preview/apply/cancel flow in `desktop/src/main.ts`
  - staged material changes now call `preview_edit_command_command` before apply
  - added `desktop/src/materialPreviewState.ts` with pure helpers for matching pending material previews and resolving displayed material values
  - added `desktop/src/materialPreviewState.spec.ts` with matching, non-matching, and fallback coverage
  - updated `README.md`, `codex/STATUS.md`, `codex/ACCEPTANCE_SUMMARY.md`, `codex/GAP_REPORT.md`, and `codex/RELEASE_GATE_SUMMARY.md`
- Validation commands run:
  - `corepack pnpm --dir desktop typecheck`
  - `corepack pnpm --dir desktop test`
  - `corepack pnpm --dir desktop build`
  - `cargo test --manifest-path desktop/src-tauri/Cargo.toml`
- Results:
  - desktop frontend suite now includes `desktop/src/materialPreviewState.spec.ts`
  - desktop frontend validation is green at 6 Vitest files / 32 tests
  - the desktop shell now visibly surfaces preview/apply/cancel for material assignment while reusing the existing command bridge
- Remaining gaps:
  - preview/apply UX is still narrow and only covers material assignment
  - the visible desktop UI still exposes undo only; redo remains helper/model-level
  - rotate-focused direct manipulation, richer snap UX, and manual desktop smoke remain open
