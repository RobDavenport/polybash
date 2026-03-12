import { describe, expect, it } from "vitest";
import { AssemblyController } from "../controllers/assemblyController";
import { Store } from "../state/store";
import { loadProjectFixture } from "./helpers";

describe("AssemblyController", () => {
  it("adds a module and persists connector attachment", () => {
    const store = new Store();
    store.patch({ project: loadProjectFixture() });
    const controller = new AssemblyController(store);

    const module = controller.addModule("weapon_sword_basic", "weapon_99");
    controller.attachModule("weapon_99", "grip", "arm_r_01", "hand_socket_r");

    expect(module.instanceId).toBe("weapon_99");
    const project = store.getState().project;
    expect(project?.modules.find((candidate) => candidate.instanceId === "weapon_99")?.connectorAttachments[0])
      .toEqual({
        localConnector: "grip",
        targetInstanceId: "arm_r_01",
        targetConnector: "hand_socket_r"
      });
  });

  it("mirrors a left-side module into a right-side pair", () => {
    const store = new Store();
    const project = loadProjectFixture();
    project.modules = project.modules.filter((candidate) => candidate.instanceId !== "arm_r_01");
    store.patch({ project });
    const controller = new AssemblyController(store);

    const mirrored = controller.mirrorModule("arm_l_01");

    expect(mirrored.instanceId).toBe("arm_r_01");
    expect(mirrored.moduleId).toBe("fighter_arm_base_r");
    expect(mirrored.transform.position).toEqual([0.6, 1.2, 0]);
    expect(mirrored.materialSlots).toEqual({ primary: "cloth_red", trim: "metal_dark" });
    expect(mirrored.regionParams).toEqual({ arm_width: 0.02 });
  });

  it("builds a basic fighter assembly with stable ids and default transforms", () => {
    const store = new Store();
    store.patch({
      project: {
        version: 1,
        id: "fighter_build_01",
        assetType: "character",
        stylePackId: "zx_fighter_v1",
        skeletonTemplate: "biped_fighter_v1",
        modules: [],
        paintLayers: [],
        rig: null,
        declaredMetrics: {
          triangles: 0,
          materials: 0,
          textures: 0,
          atlasWidth: 0,
          atlasHeight: 0,
          bones: 0,
          sockets: 0
        }
      }
    });
    const controller = new AssemblyController(store);

    controller.addModule("fighter_torso_base_a", "torso_01");
    controller.addModule("fighter_head_base_a", "head_01");
    controller.addModule("fighter_arm_base_l", "arm_l_01");
    controller.addModule("fighter_leg_base_l", "leg_l_01");

    expect(store.getState().project?.modules.map((module) => module.instanceId)).toEqual([
      "torso_01",
      "head_01",
      "arm_l_01",
      "leg_l_01"
    ]);
    expect(store.getState().project?.modules.every((module) => module.transform.scale[0] === 1)).toBe(
      true
    );
  });
});
