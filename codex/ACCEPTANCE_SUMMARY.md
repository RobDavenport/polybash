# Acceptance Summary

This file maps the acceptance matrix to the current standalone desktop evidence in the repository.

## Automated Scenarios

| ID | Status | Evidence | Notes |
|---|---|---|---|
| AC-01 | partial | `desktop/src/documentPaths.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs` | Desktop path normalization, canonical document loading, and save-path suggestion are covered. Full create/open/save acceptance through one integrated desktop test remains thin. |
| AC-02 | green | `crates/polybash-validate/tests/validation_fixtures.rs` | Style-pack compatibility and typed validation errors are covered in Rust. |
| AC-03 | partial | `crates/polybash-contracts/tests/imported_module_contract.rs`, `crates/polybash-contracts/tests/module_import_contract.rs`, `crates/polybash-contracts/tests/module_descriptor_roundtrip.rs`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src/documentInspector.spec.ts`, `desktop/src/moduleDraft.spec.ts`, `desktop/src/moduleDraftForm.spec.ts`, `desktop/src-tauri/src/lib.rs` | Desktop module library browsing, imported-module contract parsing across both `.moduleimport.json` and descriptor-style `.module.json` paths, positive import-through-placement/validation/export coverage for both supported shapes, style-pack-versus-imported-versus-session-authored-versus-in-use browser filtering, reusable-library metadata search by module id, source, connector and material metadata, source-asset path, or usage, scene-aware suggested placement targets in the browser preview, an explicit add-without-snapping fallback plus a recommended add-and-snap CTA, an explicit alternative-target summary plus connector-grouped alternative add-and-snap actions from the remaining suggested target list, along with selected-instance feedback in the preview when that reusable module is active in the scene, including repeated-placement counts for multi-placement modules, deterministic and custom-named reusable-module duplication into authored copies, authored-copy rename and delete coverage, reusable connector/region/material metadata authoring, explicit rejection of imported modules that omit, duplicate, or blank out material zones in either supported import shape, and a thin style-pack save/reload round-trip for imported or authored reusable modules are covered. Broader library-management UX is still thinner than ideal. |
| AC-04 | green | `desktop/src/documentInspector.spec.ts`, `crates/polybash-ops/tests/connectors.rs`, `desktop/src-tauri/src/lib.rs` | Connector compatibility, persisted attachment flows, explicit backend snap alignment/rejection coverage, and a minimal inspector snap action with deterministic compatible-target suggestions are present. |
| AC-05 | green | `crates/polybash-validate/tests/validation_fixtures.rs` | Invalid connector fixture produces typed validation failure. |
| AC-06 | green | `desktop/src-tauri/src/lib.rs` | Mirror workflow exists in the standalone desktop backend, including deterministic counterpart naming and symmetric connector replay when the mirrored slot is free. |
| AC-07 | partial | `crates/polybash-domain/tests/command_apply.rs`, `desktop/src/sceneProjection.spec.ts`, `desktop/src-tauri/src/lib.rs` | Region clamp, transform editing, viewport translate, uniform scale, and projection effects are covered. Full normalized-scene/export acceptance for deformation is still indirect. |
| AC-08 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src-tauri/src/lib.rs`, `crates/polybash-validate/src/lib.rs` | Material zone assignment persists and validates. |
| AC-09 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs` | Minimal desktop-native fill and decal authoring now goes through Rust-backed desktop bridge commands and is covered in desktop tests. Richer paint tooling remains intentionally out of scope for the walking skeleton. |
| AC-10 | green | `desktop/src/documentInspector.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src-tauri/src/lib.rs`, `crates/polybash-validate/src/lib.rs` | Rig template and socket metadata are exercised in the standalone path and validate cleanly. |
| AC-11 | green | `crates/polybash-export/tests/export_fighter.rs`, `crates/polybash-cli/tests/cli_export.rs`, `desktop/src-tauri/src/lib.rs` | Fighter export writes GLB/report and desktop export preview reaches the Rust exporter. |
| AC-12 | green | `crates/polybash-validate/tests/validation_fixtures.rs`, `crates/polybash-cli/tests/cli_export.rs` | Over-budget fixture blocks export with typed errors. |
| AC-13 | partial | `crates/polybash-domain/tests/command_apply.rs`, `crates/polybash-llm/tests/command_dsl.rs`, `desktop/src-tauri/src/lib.rs`, `desktop/src/historyState.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, `desktop/src/materialPreviewState.spec.ts` | Deterministic preview/diff metadata exists in the domain layer and desktop bridge, bounded history helpers are still under test, and the desktop shell now surfaces visible undo, redo, and recent action history alongside narrow preview/apply/cancel flows for material assignment, transform edits, region edits, rig-template assignment, connector attachment and clearing, and socket attachment. Preview coverage is still not generalized beyond those edit families. |
| AC-14 | green | `crates/polybash-llm/tests/command_dsl.rs` | Invalid command fixture rejection is automated. |
| AC-15 | green | `crates/polybash-export/tests/export_fighter.rs` | Canonical fighter export is asserted stable across repeated runs. |
| AC-16 | green | `crates/polybash-cli/tests/cli_validate.rs`, `crates/polybash-cli/tests/cli_export.rs`, `.github/workflows/ci.yml`, `desktop/src/desktopAcceptance.spec.ts` | CLI fixture flows are in CI, desktop frontend Vitest runs in the desktop CI lane, and the clean desktop build path is hardened around `desktop/dist` before Tauri Rust verification. |
| AC-17 | partial | `desktop/src/desktopAcceptance.spec.ts`, `desktop/src/documentInspector.spec.ts` | The desktop shell exposes actionable inspector data, but desktop-side validation state/report UX coverage is still thinner than the acceptance ideal. |
| AC-18 | manual smoke | manual only | Desktop launch/open/validate/export smoke remains pending by design. |

## Current Read

- Strongest green areas: Rust contracts, validator, exporter, CLI, desktop backend bridge, visible desktop undo/redo history, imported-module contract coverage, explicit Blender-owned UV/material boundary docs plus validator evidence, source-aware, metadata-search-aware, and placement-guided reusable-module browser filtering, reusable module metadata draft authoring, thin style-pack save/reload persistence, mirror workflow, backend snap semantics, guide-driven viewport transforms with visible orientation and connector overlays, desktop inspector projections, deterministic preview/diff metadata, and desktop CI enforcement.
- Thinnest P0 and next-lane areas: fully integrated desktop create/open/save acceptance, richer validation-state UX tests, broader preview/diff UI coverage beyond the current material, transform, region, rig-template, connector, and socket slices, richer rendered module previews, reusable-library management beyond the current thin named-duplicate-plus-rename-plus-delete-plus-search-plus-in-use-filter-plus-save/reload model, and fuller viewport-first snap UX beyond the new selected-module transform-guide slice.





## 2026-03-13 acceptance delta

- Matrix `AC-18` now has automated desktop evidence in `desktop/src/documentInspector.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop shell now preserves `suggestedFix` from Rust validation payloads and projects selected-module plus project-level issues into the inspector state.
- Manual desktop launch/open/validate/export smoke remains pending as matrix `AC-19`.
- Desktop socket preview/apply coverage now has automated evidence in `desktop/src/materialPreviewState.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop shell now routes region, rig-template, and socket inspector edits through the shared preview bridge path in `desktop/src/main.ts` instead of mixing helper-only preview state with direct apply handlers.
- Desktop connector preview/apply coverage now has automated evidence in `crates/polybash-domain/tests/command_apply.rs`, `crates/polybash-llm/tests/command_dsl.rs`, `desktop/src/materialPreviewState.spec.ts`, `desktop/src/desktopAcceptance.spec.ts`, and `desktop/src-tauri/src/lib.rs`.
- The desktop shell now routes connector attachment selects through the same shared preview bridge path in `desktop/src/main.ts`; snap remains on its direct transform-plus-attachment path for now.
- Desktop reusable-module duplication now has automated evidence in `desktop/src/moduleDraft.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now fork a reusable module into a deterministic authored copy before further metadata edits or save/reload persistence.
- Desktop authored reusable-module rename now has automated evidence in `desktop/src/moduleDraft.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now rename authored reusable entries without losing authored visibility or placed-instance references.
- Desktop authored reusable-module delete now has automated evidence in `desktop/src/moduleDraft.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now delete authored reusable entries and prune any placed instance, connector, or decal state that depended on them.
- Desktop named reusable-module duplication now has automated evidence in `desktop/src/moduleDraft.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser now suggests the next deterministic authored id at duplicate time while allowing a custom authored module id.
- Desktop usage-aware reusable-module browsing now has automated evidence in `desktop/src/documentInspector.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now filter reusable entries by `In Use` and show placed-instance badges for the selected reusable module preview.
- Desktop reusable-library search now has automated evidence in `desktop/src/documentInspector.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now search reusable entries by module id, source, connector and material metadata, source-asset path, or current usage without leaving the current organizer flow.
- Desktop scene-aware placement preview now has automated evidence in `desktop/src/documentInspector.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser preview can now surface live compatible placement targets before the user adds a reusable module to the project.
- Desktop browser add-and-snap action projection now has automated evidence in `desktop/src/documentInspector.spec.ts` and `desktop/src/desktopAcceptance.spec.ts`.
- The desktop browser can now keep an explicit `Add Without Snapping` fallback while also surfacing a recommended `Add and Snap` CTA for the top-ranked live target, an alternative-target summary, a connector-grouped preview action list for the remaining alternatives, and selected-instance feedback when that reusable module is active in the scene, including repeated-placement counts when relevant.
- Desktop browser placement guidance now has explicit request-building evidence in `desktop/src/documentInspector.spec.ts`, bridge-level right-hand snap outcome evidence in `desktop/src-tauri/src/lib.rs`, and a single combined add-and-snap bridge command for browser placement orchestration.








- Desktop viewport transform guidance now has automated evidence in `desktop/src/viewportController.spec.ts` plus the updated desktop frontend build/test baseline.
- The standalone shell now treats visible transform guides as the discoverable scale/rotate entry point instead of relying on hidden modifier keys.
- The Blender-to-PolyBash handoff docs and validator evidence now explicitly describe the metadata-first `.glb` plus material-zone contract as the intended M2 UV/material boundary.
