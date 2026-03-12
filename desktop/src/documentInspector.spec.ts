import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import {
  buildAddModuleDecalLayerRequest,
  buildRigDetail,
  buildSetFillLayerPaletteRequest,
  buildModuleLibrary,
  buildModuleCards,
  buildSelectedModuleDetail,
  buildRemoveModuleDecalLayerRequest,
  resolveSelectedModuleId
} from "./documentInspector";
import type { DesktopDocument } from "./types";

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
      materialZoneCount: 2
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
