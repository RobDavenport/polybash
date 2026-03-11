import { describe, expect, it } from "vitest";
import { MaterialController } from "../controllers/materialController";
import { Store } from "../state/store";
import { loadProjectFixture } from "./helpers";

describe("MaterialController", () => {
  it("assigns material zones and creates fill and decal layers", () => {
    const store = new Store();
    store.patch({ project: loadProjectFixture() });
    const controller = new MaterialController(store);

    controller.assignMaterialZone("torso_01", "primary", "cloth_blue");
    const fillLayer = controller.addFillLayer("primary", "fighter_b");
    const decalLayer = controller.addDecalLayer("torso_01", "stripe_white");

    expect(fillLayer).toEqual({ type: "fill", target: "primary", palette: "fighter_b" });
    expect(decalLayer).toEqual({ type: "decal", target: "torso_01", decalId: "stripe_white" });
    expect(
      store.getState().project?.modules.find((module) => module.instanceId === "torso_01")?.materialSlots
        .primary
    ).toBe("cloth_blue");
    expect(store.getState().project?.paintLayers).toContainEqual(fillLayer);
    expect(store.getState().project?.paintLayers).toContainEqual(decalLayer);
  });
});
