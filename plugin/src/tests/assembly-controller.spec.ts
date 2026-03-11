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
});
