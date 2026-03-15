import { describe, expect, it } from "vitest";
import {
  resolveConnectorSelectValue,
  resolveMaterialSelectValue,
  resolveRegionSliderValue,
  resolveRigTemplateValue,
  resolveTransformInputValue,
  resolveVisibleSockets,
  type PendingConnectorPreview,
  type PendingMaterialPreview,
  type PendingRegionPreview,
  type PendingRigTemplatePreview,
  type PendingSocketPreview,
  type PendingTransformPreview
} from "./materialPreviewState";

function buildPreviewDocument() {
  return {
    project: {
      id: "fighter_basic",
      version: 1,
      assetType: "character" as const,
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
      supportedAssetTypes: ["character" as const],
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
  };
}

function buildPendingPreview(
  overrides: Partial<PendingMaterialPreview> = {}
): PendingMaterialPreview {
  return {
    kind: "material",
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
      document: buildPreviewDocument(),
      diff: {
        op: "assign_material_zone",
        target: "torso_01",
        changes: []
      }
    },
    ...overrides
  };
}

function buildPendingRegionPreview(
  overrides: Partial<PendingRegionPreview> = {}
): PendingRegionPreview {
  return {
    kind: "region",
    instanceId: "torso_01",
    region: "chest_bulge",
    value: 0.2,
    successLabel: "Updated chest_bulge",
    command: {
      op: "set_region_param",
      instanceId: "torso_01",
      region: "chest_bulge",
      value: 0.2
    },
    preview: {
      document: buildPreviewDocument(),
      diff: {
        op: "set_region_param",
        target: "torso_01",
        changes: []
      }
    },
    ...overrides
  };
}

function buildPendingRigTemplatePreview(
  overrides: Partial<PendingRigTemplatePreview> = {}
): PendingRigTemplatePreview {
  return {
    kind: "rig_template",
    templateId: "biped_fighter_v2",
    successLabel: "Assigned biped_fighter_v2",
    command: {
      op: "assign_rig_template",
      templateId: "biped_fighter_v2"
    },
    preview: {
      document: buildPreviewDocument(),
      diff: {
        op: "assign_rig_template",
        target: "project.rig",
        changes: []
      }
    },
    ...overrides
  };
}

function buildPendingSocketPreview(
  overrides: Partial<PendingSocketPreview> = {}
): PendingSocketPreview {
  return {
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
      document: buildPreviewDocument(),
      diff: {
        op: "attach_socket",
        target: "project.rig.sockets.shield_l",
        changes: []
      }
    },
    ...overrides
  };
}

function buildPendingConnectorPreview(
  overrides: Partial<PendingConnectorPreview> = {}
): PendingConnectorPreview {
  return {
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
      document: buildPreviewDocument(),
      diff: {
        op: "set_connector_attachment",
        target: "torso_01",
        changes: []
      }
    },
    ...overrides
  };
}

function buildPendingTransformPreview(
  overrides: Partial<PendingTransformPreview> = {}
): PendingTransformPreview {
  return {
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
      document: buildPreviewDocument(),
      diff: {
        op: "set_transform",
        target: "weapon_01",
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

  it("uses the pending transform component when instance, field, and axis match", () => {
    const pendingPreview = buildPendingTransformPreview();

    expect(resolveTransformInputValue("weapon_01", "position", "y", 1, pendingPreview)).toBe(1.4);
  });

  it("does not override transform input values for a different field or instance", () => {
    const pendingPreview = buildPendingTransformPreview();

    expect(resolveTransformInputValue("weapon_01", "rotation", "y", 45, pendingPreview)).toBe(45);
    expect(resolveTransformInputValue("arm_r_01", "position", "y", 0.8, pendingPreview)).toBe(0.8);
  });

  it("does not let a material preview override transform input values", () => {
    const pendingPreview = buildPendingPreview();

    expect(resolveTransformInputValue("torso_01", "position", "x", 0, pendingPreview)).toBe(0);
  });

  it("uses the pending region value when instance and region match", () => {
    const pendingPreview = buildPendingRegionPreview();

    expect(resolveRegionSliderValue("torso_01", "chest_bulge", 0.12, pendingPreview)).toBe(0.2);
  });

  it("does not let transform or material previews override region slider values", () => {
    expect(resolveRegionSliderValue("torso_01", "chest_bulge", 0.12, buildPendingPreview())).toBe(0.12);
    expect(resolveRegionSliderValue("weapon_01", "blade_length", 0.4, buildPendingTransformPreview())).toBe(0.4);
  });

  it("uses the pending rig template when the select is previewing a template change", () => {
    const pendingPreview = buildPendingRigTemplatePreview();

    expect(resolveRigTemplateValue("biped_fighter_v1", pendingPreview)).toBe("biped_fighter_v2");
  });

  it("does not let other preview kinds override the rig template select", () => {
    expect(resolveRigTemplateValue("biped_fighter_v1", buildPendingPreview())).toBe("biped_fighter_v1");
  });

  it("adds the pending socket to the visible rig sockets list", () => {
    const pendingPreview = buildPendingSocketPreview();

    expect(resolveVisibleSockets([{ name: "weapon_r", bone: "hand_r" }], pendingPreview)).toEqual([
      { name: "weapon_r", bone: "hand_r" },
      { name: "shield_l", bone: "hand_l" }
    ]);
  });

  it("does not let non-socket previews change the visible rig sockets list", () => {
    expect(resolveVisibleSockets([{ name: "weapon_r", bone: "hand_r" }], buildPendingPreview())).toEqual([
      { name: "weapon_r", bone: "hand_r" }
    ]);
  });

  it("uses the pending connector attachment when instance and local connector match", () => {
    const pendingPreview = buildPendingConnectorPreview();

    expect(
      resolveConnectorSelectValue(
        "torso_01",
        "neck",
        { targetInstanceId: "head_01", targetConnector: "neck_socket" },
        pendingPreview
      )
    ).toBe("weapon_01::grip");
  });

  it("uses an empty selection when clearing a connector attachment is previewed", () => {
    const pendingPreview = buildPendingConnectorPreview({
      command: {
        op: "clear_connector_attachment",
        instanceId: "torso_01",
        localConnector: "neck"
      },
      targetInstanceId: undefined,
      targetConnector: undefined,
      successLabel: "Cleared neck",
      preview: {
        document: buildPreviewDocument(),
        diff: {
          op: "clear_connector_attachment",
          target: "torso_01",
          changes: []
        }
      }
    });

    expect(
      resolveConnectorSelectValue(
        "torso_01",
        "neck",
        { targetInstanceId: "head_01", targetConnector: "neck_socket" },
        pendingPreview
      )
    ).toBe("");
  });
});