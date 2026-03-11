import { describe, expect, it } from "vitest";
import { RigController } from "../controllers/rigController";
import { Store } from "../state/store";
import { loadProjectFixture } from "./helpers";

describe("RigController", () => {
  it("assigns a rig template and attaches a socket", () => {
    const store = new Store();
    store.patch({ project: loadProjectFixture() });
    const controller = new RigController(store);

    controller.assignRigTemplate("biped_fighter_v1");
    controller.attachSocket("weapon_r", "hand_r");

    expect(store.getState().project?.rig?.templateId).toBe("biped_fighter_v1");
    expect(store.getState().project?.rig?.sockets).toContainEqual({
      name: "weapon_r",
      bone: "hand_r"
    });
  });
});
