# Acceptance Test Matrix

## 1. Purpose

This matrix maps P0 requirements to concrete acceptance scenarios. It is intended to remove ambiguity for agent-driven implementation.

## 2. Acceptance scenarios

| ID | Requirement(s) | Scenario | Automation level | Pass condition |
|---|---|---|---|---|
| AC-01 | FR-01, FR-02 | Create a new fighter project from template and save `.zxmodel` | automated | saved project validates against schema and reloads without drift |
| AC-02 | FR-03 | Load style pack and enforce supported asset types | automated | incompatible asset/style combinations are rejected with typed error |
| AC-03 | FR-04, FR-05 | Browse module library and place torso/head/arm/leg modules into project state | automated | module instances exist with stable ids and transforms |
| AC-04 | FR-06 | Attach compatible modules via connectors | automated | snap succeeds and connector relationship is persisted |
| AC-05 | FR-06 | Attempt incompatible connector attach | automated | validation fails with connector error code |
| AC-06 | FR-07 | Mirror a left-arm module to create a right-arm pair | automated | mirrored module created with expected metadata |
| AC-07 | FR-08 | Apply chest bulge and jaw width changes to authored regions | automated | values persist, clamp correctly, and affect normalized scene payload |
| AC-08 | FR-09 | Assign material zones using a palette from the style pack | automated | zone assignments persist and validate |
| AC-09 | FR-10 | Apply a fill layer and one decal layer | automated | paint layer model persists and report reflects usage |
| AC-10 | FR-11, FR-12 | Assign fighter rig template and add `weapon_r` socket | automated | metadata exists and validation passes |
| AC-11 | FR-13, FR-14, FR-15 | Export example fighter to GLB and emit report | automated | both files generated; report has no fatal errors |
| AC-12 | FR-14 | Exceed triangle or texture budget in a negative fixture | automated | validator blocks export with budget error |
| AC-13 | FR-16 | Preview and apply a structured edit command sequence | automated | preview yields diff; apply mutates project; undo payload exists |
| AC-14 | FR-17 | Submit invalid command DSL payload | automated | rejected with typed command validation errors |
| AC-15 | NFR-01 | Re-run export on same fixture | automated | outputs are byte-stable or metadata-stable as defined |
| AC-16 | NFR-02 | Run validation and export from CLI in headless CI | automated | commands succeed in clean container |
| AC-17 | NFR-06 | Surface validator errors in plugin state model | automated | controller state includes actionable error data |
| AC-18 | Host smoke | Load built plugin and execute one example export via host | manual smoke | plugin loads and a user can reach export path once |

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

### TypeScript
- `plugin/src/tests/project-controller.spec.ts`
- `plugin/src/tests/module-browser-controller.spec.ts`
- `plugin/src/tests/assembly-controller.spec.ts`
- `plugin/src/tests/deformation-controller.spec.ts`
- `plugin/src/tests/material-controller.spec.ts`
- `plugin/src/tests/validation-panel-state.spec.ts`
- `plugin/src/tests/bridge.spec.ts`

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

## 5. Pass/fail rules

### Pass
- scenario behaves exactly as required
- errors are typed and useful
- snapshots match expected outputs
- deterministic outputs remain stable

### Fail
- silent fallback occurs
- export succeeds despite fatal validation issues
- command apply mutates state without preview/undo support
- host-specific assumptions leak into headless tests
- acceptance scenario is only “manually verified” when it should be automated

## 6. Manual smoke checklist (thin)

1. install or load plugin into Blockbench
2. open canonical fighter example
3. confirm module browser appears
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
