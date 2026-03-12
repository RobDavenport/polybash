import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import {
  buildAddModuleDecalLayerRequest,
  buildModuleCards,
  buildModuleLibrary,
  buildRigDetail,
  buildSetFillLayerPaletteRequest,
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
});
