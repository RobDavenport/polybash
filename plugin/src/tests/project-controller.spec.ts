import { describe, expect, it } from "vitest";
import { MockHost } from "../adapters/mockHost";
import { ProjectController } from "../controllers/projectController";
import { Store } from "../state/store";
import { loadProjectFixture, loadStylePackFixture } from "./helpers";

describe("ProjectController", () => {
  it("loads and saves a project through the host adapter", async () => {
    const host = new MockHost();
    const store = new Store();
    const controller = new ProjectController(host, store);

    host.seedFile("fixtures/project.zxmodel.json", JSON.stringify(loadProjectFixture()));
    host.seedFile("fixtures/stylepack.stylepack.json", JSON.stringify(loadStylePackFixture()));

    await controller.openProject("fixtures/project.zxmodel.json");
    await controller.loadStylePack("fixtures/stylepack.stylepack.json");
    const savedPath = await controller.saveProject("out/project.zxmodel.json");

    expect(savedPath).toBe("out/project.zxmodel.json");
    expect(host.snapshot("out/project.zxmodel.json")).toContain('"id": "fighter_basic"');
    expect(store.getState().stylePack?.id).toBe("zx_fighter_v1");
  });

  it("creates a fighter project from template metadata and round-trips it through save/open", async () => {
    const host = new MockHost();
    const store = new Store();
    const controller = new ProjectController(host, store);

    host.seedFile("fixtures/stylepack.stylepack.json", JSON.stringify(loadStylePackFixture()));
    await controller.loadStylePack("fixtures/stylepack.stylepack.json");

    const created = controller.createProjectFromTemplate("fighter", "fighter_template_01");
    const savedPath = await controller.saveProject("out/fighter-template.zxmodel.json");
    const reopened = await controller.openProject(savedPath);

    expect(created.assetType).toBe("character");
    expect(created.stylePackId).toBe("zx_fighter_v1");
    expect(created.skeletonTemplate).toBe("biped_fighter_v1");
    expect(created.modules).toEqual([]);
    expect(created.paintLayers).toEqual([]);
    expect(reopened).toEqual(created);
  });
});
