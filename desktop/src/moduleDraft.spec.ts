import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import {
  addReusableModuleDraftRegion,
  applyReusableModuleDraft,
  createReusableModuleDraft,
  deleteReusableModule,
  duplicateReusableModule,
  parseReusableModuleDraftMaterialZones,
  renameReusableModule,
  setReusableModuleDraftMaterialZones,
  suggestDuplicateReusableModuleId,
  updateReusableModuleDraftConnector
} from "./moduleDraft";
import type { DesktopDocument } from "./types";

const documentFixture = {
  project: fighterProject as unknown as DesktopDocument["project"],
  stylePack: fighterStylePack as unknown as DesktopDocument["stylePack"],
  paths: {
    projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
    stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
  }
} satisfies DesktopDocument;

describe("moduleDraft", () => {
  it("creates an editable reusable module draft from the style pack", () => {
    const draft = createReusableModuleDraft(documentFixture, "fighter_head_base_a");

    expect(draft).toEqual({
      id: "fighter_head_base_a",
      assetType: "character",
      connectors: [{ id: "neck_socket", kind: "neck_socket" }],
      regions: [{ id: "jaw_width", min: -0.15, max: 0.2 }],
      materialZones: ["skin", "trim"]
    });
  });

  it("suggests the next deterministic authored copy id for duplicate flows", () => {
    expect(suggestDuplicateReusableModuleId(documentFixture, "fighter_head_base_a")).toBe(
      "fighter_head_base_a_copy_01"
    );

    const once = duplicateReusableModule(documentFixture, "fighter_head_base_a");
    expect(suggestDuplicateReusableModuleId(once!.document, "fighter_head_base_a")).toBe(
      "fighter_head_base_a_copy_02"
    );
  });

  it("duplicates a reusable module into a deterministic authored copy", () => {
    const duplicated = duplicateReusableModule(documentFixture, "fighter_head_base_a");

    expect(duplicated?.duplicateId).toBe("fighter_head_base_a_copy_01");
    expect(
      duplicated?.document.stylePack.modules.find((module) => module.id === "fighter_head_base_a_copy_01")
    ).toEqual({
      id: "fighter_head_base_a_copy_01",
      assetType: "character",
      connectors: [{ id: "neck_socket", kind: "neck_socket" }],
      regions: [{ id: "jaw_width", min: -0.15, max: 0.2 }],
      materialZones: ["skin", "trim"]
    });
  });

  it("supports an explicit authored id when duplicating a reusable module", () => {
    const duplicated = duplicateReusableModule(
      documentFixture,
      "fighter_head_base_a",
      "fighter_head_variant_a"
    );

    expect(duplicated?.duplicateId).toBe("fighter_head_variant_a");
    expect(
      duplicated?.document.stylePack.modules.find((module) => module.id === "fighter_head_variant_a")
    ).toEqual({
      id: "fighter_head_variant_a",
      assetType: "character",
      connectors: [{ id: "neck_socket", kind: "neck_socket" }],
      regions: [{ id: "jaw_width", min: -0.15, max: 0.2 }],
      materialZones: ["skin", "trim"]
    });
  });

  it("increments deterministic authored copy ids when prior copies already exist", () => {
    const once = duplicateReusableModule(documentFixture, "fighter_head_base_a");
    const twice = duplicateReusableModule(once!.document, "fighter_head_base_a");

    expect(twice?.duplicateId).toBe("fighter_head_base_a_copy_02");
  });

  it("renames a reusable authored copy and updates placed module references", () => {
    const duplicated = duplicateReusableModule(documentFixture, "fighter_head_base_a");
    const placedDocument: DesktopDocument = {
      ...duplicated!.document,
      project: {
        ...duplicated!.document.project,
        modules: [
          ...duplicated!.document.project.modules,
          {
            ...duplicated!.document.project.modules[1],
            instanceId: "head_variant_01",
            moduleId: duplicated!.duplicateId
          }
        ]
      }
    };

    const renamed = renameReusableModule(
      placedDocument,
      duplicated!.duplicateId,
      "fighter_head_variant_a"
    );

    expect(renamed?.renamedId).toBe("fighter_head_variant_a");
    expect(
      renamed?.document.stylePack.modules.find((module) => module.id === "fighter_head_variant_a")
    ).toEqual({
      id: "fighter_head_variant_a",
      assetType: "character",
      connectors: [{ id: "neck_socket", kind: "neck_socket" }],
      regions: [{ id: "jaw_width", min: -0.15, max: 0.2 }],
      materialZones: ["skin", "trim"]
    });
    expect(
      renamed?.document.project.modules.find((module) => module.instanceId === "head_variant_01")?.moduleId
    ).toBe("fighter_head_variant_a");
  });

  it("deletes a reusable authored copy and prunes placed instances, decals, and connector targets", () => {
    const duplicated = duplicateReusableModule(documentFixture, "fighter_head_base_a");
    const authoredInstance = {
      ...duplicated!.document.project.modules[1],
      instanceId: "head_variant_01",
      moduleId: duplicated!.duplicateId,
      connectorAttachments: []
    };
    const placedDocument: DesktopDocument = {
      ...duplicated!.document,
      project: {
        ...duplicated!.document.project,
        modules: duplicated!.document.project.modules.map((module) =>
          module.instanceId === "torso_01"
            ? {
                ...module,
                connectorAttachments: [
                  {
                    localConnector: "neck",
                    targetInstanceId: "head_variant_01",
                    targetConnector: "neck_socket"
                  }
                ]
              }
            : module
        ).concat(authoredInstance),
        paintLayers: duplicated!.document.project.paintLayers.concat({
          type: "decal",
          target: "head_variant_01",
          decalId: "badge_01"
        })
      }
    };

    const deleted = deleteReusableModule(placedDocument, duplicated!.duplicateId);

    expect(deleted?.removedInstanceIds).toEqual(["head_variant_01"]);
    expect(
      deleted?.document.stylePack.modules.some((module) => module.id === duplicated!.duplicateId)
    ).toBe(false);
    expect(
      deleted?.document.project.modules.some((module) => module.instanceId === "head_variant_01")
    ).toBe(false);
    expect(
      deleted?.document.project.modules.find((module) => module.instanceId === "torso_01")?.connectorAttachments
    ).toEqual([]);
    expect(
      deleted?.document.project.paintLayers.some(
        (layer) => layer.type === "decal" && layer.target === "head_variant_01"
      )
    ).toBe(false);
  });

  it("rejects reusable module renames that would collide with an existing id", () => {
    expect(
      renameReusableModule(documentFixture, "fighter_head_base_a", "fighter_torso_base_a")
    ).toBeUndefined();
    expect(
      renameReusableModule(documentFixture, "fighter_head_base_a", "   ")
    ).toBeUndefined();
  });

  it("normalizes material zone csv input for reusable module drafts", () => {
    expect(parseReusableModuleDraftMaterialZones(" skin, trim ,, accent , skin ")).toEqual([
      "skin",
      "trim",
      "accent"
    ]);
    expect(parseReusableModuleDraftMaterialZones("   ")).toEqual([]);
  });

  it("persists authored connector, region, and material metadata back into reusable module records", () => {
    const base = createReusableModuleDraft(documentFixture, "fighter_head_base_a");
    expect(base).toBeDefined();

    const withConnector = updateReusableModuleDraftConnector(base!, "neck_socket", {
      id: "neck_socket_top",
      kind: "neck_socket"
    });
    const withRegion = addReusableModuleDraftRegion(withConnector, {
      id: "brow_height",
      min: -0.1,
      max: 0.12
    });
    const withZones = setReusableModuleDraftMaterialZones(
      withRegion,
      parseReusableModuleDraftMaterialZones("skin, trim, accent")
    );
    const updated = applyReusableModuleDraft(documentFixture, withZones);
    const descriptor = updated.stylePack.modules.find((module) => module.id === "fighter_head_base_a");

    expect(descriptor).toEqual({
      id: "fighter_head_base_a",
      assetType: "character",
      connectors: [{ id: "neck_socket_top", kind: "neck_socket" }],
      regions: [
        { id: "jaw_width", min: -0.15, max: 0.2 },
        { id: "brow_height", min: -0.1, max: 0.12 }
      ],
      materialZones: ["skin", "trim", "accent"]
    });
  });

  it("preserves imported source-asset metadata when reusable module drafts are applied", () => {
    const importedDocument: DesktopDocument = {
      ...documentFixture,
      stylePack: {
        ...documentFixture.stylePack,
        modules: [
          ...documentFixture.stylePack.modules,
          {
            id: "fighter_shoulder_guard_a",
            assetType: "character",
            sourceAsset: {
              path: "fixtures/imports/valid/fighter_shoulder_guard_a.glb",
              format: "glb"
            },
            connectors: [{ id: "shoulder_plug", kind: "arm_plug" }],
            regions: [{ id: "flare_width", min: -0.08, max: 0.12 }],
            materialZones: ["primary", "trim"]
          }
        ]
      }
    };
    const draft = createReusableModuleDraft(importedDocument, "fighter_shoulder_guard_a");

    expect(draft?.sourceAsset).toEqual({
      path: "fixtures/imports/valid/fighter_shoulder_guard_a.glb",
      format: "glb"
    });

    const updated = applyReusableModuleDraft(
      importedDocument,
      setReusableModuleDraftMaterialZones(draft!, ["primary", "trim", "accent"])
    );

    expect(
      updated.stylePack.modules.find((module) => module.id === "fighter_shoulder_guard_a")
    ).toEqual({
      id: "fighter_shoulder_guard_a",
      assetType: "character",
      sourceAsset: {
        path: "fixtures/imports/valid/fighter_shoulder_guard_a.glb",
        format: "glb"
      },
      connectors: [{ id: "shoulder_plug", kind: "arm_plug" }],
      regions: [{ id: "flare_width", min: -0.08, max: 0.12 }],
      materialZones: ["primary", "trim", "accent"]
    });
  });
});
