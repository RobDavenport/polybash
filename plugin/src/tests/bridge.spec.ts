import { describe, expect, it } from "vitest";
import {
  InMemoryCoreFacade,
  WasmBridgeError,
  WasmCoreFacade,
  type WasmBindings
} from "../bridge/coreFacade";
import { cleanReport, loadProjectFixture, loadStylePackFixture } from "./helpers";

describe("InMemoryCoreFacade", () => {
  it("returns validation and export payloads for controller tests", async () => {
    const core = new InMemoryCoreFacade(() => cleanReport());
    const project = loadProjectFixture();
    const stylePack = loadStylePackFixture();

    const report = await core.validate(project, stylePack);
    const bundle = await core.export(project, stylePack);

    expect(report.status).toBe("ok");
    expect(bundle.glbBytesBase64.length).toBeGreaterThan(5);
  });
});

describe("WasmCoreFacade", () => {
  it("parses JSON payloads from wasm bindings", async () => {
    const report = cleanReport();
    const bindings: WasmBindings = {
      validateProject: () => JSON.stringify(report),
      exportProject: () =>
        JSON.stringify({
          report,
          glbBytesBase64: "Z2xURg=="
        })
    };
    const core = new WasmCoreFacade(bindings);
    const project = loadProjectFixture();
    const stylePack = loadStylePackFixture();

    await expect(core.validate(project, stylePack)).resolves.toEqual(report);
    await expect(core.export(project, stylePack)).resolves.toEqual({
      report,
      glbBytesBase64: "Z2xURg=="
    });
  });

  it("translates structured bridge errors", async () => {
    const errorReport = {
      ...cleanReport(),
      status: "error" as const,
      issues: [
        {
          code: "BUDGET_TRIANGLES",
          severity: "error" as const,
          path: "/declaredMetrics/triangles",
          summary: "Triangle budget exceeded.",
          detail: "2800 > 2500 triangles.",
          suggestedFix: "Reduce geometry."
        }
      ]
    };
    const bindings: WasmBindings = {
      validateProject: () => JSON.stringify(cleanReport()),
      exportProject: () => {
        throw JSON.stringify({
          code: "VALIDATION_BLOCKED",
          message: "validation blocked export",
          validationReport: errorReport
        });
      }
    };
    const core = new WasmCoreFacade(bindings);

    await expect(core.export(loadProjectFixture(), loadStylePackFixture())).rejects.toEqual(
      new WasmBridgeError("VALIDATION_BLOCKED", "validation blocked export", errorReport)
    );
  });
});
