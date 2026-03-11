import { describe, expect, it } from "vitest";
import { ModuleBrowserController } from "../controllers/moduleBrowserController";
import { Store } from "../state/store";
import { loadStylePackFixture } from "./helpers";

describe("ModuleBrowserController", () => {
  it("lists modules from the loaded style pack", () => {
    const store = new Store();
    store.patch({ stylePack: loadStylePackFixture() });
    const controller = new ModuleBrowserController(store);

    const modules = controller.listModules();

    expect(modules.length).toBeGreaterThan(1);
    expect(modules.some((module) => module.id === "fighter_torso_base_a")).toBe(true);
  });
});
