import { describe, expect, it } from "vitest";
import { DeformationController } from "../controllers/deformationController";
import { Store } from "../state/store";
import { loadProjectFixture } from "./helpers";

describe("DeformationController", () => {
  it("updates a region parameter on the selected instance", () => {
    const store = new Store();
    store.patch({ project: loadProjectFixture() });
    const controller = new DeformationController(store);

    controller.setRegionParam("head_01", "jaw_width", 0.11);

    const project = store.getState().project;
    expect(project?.modules.find((module) => module.instanceId === "head_01")?.regionParams.jaw_width)
      .toBe(0.11);
  });
});
