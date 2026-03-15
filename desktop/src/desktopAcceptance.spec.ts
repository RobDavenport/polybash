import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import { buildVisibleHistoryEntries, createHistoryState, pushHistoryEntry, undoHistory } from "./historyState";
import { resolveConnectorSelectValue, resolveRegionSliderValue, resolveRigTemplateValue, resolveTransformInputValue, resolveVisibleSockets, type PendingConnectorPreview, type PendingRegionPreview, type PendingRigTemplatePreview, type PendingSocketPreview, type PendingTransformPreview } from "./materialPreviewState";
import {
  addReusableModuleDraftRegion,
  applyReusableModuleDraft,
  createReusableModuleDraft,
  deleteReusableModule,
  duplicateReusableModule,
  renameReusableModule,
  suggestDuplicateReusableModuleId,
  setReusableModuleDraftMaterialZones,
  updateReusableModuleDraftConnector
} from "./moduleDraft";
import {
  buildAddModuleDecalLayerRequest,
  buildSuggestedPlacementAlternativeSummary,
  buildModuleLibrarySelectionFeedback,
  buildPrimarySuggestedPlacementRequest,
  buildModuleLibraryAddActionHint,
  buildModuleLibraryAddActionLabel,
  buildModuleLibraryPreview,
  buildModuleCards,
  buildModuleLibrary,
  buildModuleLibrarySummary,
  buildRigDetail,
  buildSetFillLayerPaletteRequest,
  buildSelectedModuleValidationDetail,
  buildSelectedModuleDetail,
  buildRemoveModuleDecalLayerRequest,
  buildSuggestedPlacementActions,
  buildSuggestedPlacementGroups,
  filterModuleLibrary,
  resolvePrimarySuggestedPlacementAction,
  searchModuleLibrary,
  resolveSelectedModuleId
} from "./documentInspector";
import type { DesktopDocument, ValidationReport } from "./types";

const documentFixture = {
  project: fighterProject as unknown as DesktopDocument["project"],
  stylePack: fighterStylePack as unknown as DesktopDocument["stylePack"],
  paths: {
    projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
    stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
    savePath: "out/desktop/fighter_basic.zxmodel.json"
  }
} satisfies DesktopDocument;

describe("desktop acceptance evidence", () => {
  it("surfaces the canonical fighter authoring workflow through desktop projections", () => {
    const selectedModuleId = resolveSelectedModuleId(documentFixture, "torso_01");
    const cards = buildModuleCards(documentFixture, selectedModuleId);
    const library = buildModuleLibrary(documentFixture);
    const detail = buildSelectedModuleDetail(documentFixture, selectedModuleId);

    expect(cards.map((card) => card.instanceId)).toEqual([
      "torso_01",
      "head_01",
      "arm_l_01",
      "arm_r_01",
      "leg_l_01",
      "leg_r_01",
      "weapon_01"
    ]);
    expect(library.map((entry) => entry.moduleId)).toEqual([
      "fighter_torso_base_a",
      "fighter_head_base_a",
      "fighter_arm_base_l",
      "fighter_arm_base_r",
      "fighter_leg_base_l",
      "fighter_leg_base_r",
      "weapon_sword_basic"
    ]);
    expect(detail?.connectors.map((connector) => connector.id)).toEqual([
      "neck",
      "arm_l",
      "arm_r",
      "leg_l",
      "leg_r"
    ]);
  });

  it("surfaces rig metadata and actionable inspector data for the standalone shell", () => {
    const detail = buildSelectedModuleDetail(documentFixture, "torso_01");
    const rig = buildRigDetail(documentFixture);

    expect(detail?.materials.map((material) => material.zone)).toEqual(["primary", "trim"]);
    expect(detail?.regions.map((region) => region.id)).toEqual(["chest_bulge"]);
    expect(rig.templateId).toBe("biped_fighter_v1");
    expect(rig.sockets).toEqual([{ name: "weapon_r", bone: "hand_r" }]);
  });

  it("supports a minimal desktop paint and decal authoring workflow through bridge payloads", () => {
    const fillCommand = buildSetFillLayerPaletteRequest("trim", "fighter_b");
    const addDecalCommand = buildAddModuleDecalLayerRequest("torso_01", "badge_01");
    const removeDecalCommand = buildRemoveModuleDecalLayerRequest("torso_01", "dragon_01");
    const updated: DesktopDocument = {
      ...documentFixture,
      project: {
        ...documentFixture.project,
        paintLayers: [
          {
            type: "fill",
            target: "primary",
            palette: "fighter_a"
          },
          {
            type: "fill",
            target: "trim",
            palette: "fighter_b"
          },
          {
            type: "decal",
            target: "torso_01",
            decalId: "badge_01"
          }
        ]
      }
    };
    const detail = buildSelectedModuleDetail(updated, "torso_01");

    expect(fillCommand).toEqual({
      zone: "trim",
      paletteId: "fighter_b"
    });
    expect(addDecalCommand).toEqual({
      instanceId: "torso_01",
      decalId: "badge_01"
    });
    expect(removeDecalCommand).toEqual({
      instanceId: "torso_01",
      decalId: "dragon_01"
    });
    expect(detail?.paint.fills).toEqual([
      {
        zone: "primary",
        paletteId: "fighter_a",
        availablePaletteIds: ["fighter_a", "fighter_b"]
      },
      {
        zone: "trim",
        paletteId: "fighter_b",
        availablePaletteIds: ["fighter_a", "fighter_b"]
      }
    ]);
    expect(detail?.paint.decals).toEqual([{ decalId: "badge_01" }]);
    expect(updated.project.paintLayers).toEqual([
      {
        type: "fill",
        target: "primary",
        palette: "fighter_a"
      },
      {
        type: "fill",
        target: "trim",
        palette: "fighter_b"
      },
      {
        type: "decal",
        target: "torso_01",
        decalId: "badge_01"
      }
    ]);
  });



  it("surfaces module preview evidence before placement in the desktop browser", () => {
    const library = buildModuleLibrary(documentFixture);
    const preview = buildModuleLibraryPreview(documentFixture, "fighter_head_base_a");

    expect(library.map((entry) => entry.moduleId)).toContain("fighter_head_base_a");
    expect(preview?.connectors).toEqual([{ id: "neck_socket", kind: "neck_socket" }]);
    expect(preview?.materialZones).toEqual(["skin", "trim"]);
    expect(preview?.regionIds).toEqual(["jaw_width"]);
    expect(preview?.placementHint).toBe("Snaps onto torso neck sockets and is a good first placement after a torso.");
    expect(buildModuleLibraryAddActionLabel(preview)).toBe("Add Without Snapping");
    expect(buildModuleLibraryAddActionHint(preview)).toBe(
      "Manual fallback: add at the default position without snapping."
    );
    expect(resolvePrimarySuggestedPlacementAction(preview)).toEqual({
      key: "neck_socket::torso_01::neck",
      label: "Add and Snap to torso_01::neck",
      placement: expect.objectContaining({ label: "neck_socket -> torso_01::neck" })
    });
    expect(buildPrimarySuggestedPlacementRequest("fighter_head_base_a", preview)).toEqual({
      moduleId: "fighter_head_base_a",
      localConnector: "neck_socket",
      targetInstanceId: "torso_01",
      targetConnector: "neck"
    });
    expect(buildSuggestedPlacementActions(preview).map((action) => action.label)).toEqual([
      "Add and Snap to torso_01::neck"
    ]);
    expect(buildSuggestedPlacementAlternativeSummary(preview)).toBeUndefined();
    expect(
      buildModuleLibrarySelectionFeedback(preview, buildSelectedModuleDetail(documentFixture, "head_01"))
    ).toBe("Selected in scene: head_01");
    expect(buildSuggestedPlacementGroups(preview)).toEqual([]);
    expect(preview?.suggestedPlacements).toEqual([
      {
        localConnector: "neck_socket",
        localKind: "neck_socket",
        targetInstanceId: "torso_01",
        targetModuleId: "fighter_torso_base_a",
        targetConnector: "neck",
        targetKind: "neck",
        label: "neck_socket -> torso_01::neck"
      }
    ]);
  });



  it("supports browsing authored reusable modules separately from untouched style-pack entries", () => {
    const authoredDocument: DesktopDocument = {
      ...documentFixture,
      stylePack: {
        ...documentFixture.stylePack,
        modules: documentFixture.stylePack.modules.map((module) =>
          module.id === "fighter_head_base_a"
            ? { ...module, materialZones: ["skin", "trim", "accent"] }
            : module
        )
      }
    };
    const library = buildModuleLibrary(authoredDocument, ["fighter_head_base_a"]);
    const summary = buildModuleLibrarySummary(library);
    const authoredOnly = filterModuleLibrary(library, "authored");
    const preview = buildModuleLibraryPreview(authoredDocument, "fighter_head_base_a", ["fighter_head_base_a"]);

    expect(summary).toEqual({ total: 7, stylePack: 6, imported: 0, authored: 1, inUse: 7 });
    expect(authoredOnly.map((entry) => entry.moduleId)).toEqual(["fighter_head_base_a"]);
    expect(preview?.source).toBe("authored");
  });
  it("supports searching reusable browser entries by source, metadata, and current usage", () => {
    const duplicated = duplicateReusableModule(
      documentFixture,
      "fighter_head_base_a",
      "fighter_head_variant_a"
    );
    const importedDocument: DesktopDocument = {
      ...duplicated!.document,
      stylePack: {
        ...duplicated!.document.stylePack,
        modules: [
          ...duplicated!.document.stylePack.modules,
          {
            id: "prop_crate_round_a",
            assetType: "prop_small",
            connectors: [],
            regions: [{ id: "crate_width", min: -0.08, max: 0.12 }],
            materialZones: ["body", "bands"],
            sourceAsset: {
              path: "fixtures/imports/assets/prop_crate_round_a.glb",
              format: "glb"
            }
          }
        ]
      }
    };
    const library = buildModuleLibrary(importedDocument, [duplicated!.duplicateId]);

    expect(searchModuleLibrary(library, "authored").map((entry) => entry.moduleId)).toEqual([
      "fighter_head_variant_a"
    ]);
    expect(searchModuleLibrary(library, "imported").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
    expect(searchModuleLibrary(library, "neck_socket").map((entry) => entry.moduleId)).toEqual([
      "fighter_head_base_a",
      "fighter_head_variant_a"
    ]);
    expect(searchModuleLibrary(library, "prop_crate_round_a.glb").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
    expect(searchModuleLibrary(library, "weapon_01").map((entry) => entry.moduleId)).toEqual([
      "weapon_sword_basic"
    ]);
    expect(searchModuleLibrary(library, "in use").some((entry) => entry.moduleId === "fighter_head_variant_a")).toBe(false);
  });

  it("supports browsing imported reusable modules separately from bundled library entries", () => {
    const importedDocument: DesktopDocument = {
      ...documentFixture,
      stylePack: {
        ...documentFixture.stylePack,
        modules: [
          ...documentFixture.stylePack.modules,
          {
            id: "fighter_shoulder_guard_a",
            assetType: "character",
            connectors: [{ id: "shoulder_plug", kind: "arm_plug" }],
            regions: [{ id: "flare_width", min: -0.08, max: 0.12 }],
            materialZones: ["primary", "trim"],
            sourceAsset: {
              path: "fixtures/imports/valid/fighter_shoulder_guard_a.glb",
              format: "glb"
            }
          }
        ]
      }
    };
    const library = buildModuleLibrary(importedDocument);
    const summary = buildModuleLibrarySummary(library);
    const importedOnly = filterModuleLibrary(library, "imported");
    const stylePackOnly = filterModuleLibrary(library, "stylePack");
    const preview = buildModuleLibraryPreview(importedDocument, "fighter_shoulder_guard_a");

    expect(summary).toEqual({ total: 8, stylePack: 7, imported: 1, authored: 0, inUse: 7 });
    expect(importedOnly.map((entry) => entry.moduleId)).toEqual(["fighter_shoulder_guard_a"]);
    expect(stylePackOnly).toHaveLength(7);
    expect(preview?.source).toBe("imported");
  });
  it("surfaces authored reusable module metadata back through the browser preview", () => {
    const draft = createReusableModuleDraft(documentFixture, "fighter_head_base_a");
    expect(draft).toBeDefined();

    const updated = applyReusableModuleDraft(
      documentFixture,
      setReusableModuleDraftMaterialZones(
        addReusableModuleDraftRegion(
          updateReusableModuleDraftConnector(draft!, "neck_socket", {
            id: "neck_socket_top"
          }),
          {
            id: "brow_height",
            min: -0.1,
            max: 0.12
          }
        ),
        ["skin", "trim", "accent"]
      )
    );
    const preview = buildModuleLibraryPreview(updated, "fighter_head_base_a");

    expect(preview?.connectors).toEqual([{ id: "neck_socket_top", kind: "neck_socket" }]);
    expect(preview?.regionIds).toEqual(["jaw_width", "brow_height"]);
    expect(preview?.materialZones).toEqual(["skin", "trim", "accent"]);
  });

  it("supports duplicating a reusable module into a new authored browser entry", () => {
    const duplicated = duplicateReusableModule(documentFixture, "fighter_head_base_a");
    expect(duplicated).toBeDefined();

    const library = buildModuleLibrary(duplicated!.document, [duplicated!.duplicateId]);
    const summary = buildModuleLibrarySummary(library);
    const authoredOnly = filterModuleLibrary(library, "authored");
    const preview = buildModuleLibraryPreview(
      duplicated!.document,
      duplicated!.duplicateId,
      [duplicated!.duplicateId]
    );

    expect(duplicated!.duplicateId).toBe("fighter_head_base_a_copy_01");
    expect(summary).toEqual({ total: 8, stylePack: 7, imported: 0, authored: 1, inUse: 7 });
    expect(authoredOnly.map((entry) => entry.moduleId)).toEqual(["fighter_head_base_a_copy_01"]);
    expect(preview?.source).toBe("authored");
    expect(preview?.connectors).toEqual([{ id: "neck_socket", kind: "neck_socket" }]);
    expect(preview?.regionIds).toEqual(["jaw_width"]);
  });

  it("keeps previewed transform values visible before the desktop shell applies them", () => {
    const pendingPreview: PendingTransformPreview = {
      kind: "transform",
      instanceId: "weapon_01",
      field: "position",
      value: [0.25, 1.4, 0.1],
      successLabel: "Updated position",
      command: {
        op: "set_transform",
        instanceId: "weapon_01",
        field: "position",
        value: [0.25, 1.4, 0.1]
      },
      preview: {
        document: documentFixture,
        diff: {
          op: "set_transform",
          target: "weapon_01",
          changes: [
            {
              path: "/modules/6/transform/position",
              before: { kind: "vector3", value: [0, 1.1, 0] },
              after: { kind: "vector3", value: [0.25, 1.4, 0.1] }
            }
          ]
        }
      }
    };

    expect(resolveTransformInputValue("weapon_01", "position", "x", 0, pendingPreview)).toBe(0.25);
    expect(resolveTransformInputValue("weapon_01", "position", "y", 1.1, pendingPreview)).toBe(1.4);
    expect(resolveTransformInputValue("weapon_01", "position", "z", 0, pendingPreview)).toBe(0.1);
  });
  it("keeps previewed region values visible before the desktop shell applies them", () => {
    const pendingPreview: PendingRegionPreview = {
      kind: "region",
      instanceId: "torso_01",
      region: "chest_bulge",
      value: 0.24,
      successLabel: "Updated chest_bulge",
      command: {
        op: "set_region_param",
        instanceId: "torso_01",
        region: "chest_bulge",
        value: 0.24
      },
      preview: {
        document: documentFixture,
        diff: {
          op: "set_region_param",
          target: "torso_01",
          changes: [
            {
              path: "/modules/0/regionParams/chest_bulge",
              before: { kind: "scalar", value: 0.12 },
              after: { kind: "scalar", value: 0.24 }
            }
          ]
        }
      }
    };

    expect(resolveRegionSliderValue("torso_01", "chest_bulge", 0.12, pendingPreview)).toBe(0.24);
  });
  it("keeps previewed rig template values visible before the desktop shell applies them", () => {
    const pendingPreview: PendingRigTemplatePreview = {
      kind: "rig_template",
      templateId: "biped_fighter_v2",
      successLabel: "Assigned biped_fighter_v2",
      command: {
        op: "assign_rig_template",
        templateId: "biped_fighter_v2"
      },
      preview: {
        document: documentFixture,
        diff: {
          op: "assign_rig_template",
          target: "project.rig",
          changes: [
            {
              path: "/rig/templateId",
              before: { kind: "text", value: "biped_fighter_v1" },
              after: { kind: "text", value: "biped_fighter_v2" }
            }
          ]
        }
      }
    };

    expect(resolveRigTemplateValue("biped_fighter_v1", pendingPreview)).toBe("biped_fighter_v2");
  });
  it("keeps previewed socket attachments visible before the desktop shell applies them", () => {
    const pendingPreview: PendingSocketPreview = {
      kind: "socket",
      name: "shield_l",
      bone: "hand_l",
      successLabel: "Attached shield_l",
      command: {
        op: "attach_socket",
        name: "shield_l",
        bone: "hand_l"
      },
      preview: {
        document: documentFixture,
        diff: {
          op: "attach_socket",
          target: "project.rig.sockets.shield_l",
          changes: [
            {
              path: "/rig/sockets/1",
              before: { kind: "missing" },
              after: { kind: "text", value: "shield_l@hand_l" }
            }
          ]
        }
      }
    };

    expect(resolveVisibleSockets([{ name: "weapon_r", bone: "hand_r" }], pendingPreview)).toEqual([
      { name: "weapon_r", bone: "hand_r" },
      { name: "shield_l", bone: "hand_l" }
    ]);
  });

  it("keeps previewed connector attachments visible before the desktop shell applies them", () => {
    const pendingPreview: PendingConnectorPreview = {
      kind: "connector",
      instanceId: "torso_01",
      localConnector: "neck",
      targetInstanceId: "weapon_01",
      targetConnector: "grip",
      successLabel: "Attached neck",
      command: {
        op: "set_connector_attachment",
        instanceId: "torso_01",
        localConnector: "neck",
        targetInstanceId: "weapon_01",
        targetConnector: "grip"
      },
      preview: {
        document: documentFixture,
        diff: {
          op: "set_connector_attachment",
          target: "torso_01",
          changes: [
            {
              path: "/modules/0/connectorAttachments/neck",
              before: { kind: "text", value: "head_01::neck_socket" },
              after: { kind: "text", value: "weapon_01::grip" }
            }
          ]
        }
      }
    };

    expect(
      resolveConnectorSelectValue(
        "torso_01",
        "neck",
        { targetInstanceId: "head_01", targetConnector: "neck_socket" },
        pendingPreview
      )
    ).toBe("weapon_01::grip");
  });
  it("supports visible undo and redo history evidence for the desktop shell", () => {
    const beforeCreate = {
      ...documentFixture,
      project: {
        ...documentFixture.project,
        id: "before_create"
      }
    };
    const afterCreate = {
      ...documentFixture,
      project: {
        ...documentFixture.project,
        id: "after_create"
      }
    };
    const afterMove = {
      ...documentFixture,
      project: {
        ...documentFixture.project,
        id: "after_move"
      }
    };
    const history = pushHistoryEntry(createHistoryState(), "Created fighter", {
      projectId: beforeCreate.project.id,
      projectPath: beforeCreate.paths.projectPath,
      stylePackPath: beforeCreate.paths.stylePackPath,
      savePath: beforeCreate.paths.savePath ?? "",
      selectedModuleId: "torso_01",
      document: beforeCreate
    });
    const withMove = pushHistoryEntry(history, "Moved torso", {
      projectId: afterCreate.project.id,
      projectPath: afterCreate.paths.projectPath,
      stylePackPath: afterCreate.paths.stylePackPath,
      savePath: afterCreate.paths.savePath ?? "",
      selectedModuleId: "torso_01",
      document: afterCreate
    });
    const undone = undoHistory(withMove, {
      projectId: afterMove.project.id,
      projectPath: afterMove.paths.projectPath,
      stylePackPath: afterMove.paths.stylePackPath,
      savePath: afterMove.paths.savePath ?? "",
      selectedModuleId: "torso_01",
      document: afterMove
    });

    expect(buildVisibleHistoryEntries(undone.history)).toEqual([
      { label: "Created fighter", direction: "undo" },
      { label: "Moved torso", direction: "redo" }
    ]);
  });

  it("surfaces actionable validation detail for the selected module in desktop projections", () => {
    const report: ValidationReport = {
      status: "error",
      stats: {
        moduleCount: 7,
        triangles: 240,
        materials: 3,
        textures: 1
      },
      issues: [
        {
          code: "module_missing_material",
          severity: "error",
          path: "/modules/0/materialSlots/trim",
          summary: "Torso trim is unassigned.",
          detail: "Assign a trim material before export.",
          suggestedFix: "Set trim to metal_dark."
        },
        {
          code: "stylepack_missing",
          severity: "error",
          path: "/stylePackId",
          summary: "Style pack id is missing.",
          detail: "Choose a style pack before validation.",
          suggestedFix: "Reload the fighter style pack."
        }
      ]
    };

    const validationDetail = buildSelectedModuleValidationDetail(report, documentFixture, "torso_01");

    expect(validationDetail?.issues.map((issue) => issue.code)).toEqual(["module_missing_material"]);
    expect(validationDetail?.issues[0]?.suggestedFix).toBe("Set trim to metal_dark.");
    expect(validationDetail?.projectIssues).toEqual([
      expect.objectContaining({
        code: "stylepack_missing",
        suggestedFix: "Reload the fighter style pack."
      })
    ]);
  });});








