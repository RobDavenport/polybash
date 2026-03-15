import { describe, expect, it } from "vitest";
import {
  buildVisibleHistoryEntries,
  captureUndoSnapshot,
  createHistoryState,
  pushHistoryEntry,
  redoHistory,
  restoreUndoSnapshot,
  undoHistory
} from "./historyState";
import type { DesktopUndoSnapshot } from "./types";

function buildSnapshot(): DesktopUndoSnapshot {
  return {
    projectId: "fighter_template_01",
    projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
    stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
    savePath: "out/desktop/fighter_basic_saved.zxmodel.json",
    selectedModuleId: "torso_01",
    document: {
      project: {
        id: "fighter_basic",
        version: 1,
        assetType: "character",
        stylePackId: "zx_fighter_v1",
        modules: [],
        paintLayers: [],
        declaredMetrics: {
          triangles: 0,
          materials: 0,
          textures: 0,
          atlasWidth: 0,
          atlasHeight: 0,
          bones: 0,
          sockets: 0
        }
      },
      stylePack: {
        id: "zx_fighter_v1",
        version: 1,
        supportedAssetTypes: ["character"],
        budgets: {},
        connectorTaxonomy: {},
        palettes: [],
        rigTemplates: [],
        modules: [],
        decalIds: []
      },
      paths: {
        projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
        stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        savePath: "out/desktop/fighter_basic_saved.zxmodel.json"
      }
    },
    report: {
      status: "ok",
      stats: {
        moduleCount: 0,
        triangles: 0,
        materials: 0,
        textures: 0
      },
      issues: []
    },
    exportBundle: {
      document: {
        project: {
          id: "fighter_basic",
          version: 1,
          assetType: "character",
          stylePackId: "zx_fighter_v1",
          modules: [],
          paintLayers: [],
          declaredMetrics: {
            triangles: 0,
            materials: 0,
            textures: 0,
            atlasWidth: 0,
            atlasHeight: 0,
            bones: 0,
            sockets: 0
          }
        },
        stylePack: {
          id: "zx_fighter_v1",
          version: 1,
          supportedAssetTypes: ["character"],
          budgets: {},
          connectorTaxonomy: {},
          palettes: [],
          rigTemplates: [],
          modules: [],
          decalIds: []
        },
        paths: {
          projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
          stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
          savePath: "out/desktop/fighter_basic_saved.zxmodel.json"
        }
      },
      report: {
        status: "ok",
        stats: {
          moduleCount: 0,
          triangles: 0,
          materials: 0,
          textures: 0
        },
        issues: []
      },
      glbBytesBase64: "Z2xURg=="
    }
  };
}

describe("historyState", () => {
  it("captures a deep-cloned undo snapshot", () => {
    const current = buildSnapshot();

    const snapshot = captureUndoSnapshot(current);
    current.projectId = "mutated";
    current.document!.project.id = "mutated_document";
    current.report!.status = "error";

    expect(snapshot.projectId).toBe("fighter_template_01");
    expect(snapshot.document?.project.id).toBe("fighter_basic");
    expect(snapshot.report?.status).toBe("ok");
  });

  it("restores a deep-cloned snapshot and tolerates missing history", () => {
    const snapshot = captureUndoSnapshot(buildSnapshot());
    const restored = restoreUndoSnapshot(snapshot);

    expect(restoreUndoSnapshot(undefined)).toBeUndefined();
    expect(restored).toEqual(snapshot);
    expect(restored).not.toBe(snapshot);

    restored!.document!.project.id = "changed_again";
    expect(snapshot.document?.project.id).toBe("fighter_basic");
  });

  it("pushes labeled history entries, trims to a limit, and clears redo state on a new edit", () => {
    const history = createHistoryState();
    const first = buildSnapshot();
    const second = buildSnapshot();
    second.projectId = "fighter_template_02";
    const third = buildSnapshot();
    third.projectId = "fighter_template_03";
    const fourth = buildSnapshot();
    fourth.projectId = "fighter_template_04";

    const withFirst = pushHistoryEntry(history, "Created fighter", first, 3);
    const withSecond = pushHistoryEntry(withFirst, "Loaded canonical", second, 3);
    const withThird = pushHistoryEntry(withSecond, "Adjusted chest", third, 3);
    const undone = undoHistory(withThird, fourth);
    const replayed = pushHistoryEntry(undone.history, "Adjusted jaw", fourth, 3);

    expect(withThird.past.map((entry) => entry.label)).toEqual([
      "Created fighter",
      "Loaded canonical",
      "Adjusted chest"
    ]);
    expect(withThird.future).toEqual([]);
    expect(replayed.past.map((entry) => entry.label)).toEqual([
      "Loaded canonical",
      "Adjusted chest",
      "Adjusted jaw"
    ]);
    expect(replayed.future).toEqual([]);
  });

  it("undoes and redoes labeled snapshots without sharing object identity", () => {
    const history = createHistoryState();
    const beforeMove = buildSnapshot();
    const afterMove = buildSnapshot();
    afterMove.projectId = "fighter_after_move";
    afterMove.document!.project.id = "fighter_after_move";

    const seeded = pushHistoryEntry(history, "Moved torso", beforeMove);
    const undone = undoHistory(seeded, afterMove);
    const redone = redoHistory(undone.history, undone.snapshot!);

    expect(undone.label).toBe("Moved torso");
    expect(undone.snapshot?.projectId).toBe("fighter_template_01");
    expect(undone.history.future).toHaveLength(1);
    expect(undone.history.future[0]?.label).toBe("Redo Moved torso");
    expect(redone.label).toBe("Redo Moved torso");
    expect(redone.snapshot?.projectId).toBe("fighter_after_move");
    expect(redone.history.past).toHaveLength(1);
    expect(redone.history.past[0]?.label).toBe("Moved torso");

    redone.snapshot!.document!.project.id = "mutated_after_redo";
    expect(afterMove.document?.project.id).toBe("fighter_after_move");
  });

  it("builds visible history entries with undo items first and normalized redo labels", () => {
    const history = createHistoryState();
    const beforeCreate = buildSnapshot();
    const afterCreate = buildSnapshot();
    afterCreate.projectId = "fighter_after_create";
    const afterMove = buildSnapshot();
    afterMove.projectId = "fighter_after_move";

    const seeded = pushHistoryEntry(history, "Created fighter", beforeCreate);
    const withMove = pushHistoryEntry(seeded, "Moved torso", afterCreate);
    const undone = undoHistory(withMove, afterMove);

    expect(buildVisibleHistoryEntries(undone.history)).toEqual([
      { label: "Created fighter", direction: "undo" },
      { label: "Moved torso", direction: "redo" }
    ]);
  });
});
