import { describe, expect, it } from "vitest";
import {
  resolveMaterialSelectValue,
  type PendingMaterialPreview
} from "./materialPreviewState";

function buildPendingPreview(
  overrides: Partial<PendingMaterialPreview> = {}
): PendingMaterialPreview {
  return {
    instanceId: "torso_01",
    zone: "trim",
    materialId: "fighter_b",
    successLabel: "Updated trim",
    command: {
      op: "assign_material_zone",
      instanceId: "torso_01",
      zone: "trim",
      materialId: "fighter_b"
    },
    preview: {
      document: {
        project: {
          id: "fighter_basic",
          version: 1,
          assetType: "character",
          stylePackId: "zx_fighter_v1",
          modules: [],
          paintLayers: [],
          declaredMetrics: {
            triangles: 0,
            materials: 0,
            textures: 0,
            atlasWidth: 0,
            atlasHeight: 0,
            bones: 0,
            sockets: 0
          }
        },
        stylePack: {
          id: "zx_fighter_v1",
          version: 1,
          supportedAssetTypes: ["character"],
          budgets: {},
          connectorTaxonomy: {},
          palettes: [],
          rigTemplates: [],
          modules: [],
          decalIds: []
        },
        paths: {
          projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
          stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
          savePath: "out/desktop/fighter_basic.zxmodel.json"
        }
      },
      diff: {
        op: "assign_material_zone",
        target: "torso_01",
        changes: []
      }
    },
    ...overrides
  };
}

describe("materialPreviewState", () => {
  it("uses the pending material when instance and zone match", () => {
    const pendingPreview = buildPendingPreview();

    expect(resolveMaterialSelectValue("torso_01", "trim", "cloth_red", pendingPreview)).toBe(
      "fighter_b"
    );
  });

  it("does not override when the instance id differs", () => {
    const pendingPreview = buildPendingPreview();

    expect(resolveMaterialSelectValue("arm_r_01", "trim", "cloth_red", pendingPreview)).toBe(
      "cloth_red"
    );
  });

  it("does not override when the zone differs", () => {
    const pendingPreview = buildPendingPreview();

    expect(resolveMaterialSelectValue("torso_01", "primary", "cloth_red", pendingPreview)).toBe(
      "cloth_red"
    );
  });

  it("falls back to the persisted material when there is no pending preview", () => {
    expect(resolveMaterialSelectValue("torso_01", "trim", "cloth_red")).toBe("cloth_red");
  });
});
