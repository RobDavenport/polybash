# Acceptance Summary

This file maps the acceptance matrix to the current standalone desktop evidence in the repository.

## Automated Scenarios

| ID | Status | Evidence | Notes |
|---|---|---|---|
| AC-01 | partial | `desktop/src/documentPaths.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs` | Desktop path normalization, canonical document loading, and save-path suggestion are covered. Full create/open/save acceptance through one integrated desktop test remains thin. |
| AC-02 | green | `crates/polybash-validate/tests/validation_fixtures.rs` | Style-pack compatibility and typed validation errors are covered in Rust. |
| AC-03 | partial | `desktop/src/desktopAcceptance.spec.ts`, `desktop/src/documentInspector.spec.ts`, `desktop/src-tauri/src/lib.rs` | Desktop module library and canonical fighter composition are covered. Full add-place-compose acceptance for a fresh empty document is still thinner than ideal. |
| AC-04 | green | `desktop/src/documentInspector.spec.ts`, `crates/polybash-ops/tests/connectors.rs`, `desktop/src-tauri/src/lib.rs` | Connector compatibility, persisted attachment flows, explicit backend snap alignment/rejection coverage, and a minimal inspector snap action with deterministic compatible-target suggestions are present. |
| AC-05 | green | `crates/polybash-validate/tests/validation_fixtures.rs` | Invalid connector fixture produces typed validation failure. |
| AC-06 | green | `desktop/src-tauri/src/lib.rs` | Mirror workflow exists in the standalone desktop backend, including deterministic counterpart naming and symmetric connector replay when the mirrored slot is free. |
| AC-07 | partial | `crates/polybash-domain/tests/command_apply.rs`, `desktop/src/sceneProjection.spec.ts`, `desktop/src-tauri/src/lib.rs` | Region clamp, transform editing, viewport translate, uniform scale, and projection effects are covered. Full normalized-scene/export acceptance for deformation is still indirect. |
| AC-08 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src-tauri/src/lib.rs`, `crates/polybash-validate/src/lib.rs` | Material zone assignment persists and validates. |
| AC-09 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs` | Minimal desktop-native fill and decal authoring now goes through Rust-backed desktop bridge commands and is covered in desktop tests. Richer paint tooling remains intentionally out of scope for the walking skeleton. |
| AC-10 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs`, `crates/polybash-validate/src/lib.rs` | Rig template and socket metadata are exercised in the standalone path and validate cleanly. |
| AC-11 | green | `crates/polybash-export/tests/export_fighter.rs`, `crates/polybash-cli/tests/cli_export.rs`, `desktop/src-tauri/src/lib.rs` | Fighter export writes GLB/report and desktop export preview reaches the Rust exporter. |
| AC-12 | green | `crates/polybash-validate/tests/validation_fixtures.rs`, `crates/polybash-cli/tests/cli_export.rs` | Over-budget fixture blocks export with typed errors. |
| AC-13 | partial | `crates/polybash-domain/tests/command_apply.rs`, `crates/polybash-llm/tests/command_dsl.rs`, `desktop/src-tauri/src/lib.rs`, `desktop/src/historyState.spec.ts`, `desktop/src/materialPreviewState.spec.ts` | Deterministic preview/diff metadata exists in the domain layer and desktop bridge, the desktop history model now has bounded undo/redo-capable helpers under test, and the desktop shell now surfaces a narrow material-assignment preview/apply/cancel flow. The visible UI still centers on undo, and preview coverage is not yet generalized beyond that one edit family. |
| AC-14 | green | `crates/polybash-llm/tests/command_dsl.rs` | Invalid command fixture rejection is automated. |
| AC-15 | green | `crates/polybash-export/tests/export_fighter.rs` | Canonical fighter export is asserted stable across repeated runs. |
| AC-16 | green | `crates/polybash-cli/tests/cli_validate.rs`, `crates/polybash-cli/tests/cli_export.rs`, `.github/workflows/ci.yml`, `desktop/src/desktopAcceptance.spec.ts` | CLI fixture flows are in CI, desktop frontend Vitest runs in the desktop CI lane, and the clean desktop build path is hardened around `desktop/dist` before Tauri Rust verification. |
| AC-17 | partial | `desktop/src/desktopAcceptance.spec.ts`, `desktop/src/documentInspector.spec.ts` | The desktop shell exposes actionable inspector data, but desktop-side validation state/report UX coverage is still thinner than the acceptance ideal. |
| AC-18 | manual smoke | manual only | Desktop launch/open/validate/export smoke remains pending by design. |

## Current Read

- Strongest green areas: Rust contracts, validator, exporter, CLI, desktop backend bridge, mirror workflow, backend snap semantics, frontend snap UI coverage, deterministic preview/diff metadata, desktop inspector projections, and desktop CI enforcement.
- Thinnest P0 areas: fully integrated desktop create/open/save acceptance, richer validation-state UX tests, rotate-focused direct manipulation, broader preview/diff UI coverage, deeper desktop history UX, and fuller viewport-driven snap UX.
