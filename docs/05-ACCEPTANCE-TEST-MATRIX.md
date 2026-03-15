# Acceptance Test Matrix

## 1. Purpose

This matrix maps P0 requirements to concrete acceptance scenarios. It is intended to remove ambiguity for agent-driven implementation.

## 2. Acceptance scenarios

| ID | Requirement(s) | Scenario | Automation level | Pass condition |
|---|---|---|---|---|
| AC-01 | FR-01, FR-02 | Create a new fighter project from the desktop template flow and save `.zxmodel` | automated | saved project validates against schema and reloads without drift |
| AC-02 | FR-01, FR-03 | Open an existing project and style pack through the desktop document flow | automated | project and style pack load into desktop state without typed errors |
| AC-03 | FR-04, FR-05 | Browse the module library and add or remove torso, head, arm, and leg modules | automated | module instances exist with stable ids, and removal prunes dependent connector and decal state |
| AC-04 | FR-06 | Attach compatible modules via connectors in the desktop inspector | automated | attachment succeeds and connector relationship is persisted |
| AC-05 | FR-06 | Clear an existing connector attachment in the desktop inspector | automated | attachment is removed and other attachments remain intact |
| AC-06 | FR-06 | Attempt incompatible connector attach | automated | validation or bridge command fails with a typed connector error |
| AC-07 | FR-07 | Mirror a left-arm module to create a right-arm pair | automated | mirrored module is created with expected metadata |
| AC-08 | FR-08 | Apply chest bulge and jaw width changes to authored regions | automated | values persist, clamp correctly, and affect normalized scene payload |
| AC-09 | FR-09 | Assign material zones using a palette from the style pack | automated | zone assignments persist and validate |
| AC-10 | FR-10 | Apply a fill layer and one decal layer | automated | paint layer model persists and report reflects usage |
| AC-11 | FR-11, FR-12 | Assign a fighter rig template and add `weapon_r` socket metadata | automated | metadata exists and validation passes |
| AC-12 | FR-13, FR-14, FR-15 | Export the example fighter to GLB and emit a report | automated | both artifacts are generated and the report has no fatal errors |
| AC-13 | FR-14 | Exceed triangle or texture budget in a negative fixture | automated | validator blocks export with a budget error |
| AC-14 | FR-16 | Preview and apply a structured edit command sequence | automated | preview yields a diff, apply mutates project state, and an undo payload exists |
| AC-15 | FR-17 | Submit an invalid command DSL payload | automated | payload is rejected with typed command validation errors |
| AC-16 | NFR-01 | Re-run export on the same fixture | automated | outputs are byte-stable or metadata-stable as defined |
| AC-17 | NFR-02 | Run validation and export from the CLI in headless CI | automated | commands succeed in a clean container |
| AC-18 | NFR-06 | Surface validator errors in desktop state or inspector projections | automated | desktop UI state includes actionable error data |
| AC-19 | Desktop smoke | Launch the built desktop app, use native document flow, validate once, and export once | manual smoke | desktop shell launches and a user can reach the validation and export path once |

## 3. Minimal test file map

The exact names may vary, but the repo should end up with equivalents to:

### Rust
- `crates/polybash-contracts/tests/project_roundtrip.rs`
- `crates/polybash-contracts/tests/stylepack_schema.rs`
- `crates/polybash-domain/tests/command_apply.rs`
- `crates/polybash-ops/tests/connectors.rs`
- `crates/polybash-ops/tests/regions_property.rs`
- `crates/polybash-validate/tests/validation_fixtures.rs`
- `crates/polybash-export/tests/export_fighter.rs`
- `crates/polybash-cli/tests/cli_validate.rs`
- `crates/polybash-cli/tests/cli_export.rs`
- `desktop/src-tauri/src/lib.rs` test module for desktop bridge and workflow coverage

### TypeScript
- `desktop/src/documentPaths.spec.ts`
- `desktop/src/documentInspector.spec.ts`
- `desktop/src/sceneProjection.spec.ts`
- equivalent desktop workflow specs for document actions, connector UI, and validation display as those slices harden

## 4. Canonical acceptance fixture set

### Positive fixtures
- `fixtures/projects/valid/fighter_basic.zxmodel.json`
- `fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json`
- `fixtures/commands/valid/fighter_variant_commands.json`

### Negative fixtures
- `fixtures/projects/invalid/fighter_over_budget.zxmodel.json`
- `fixtures/projects/invalid/bad_connector.zxmodel.json`
- `fixtures/stylepacks/invalid/missing_palette.stylepack.json`
- `fixtures/commands/invalid/unknown_op.json`
- `fixtures/imports/invalid/prop_crate_no_materials.moduleimport.json`
- `fixtures/imports/invalid/prop_crate_duplicate_materials.moduleimport.json`
- `fixtures/imports/invalid/prop_crate_blank_zone.moduleimport.json`

### Imported-module contract fixtures
- `fixtures/imports/valid/prop_crate_round_a.moduleimport.json`
- `fixtures/imports/valid/fighter_shoulder_guard_a.module.json`
- `fixtures/imports/invalid/fighter_shoulder_guard_blank_zone.module.json`
- imported reusable modules must point at a `.glb` source asset and declare material zones that are present, non-empty, and unique
- descriptor-style `.module.json` imports and versioned `.moduleimport.json` imports both run through the same desktop validation seam
- UV unwrap/editing remains Blender-owned for this slice; fixture coverage validates the declared metadata seam rather than mesh UV topology, and that metadata-first seam is the intended acceptance boundary for the current M2 import/material contract

## 5. Pass and fail rules

### Pass
- scenario behaves exactly as required
- errors are typed and useful
- snapshots match expected outputs
- deterministic outputs remain stable

### Fail
- silent fallback occurs
- export succeeds despite fatal validation issues
- command apply mutates state without preview or undo support
- desktop-only assumptions leak into headless tests
- acceptance scenario is only "manually verified" when it should be automated

## 6. Manual smoke checklist (thin)

1. launch the desktop application
2. open the canonical fighter example or create a new fighter from the desktop shell
3. confirm the module library, inspector, and viewport appear
4. run validation
5. run export once
6. verify `asset.glb` and `asset.report.json` exist

Anything beyond this belongs in future polish, not the overnight slice.

## 7. Requirement coverage rule

No P0 requirement may remain uncovered.
If a requirement cannot be automated in the first overnight pass, it must:
- be explicitly marked as manual smoke
- have a reason
- have a follow-up task id
