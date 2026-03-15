import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import {
  buildAddModuleDecalLayerRequest,
  buildAddModuleAndSnapRequest,
  buildSuggestedPlacementAlternativeSummary,
  buildModuleLibrarySelectionFeedback,
  buildPrimarySuggestedPlacementRequest,
  buildRigDetail,
  buildSetFillLayerPaletteRequest,
  buildModuleLibrary,
  buildModuleLibraryAddActionHint,
  buildModuleLibraryAddActionLabel,
  buildModuleLibraryPreview,
  buildModuleLibrarySummary,
  buildModuleCards,
  buildSelectedModuleValidationDetail,
  buildSelectedModuleDetail,
  buildRemoveModuleDecalLayerRequest,
  buildSuggestedPlacementActions,
  buildSuggestedPlacementGroups,
  filterModuleLibrary,
  searchModuleLibrary,
  resolvePrimarySuggestedPlacement,
  resolvePrimarySuggestedPlacementAction,
  resolveSelectedModuleId
} from "./documentInspector";
import type { DesktopDocument, ValidationReport } from "./types";

const documentFixture = {
  project: fighterProject as unknown as DesktopDocument["project"],
  stylePack: fighterStylePack as unknown as DesktopDocument["stylePack"],
  paths: {
    projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
    stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
  }
} satisfies DesktopDocument;

describe("documentInspector", () => {
  it("falls back to the first module when the selection is missing", () => {
    expect(resolveSelectedModuleId(documentFixture, "missing_module")).toBe("torso_01");
  });

  it("builds module cards with deterministic selection state", () => {
    const cards = buildModuleCards(documentFixture, "arm_r_01");
    const selectedCard = cards.find((card) => card.selected);

    expect(cards).toHaveLength(7);
    expect(selectedCard?.instanceId).toBe("arm_r_01");
    expect(selectedCard?.attachmentCount).toBe(1);
  });

  it("exposes style pack modules as an authoring library", () => {
    const library = buildModuleLibrary(documentFixture);
    const sword = library.find((entry) => entry.moduleId === "weapon_sword_basic");

    expect(library).toHaveLength(7);
    expect(sword).toEqual({
      moduleId: "weapon_sword_basic",
      assetType: "weapon",
      connectorCount: 1,
      regionCount: 1,
      materialZoneCount: 2,
      placementCount: 1,
      source: "stylePack"
    });
  });

  it("surfaces descriptor-driven material, connector, region, and paint detail", () => {
    const detail = buildSelectedModuleDetail(documentFixture, "torso_01");

    expect(detail?.moduleId).toBe("fighter_torso_base_a");
    expect(detail?.connectors).toHaveLength(5);
    expect(detail?.connectors[0]).toEqual({
      id: "neck",
      kind: "neck",
      attachment: {
        targetInstanceId: "head_01",
        targetConnector: "neck_socket"
      },
      snapTarget: {
        localConnector: "neck",
        targetInstanceId: "head_01",
        targetConnector: "neck_socket",
        label: "head_01 -> neck_socket"
      },
      compatibleTargets: [
        {
          instanceId: "head_01",
          moduleId: "fighter_head_base_a",
          connectorId: "neck_socket",
          kind: "neck_socket"
        }
      ]
    });
    expect(detail?.materials).toEqual([
      {
        zone: "primary",
        materialId: "cloth_red",
        availableMaterialIds: [
          "cloth_black",
          "cloth_blue",
          "cloth_red",
          "cloth_white",
          "metal_bright",
          "metal_dark",
          "skin_light",
          "skin_tan"
        ]
      },
      {
        zone: "trim",
        materialId: "metal_dark",
        availableMaterialIds: [
          "cloth_black",
          "cloth_blue",
          "cloth_red",
          "cloth_white",
          "metal_bright",
          "metal_dark",
          "skin_light",
          "skin_tan"
        ]
      }
    ]);
    expect(detail?.regions).toEqual([
      {
        id: "chest_bulge",
        current: 0.12,
        min: -0.2,
        max: 0.3,
        utilization: 0.64
      }
    ]);
    expect(detail?.paint).toEqual({
      fills: [
        {
          zone: "primary",
          paletteId: "fighter_a",
          availablePaletteIds: ["fighter_a", "fighter_b"]
        },
        {
          zone: "trim",
          paletteId: undefined,
          availablePaletteIds: ["fighter_a", "fighter_b"]
        }
      ],
      decals: [{ decalId: "dragon_01" }],
      availableDecalIds: ["dragon_01", "badge_01"]
    });
    expect(detail?.paintLayers).toHaveLength(2);
  });

  it("picks a deterministic snap target for unpaired compatible connectors", () => {
    const detail = buildSelectedModuleDetail(documentFixture, "weapon_01");
    const grip = detail?.connectors[0];

    expect(grip?.compatibleTargets.map((target) => `${target.instanceId}::${target.connectorId}`)).toEqual([
      "arm_l_01::hand_socket_l",
      "arm_r_01::hand_socket_r"
    ]);
    expect(grip?.snapTarget).toEqual({
      localConnector: "grip",
      targetInstanceId: "arm_r_01",
      targetConnector: "hand_socket_r",
      label: "arm_r_01 -> hand_socket_r"
    });
  });

  it("builds a selection-ready module preview before placement", () => {
    const preview = buildModuleLibraryPreview(documentFixture, "weapon_sword_basic");

    expect(resolvePrimarySuggestedPlacement(preview)).toEqual({
      localConnector: "grip",
      localKind: "weapon_grip",
      targetInstanceId: "arm_r_01",
      targetModuleId: "fighter_arm_base_r",
      targetConnector: "hand_socket_r",
      targetKind: "hand_socket",
      label: "grip -> arm_r_01::hand_socket_r"
    });
    expect(resolvePrimarySuggestedPlacementAction(preview)).toEqual({
      key: "grip::arm_r_01::hand_socket_r",
      label: "Add and Snap to arm_r_01::hand_socket_r",
      placement: expect.objectContaining({ label: "grip -> arm_r_01::hand_socket_r" })
    });
    expect(buildAddModuleAndSnapRequest("weapon_sword_basic", resolvePrimarySuggestedPlacementAction(preview)!)).toEqual({
      moduleId: "weapon_sword_basic",
      localConnector: "grip",
      targetInstanceId: "arm_r_01",
      targetConnector: "hand_socket_r"
    });
    expect(buildPrimarySuggestedPlacementRequest("weapon_sword_basic", preview)).toEqual({
      moduleId: "weapon_sword_basic",
      localConnector: "grip",
      targetInstanceId: "arm_r_01",
      targetConnector: "hand_socket_r"
    });
    expect(buildModuleLibraryAddActionLabel(preview)).toBe("Add Without Snapping");
    expect(buildModuleLibraryAddActionHint(preview)).toBe(
      "Manual fallback: add at the default position without snapping."
    );
    expect(buildModuleLibraryAddActionLabel({ ...preview!, suggestedPlacements: [] })).toBe(
      "Add Selected Module"
    );
    expect(buildModuleLibraryAddActionHint({ ...preview!, suggestedPlacements: [] })).toBeUndefined();
    expect(buildSuggestedPlacementActions(preview).map((action) => action.label)).toEqual([
      "Add and Snap to arm_r_01::hand_socket_r",
      "Add and Snap to arm_l_01::hand_socket_l"
    ]);
    expect(buildSuggestedPlacementAlternativeSummary(preview)).toEqual({
      actionCount: 1,
      connectorCount: 1,
      label: "1 alternative target across 1 connector"
    });
    expect(buildSuggestedPlacementGroups(preview)).toEqual([
      {
        localConnector: "grip",
        localKind: "weapon_grip",
        actions: [
          {
            key: "grip::arm_l_01::hand_socket_l",
            label: "Add and Snap to arm_l_01::hand_socket_l",
            placement: expect.objectContaining({ label: "grip -> arm_l_01::hand_socket_l" })
          }
        ]
      }
    ]);
    const selectedDetail = buildSelectedModuleDetail(documentFixture, "weapon_01");
    expect(buildModuleLibrarySelectionFeedback(preview, selectedDetail)).toBe(
      "Selected in scene: weapon_01"
    );
    expect(preview).toEqual({
      moduleId: "weapon_sword_basic",
      assetType: "weapon",
      connectorCount: 1,
      regionCount: 1,
      materialZoneCount: 2,
      placementCount: 1,
      placedInstanceIds: ["weapon_01"],
      source: "stylePack",
      connectors: [{ id: "grip", kind: "weapon_grip" }],
      materialZones: ["blade", "handle"],
      regionIds: ["blade_length"],
      sourceAsset: undefined,
      silhouette: {
        width: 0.14,
        height: 1.28,
        depth: 0.1,
        dominantAxis: "y"
      },
      placementHint: "Snaps to fighter hand sockets and works best as a right-hand starter weapon.",
      suggestedPlacements: [
        {
          localConnector: "grip",
          localKind: "weapon_grip",
          targetInstanceId: "arm_r_01",
          targetModuleId: "fighter_arm_base_r",
          targetConnector: "hand_socket_r",
          targetKind: "hand_socket",
          label: "grip -> arm_r_01::hand_socket_r"
        },
        {
          localConnector: "grip",
          localKind: "weapon_grip",
          targetInstanceId: "arm_l_01",
          targetModuleId: "fighter_arm_base_l",
          targetConnector: "hand_socket_l",
          targetKind: "hand_socket",
          label: "grip -> arm_l_01::hand_socket_l"
        }
      ]
    });
  });

  it("classifies edited built-in modules as authored for browser filtering", () => {
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
    const inUseOnly = filterModuleLibrary(library, "inUse");
    const preview = buildModuleLibraryPreview(authoredDocument, "fighter_head_base_a", ["fighter_head_base_a"]);

    expect(summary).toEqual({ total: 7, stylePack: 6, imported: 0, authored: 1, inUse: 7 });
    expect(authoredOnly.map((entry) => entry.moduleId)).toEqual(["fighter_head_base_a"]);
    expect(inUseOnly).toHaveLength(7);
    expect(preview?.source).toBe("authored");
    expect(preview?.placementCount).toBe(1);
    expect(preview?.placedInstanceIds).toEqual(["head_01"]);
    expect(buildSuggestedPlacementActions(preview).map((action) => action.label)).toEqual([
      "Add and Snap to torso_01::neck"
    ]);
    expect(buildSuggestedPlacementAlternativeSummary(preview)).toBeUndefined();
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

  it("supports searching reusable library entries by module id, source, and usage", () => {
    const importedDocument: DesktopDocument = {
      ...documentFixture,
      stylePack: {
        ...documentFixture.stylePack,
        modules: [
          ...documentFixture.stylePack.modules,
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

    const library = buildModuleLibrary(importedDocument, ["fighter_head_base_a"]);

    expect(searchModuleLibrary(library, "head").map((entry) => entry.moduleId)).toEqual([
      "fighter_head_base_a"
    ]);
    expect(searchModuleLibrary(library, "imported").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
    expect(searchModuleLibrary(library, "neck_socket").map((entry) => entry.moduleId)).toEqual([
      "fighter_head_base_a"
    ]);
    expect(searchModuleLibrary(library, "bands").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
    expect(searchModuleLibrary(library, "prop_crate_round_a.glb").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
    expect(searchModuleLibrary(library, "weapon_01").map((entry) => entry.moduleId)).toEqual([
      "weapon_sword_basic"
    ]);
    expect(searchModuleLibrary(library, "in use").map((entry) => entry.moduleId)).toHaveLength(7);
    expect(searchModuleLibrary(library, "unused").map((entry) => entry.moduleId)).toEqual([
      "prop_crate_round_a"
    ]);
  });

  it("surfaces imported source asset metadata in the module browser preview", () => {
    const importedDocument: DesktopDocument = {
      ...documentFixture,
      stylePack: {
        ...documentFixture.stylePack,
        modules: [
          ...documentFixture.stylePack.modules,
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

    const library = buildModuleLibrary(importedDocument);
    const summary = buildModuleLibrarySummary(library);
    const importedOnly = filterModuleLibrary(library, "imported");
    const inUseOnly = filterModuleLibrary(library, "inUse");
    const preview = buildModuleLibraryPreview(importedDocument, "prop_crate_round_a");

    expect(library.find((entry) => entry.moduleId === "prop_crate_round_a")).toMatchObject({
      source: "imported",
      placementCount: 0
    });
    expect(summary).toEqual({ total: 8, stylePack: 7, imported: 1, authored: 0, inUse: 7 });
    expect(importedOnly.map((entry) => entry.moduleId)).toEqual(["prop_crate_round_a"]);
    expect(inUseOnly).toHaveLength(7);
    expect(preview?.source).toBe("imported");
    expect(preview?.placementCount).toBe(0);
    expect(preview?.placedInstanceIds).toEqual([]);
    expect(preview?.sourceAsset).toEqual({
      path: "fixtures/imports/assets/prop_crate_round_a.glb",
      format: "glb"
    });
  });


  it("surfaces selected placed-instance feedback for repeated module placements", () => {
    const weapon = documentFixture.project.modules.find((module) => module.instanceId === "weapon_01");
    if (!weapon) {
      throw new Error("expected weapon fixture instance");
    }

    const updatedDocument: DesktopDocument = {
      ...documentFixture,
      project: {
        ...documentFixture.project,
        modules: [
          ...documentFixture.project.modules,
          {
            ...weapon,
            instanceId: "weapon_02",
            connectorAttachments: [
              {
                localConnector: "grip",
                targetInstanceId: "arm_l_01",
                targetConnector: "hand_socket_l"
              }
            ]
          }
        ]
      }
    };

    const preview = buildModuleLibraryPreview(updatedDocument, "weapon_sword_basic");
    const selectedDetail = buildSelectedModuleDetail(updatedDocument, "weapon_02");

    expect(preview?.placementCount).toBe(2);
    expect(preview?.placedInstanceIds).toEqual(["weapon_01", "weapon_02"]);
    expect(buildModuleLibrarySelectionFeedback(preview, selectedDetail)).toBe(
      "Selected in scene: weapon_02 (2 placed)"
    );
  });
  it("projects selected-module validation issues and project-level issues for the inspector", () => {
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
          code: "module_transform_warning",
          severity: "warning",
          path: "/modules/0",
          summary: "Torso scale is outside the starter envelope.",
          detail: "Large torso scaling can break snap assumptions."
        },
        {
          code: "stylepack_missing",
          severity: "error",
          path: "/stylePackId",
          summary: "Style pack id is missing.",
          detail: "Choose a style pack before validation.",
          suggestedFix: "Reload the fighter style pack."
        },
        {
          code: "other_module_issue",
          severity: "error",
          path: "/modules/1/materialSlots/skin",
          summary: "Head skin is invalid.",
          detail: "This issue belongs to another module."
        }
      ]
    };

    const detail = buildSelectedModuleValidationDetail(report, documentFixture, "torso_01");

    expect(detail).toEqual({
      instanceId: "torso_01",
      moduleId: "fighter_torso_base_a",
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
          code: "module_transform_warning",
          severity: "warning",
          path: "/modules/0",
          summary: "Torso scale is outside the starter envelope.",
          detail: "Large torso scaling can break snap assumptions."
        }
      ],
      projectIssues: [
        {
          code: "stylepack_missing",
          severity: "error",
          path: "/stylePackId",
          summary: "Style pack id is missing.",
          detail: "Choose a style pack before validation.",
          suggestedFix: "Reload the fighter style pack."
        }
      ]
    });
  });

  it("builds Rust bridge paint payloads with stable desktop shapes", () => {
    expect(buildSetFillLayerPaletteRequest("trim", "fighter_b")).toEqual({
      zone: "trim",
      paletteId: "fighter_b"
    });
    expect(buildSetFillLayerPaletteRequest("trim", "")).toEqual({
      zone: "trim",
      paletteId: null
    });
    expect(buildAddModuleDecalLayerRequest("torso_01", "badge_01")).toEqual({
      instanceId: "torso_01",
      decalId: "badge_01"
    });
    expect(buildRemoveModuleDecalLayerRequest("torso_01", "dragon_01")).toEqual({
      instanceId: "torso_01",
      decalId: "dragon_01"
    });
  });

  it("projects paint detail from bridge-owned document state", () => {
    const updatedDocument: DesktopDocument = {
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
    const detail = buildSelectedModuleDetail(updatedDocument, "torso_01");

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
    expect(updatedDocument.project.paintLayers).toEqual([
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

  it("surfaces rig template and socket detail for the desktop workflow", () => {
    const rig = buildRigDetail(documentFixture);

    expect(rig.templateId).toBe("biped_fighter_v1");
    expect(rig.availableTemplates).toEqual([
      {
        id: "biped_fighter_v1",
        requiredBones: ["root", "spine", "neck", "hand_r"],
        defaultSockets: ["weapon_r"]
      }
    ]);
    expect(rig.sockets).toEqual([{ name: "weapon_r", bone: "hand_r" }]);
  });
});








