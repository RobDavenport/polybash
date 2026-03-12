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

  it("preserves actionable validation errors in plugin state", async () => {
    const store = new Store();
    store.patch({
      project: loadProjectFixture(),
      stylePack: loadStylePackFixture()
    });

    const controller = new ValidationController(store, new InMemoryCoreFacade(() => ({
      status: "error",
      stats: cleanReport().stats,
      issues: [
        {
          code: "BAD_CONNECTOR",
          severity: "error",
          path: "/modules/0/connectorAttachments",
          summary: "Connector kinds are incompatible.",
          detail: "'neck' cannot attach to 'hand_socket'.",
          suggestedFix: "Use a compatible connector pair."
        }
      ]
    })));

    await controller.validate();

    expect(store.getState().validationReport?.issues).toContainEqual({
      code: "BAD_CONNECTOR",
      severity: "error",
      path: "/modules/0/connectorAttachments",
      summary: "Connector kinds are incompatible.",
      detail: "'neck' cannot attach to 'hand_socket'.",
      suggestedFix: "Use a compatible connector pair."
    });
  });
});
