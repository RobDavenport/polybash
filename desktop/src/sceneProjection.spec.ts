import fighterProject from "../../fixtures/projects/valid/fighter_basic.zxmodel.json";
import fighterStylePack from "../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json";
import { describe, expect, it } from "vitest";
import {
  buildProxyScene,
  buildViewportRotateCommit,
  buildViewportScaleCommit,
  buildViewportTranslateCommit,
  rotateAroundZAxis,
  scaleUniformly,
  translateOnAuthoringPlane
} from "./sceneProjection";
import type { DesktopDocument } from "./types";

const documentFixture = {
  project: fighterProject as unknown as DesktopDocument["project"],
  stylePack: fighterStylePack as unknown as DesktopDocument["stylePack"],
  paths: {
    projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
    stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
    savePath: "out/desktop/fighter_basic.zxmodel.json"
  }
} satisfies DesktopDocument;

describe("buildProxyScene", () => {
  it("translates positions on the authoring plane without disturbing z", () => {
    expect(translateOnAuthoringPlane([0.6, 1.2, 0], [-0.25, 0.3])).toEqual([0.35, 1.5, 0]);
    expect(translateOnAuthoringPlane([0.1234, 1.9876, 0.5], [0.1114, -0.2224])).toEqual([
      0.235,
      1.765,
      0.5
    ]);
  });

  it("scales uniformly for viewport direct manipulation and clamps to a safe minimum", () => {
    expect(scaleUniformly([1, 1, 1], 0.35)).toEqual([1.35, 1.35, 1.35]);
    expect(scaleUniformly([1, 1, 1], -2)).toEqual([0.1, 0.1, 0.1]);
  });

  it("rotates around the authored z axis for viewport direct manipulation", () => {
    expect(rotateAroundZAxis([0, 0, 90], -22.5)).toEqual([0, 0, 67.5]);
    expect(rotateAroundZAxis([10, -5, 0], 14.4444)).toEqual([10, -5, 14.444]);
  });

  it("projects one deterministic proxy node per module", () => {
    const scene = buildProxyScene(documentFixture);

    expect(scene.nodes).toHaveLength(documentFixture.project.modules.length);
    expect(scene.nodes.map((node) => node.instanceId)).toEqual(
      documentFixture.project.modules.map((module) => module.instanceId)
    );
    expect(scene.bounds.max[1]).toBeGreaterThan(1.8);
    expect(scene.center[1]).toBeGreaterThan(0.8);
  });

  it("preserves selection and proxy sizing heuristics for low poly parts", () => {
    const scene = buildProxyScene(documentFixture, "weapon_01");
    const torso = scene.nodes.find((node) => node.instanceId === "torso_01");
    const weapon = scene.nodes.find((node) => node.instanceId === "weapon_01");
    const arm = scene.nodes.find((node) => node.instanceId === "arm_l_01");

    expect(torso).toBeDefined();
    expect(weapon).toBeDefined();
    expect(arm).toBeDefined();
    expect(weapon?.selected).toBe(true);
    expect(weapon?.size[1]).toBeGreaterThan((weapon?.size[0] ?? 0) * 6);
    expect(torso?.size[0]).toBeGreaterThan(arm?.size[0] ?? 0);
    expect(weapon?.rotation[2]).toBe(90);
  });

  it("reflects authored transform changes in projected node placement", () => {
    const editedDocument = structuredClone(documentFixture);
    const weapon = editedDocument.project.modules.find((module) => module.instanceId === "weapon_01");

    expect(weapon).toBeDefined();
    weapon!.transform.position = [1.4, 1.1, 0.35];
    weapon!.transform.scale = [1.5, 1.2, 1];

    const scene = buildProxyScene(editedDocument, "weapon_01");
    const editedWeapon = scene.nodes.find((node) => node.instanceId === "weapon_01");

    expect(editedWeapon?.position).toEqual([1.4, 1.1, 0.35]);
    expect(editedWeapon?.size[0]).toBeCloseTo(0.21);
    expect(editedWeapon?.size[1]).toBeGreaterThan(1.5);
  });

  it("marks only the selected module as directly translatable in the proxy scene", () => {
    const scene = buildProxyScene(documentFixture, "arm_l_01");
    const selected = scene.nodes.find((node) => node.instanceId === "arm_l_01");
    const unselected = scene.nodes.find((node) => node.instanceId === "arm_r_01");

    expect(selected?.translationMode).toBe("xy");
    expect(selected?.scaleMode).toBe("uniform");
    expect(selected?.rotationMode).toBe("z");
    expect(selected?.authoredScale).toEqual([1, 1, 1]);
    expect(unselected?.translationMode).toBeUndefined();
    expect(unselected?.scaleMode).toBeUndefined();
    expect(unselected?.rotationMode).toBeUndefined();
  });

  it("projects visible orientation, transform, and connector affordances for the selected node", () => {
    const scene = buildProxyScene(documentFixture, "arm_r_01");
    const selected = scene.nodes.find((node) => node.instanceId === "arm_r_01");

    expect(scene.orientationWidget.axes).toEqual([
      { axis: "x", colorHex: "#d84f37", label: "X" },
      { axis: "y", colorHex: "#2f8f63", label: "Y" },
      { axis: "z", colorHex: "#2a6db2", label: "Z" }
    ]);
    expect(scene.orientationWidget.anchor[1]).toBeGreaterThan(scene.bounds.min[1]);
    expect(selected?.transformGuides.map((guide) => guide.kind)).toEqual([
      "translate",
      "translate",
      "scale",
      "rotate"
    ]);
    expect(selected?.connectorMarkers.map((marker) => marker.id)).toEqual([
      "arm_plug",
      "hand_socket_r"
    ]);
    expect(selected?.connectorMarkers.find((marker) => marker.id === "hand_socket_r")?.state).toBe(
      "attached"
    );
    expect(selected?.snapGuides[0]?.label).toBe("hand_socket_r -> weapon_01.grip");
  });

  it("builds a typed set_transform command for viewport translation commits", () => {
    expect(buildViewportTranslateCommit("weapon_01", [0.95, 1, 0], [0.125, -0.2])).toEqual({
      instanceId: "weapon_01",
      position: [1.075, 0.8, 0],
      command: {
        op: "set_transform",
        instanceId: "weapon_01",
        field: "position",
        value: [1.075, 0.8, 0]
      }
    });
  });

  it("builds a typed set_transform command for viewport scaling commits", () => {
    expect(buildViewportScaleCommit("torso_01", [1, 1, 1], 0.25)).toEqual({
      instanceId: "torso_01",
      scale: [1.25, 1.25, 1.25],
      command: {
        op: "set_transform",
        instanceId: "torso_01",
        field: "scale",
        value: [1.25, 1.25, 1.25]
      }
    });
  });

  it("builds a typed set_transform command for viewport rotation commits", () => {
    expect(buildViewportRotateCommit("weapon_01", [0, 0, 90], -18)).toEqual({
      instanceId: "weapon_01",
      rotation: [0, 0, 72],
      command: {
        op: "set_transform",
        instanceId: "weapon_01",
        field: "rotation",
        value: [0, 0, 72]
      }
    });
  });
});
