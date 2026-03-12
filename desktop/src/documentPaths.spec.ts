import { describe, expect, it } from "vitest";
import {
  ensureProjectSavePath,
  resolveDialogPath,
  suggestProjectSavePath
} from "./documentPaths";
import type { DesktopDocument } from "./types";

describe("documentPaths", () => {
  it("normalizes dialog selections to a single path", () => {
    expect(resolveDialogPath(null)).toBeUndefined();
    expect(resolveDialogPath("C:/tmp/fighter.zxmodel.json")).toBe("C:/tmp/fighter.zxmodel.json");
    expect(resolveDialogPath(["C:/tmp/a.zxmodel.json", "C:/tmp/b.zxmodel.json"])).toBe(
      "C:/tmp/a.zxmodel.json"
    );
  });

  it("appends the project extension when needed", () => {
    expect(ensureProjectSavePath("C:/tmp/fighter")).toBe("C:/tmp/fighter.zxmodel.json");
    expect(ensureProjectSavePath("C:/tmp/fighter.zxmodel.json")).toBe(
      "C:/tmp/fighter.zxmodel.json"
    );
  });

  it("prefers explicit save paths when suggesting a save target", () => {
    const document = {
      project: {} as DesktopDocument["project"],
      stylePack: {} as DesktopDocument["stylePack"],
      paths: {
        projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
        stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        savePath: "out/desktop/fighter_basic_saved.zxmodel.json"
      }
    } as DesktopDocument;

    expect(suggestProjectSavePath(document)).toBe("out/desktop/fighter_basic_saved.zxmodel.json");
  });
});
