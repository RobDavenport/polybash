import { describe, expect, it } from "vitest";
import { InMemoryCoreFacade } from "../bridge/coreFacade";
import { ValidationController } from "../controllers/validationController";
import { Store } from "../state/store";
import { cleanReport, loadProjectFixture, loadStylePackFixture } from "./helpers";

describe("ValidationController", () => {
  it("stores the last validation report", async () => {
    const store = new Store();
    store.patch({
      project: loadProjectFixture(),
      stylePack: loadStylePackFixture()
    });

    const controller = new ValidationController(
      store,
      new InMemoryCoreFacade(() => cleanReport())
    );

    const report = await controller.validate();

    expect(report.status).toBe("ok");
    expect(store.getState().validationReport?.stats.moduleCount).toBe(7);
  });
});
