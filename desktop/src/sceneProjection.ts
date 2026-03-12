import type {
  DesktopDocument,
  ModuleDescriptor,
  ModuleInstance,
  Vec3,
  ViewportRotateCommit,
  ViewportRotationMode,
  ViewportScaleCommit,
  ViewportScaleMode,
  ViewportTranslateCommit,
  ViewportTranslationMode
} from "./types";

export type ProxyNode = {
  instanceId: string;
  moduleId: string;
  assetType: string;
  position: Vec3;
  rotation: Vec3;
  authoredScale: Vec3;
  size: Vec3;
  colorHex: string;
  selected: boolean;
  connectorCount: number;
  translationMode?: ViewportTranslationMode;
  scaleMode?: ViewportScaleMode;
  rotationMode?: ViewportRotationMode;
};

export type ProxyScene = {
  nodes: ProxyNode[];
  bounds: {
    min: Vec3;
    max: Vec3;
  };
  center: Vec3;
};

export function translateOnAuthoringPlane(position: Vec3, delta: [number, number]): Vec3 {
  return [round(position[0] + delta[0]), round(position[1] + delta[1]), position[2]];
}

export function buildViewportTranslateCommit(
  instanceId: string,
  position: Vec3,
  delta: [number, number]
): ViewportTranslateCommit {
  const nextPosition = translateOnAuthoringPlane(position, delta);

  return {
    instanceId,
    position: nextPosition,
    command: {
      op: "set_transform",
      instanceId,
      field: "position",
      value: nextPosition
    }
  };
}

export function scaleUniformly(scale: Vec3, delta: number): Vec3 {
  const next = clamp(round(scale[0] + delta), 0.1, 4);
  return [next, next, next];
}

export function buildViewportScaleCommit(
  instanceId: string,
  scale: Vec3,
  delta: number
): ViewportScaleCommit {
  const nextScale = scaleUniformly(scale, delta);

  return {
    instanceId,
    scale: nextScale,
    command: {
      op: "set_transform",
      instanceId,
      field: "scale",
      value: nextScale
    }
  };
}

export function rotateAroundZAxis(rotation: Vec3, deltaDegrees: number): Vec3 {
  return [rotation[0], rotation[1], round(rotation[2] + deltaDegrees)];
}

export function buildViewportRotateCommit(
  instanceId: string,
  rotation: Vec3,
  deltaDegrees: number
): ViewportRotateCommit {
  const nextRotation = rotateAroundZAxis(rotation, deltaDegrees);

  return {
    instanceId,
    rotation: nextRotation,
    command: {
      op: "set_transform",
      instanceId,
      field: "rotation",
      value: nextRotation
    }
  };
}

const MATERIAL_COLORS: Record<string, string> = {
  cloth_red: "#a94042",
  cloth_blue: "#446da8",
  cloth_black: "#23262d",
  cloth_white: "#f0eee7",
  metal_dark: "#4b5563",
  metal_bright: "#b3becf",
  skin_light: "#d9ad8b",
  skin_tan: "#ba845e"
};

export function buildProxyScene(
  document: DesktopDocument,
  selectedInstanceId?: string
): ProxyScene {
  const resolvedSelection = resolveSelectedInstanceId(document, selectedInstanceId);
  const nodes = document.project.modules.map((instance) =>
    projectModule(document, instance, instance.instanceId === resolvedSelection)
  );

  if (nodes.length === 0) {
    return {
      nodes,
      bounds: {
        min: [0, 0, 0],
        max: [0, 0, 0]
      },
      center: [0, 0, 0]
    };
  }

  let min: Vec3 = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  let max: Vec3 = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

  for (const node of nodes) {
    for (let index = 0; index < 3; index += 1) {
      const halfExtent = node.size[index] / 2;
      min[index] = Math.min(min[index], node.position[index] - halfExtent);
      max[index] = Math.max(max[index], node.position[index] + halfExtent);
    }
  }

  return {
    nodes,
    bounds: { min, max },
    center: [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2
    ]
  };
}

function resolveSelectedInstanceId(
  document: DesktopDocument,
  selectedInstanceId?: string
): string | undefined {
  if (
    selectedInstanceId &&
    document.project.modules.some((module) => module.instanceId === selectedInstanceId)
  ) {
    return selectedInstanceId;
  }

  return document.project.modules[0]?.instanceId;
}

function projectModule(
  document: DesktopDocument,
  instance: ModuleInstance,
  selected: boolean
): ProxyNode {
  const descriptor = document.stylePack.modules.find((module) => module.id === instance.moduleId);
  const size = scaledProxySize(instance, descriptor);

  return {
    instanceId: instance.instanceId,
    moduleId: instance.moduleId,
    assetType: descriptor?.assetType ?? "character",
    position: instance.transform.position,
    rotation: instance.transform.rotation,
    authoredScale: instance.transform.scale,
    size,
    colorHex: resolveMaterialColor(Object.values(instance.materialSlots)),
    selected,
    connectorCount: descriptor?.connectors.length ?? 0,
    translationMode: selected ? "xy" : undefined,
    scaleMode: selected ? "uniform" : undefined,
    rotationMode: selected ? "z" : undefined
  };
}

function scaledProxySize(instance: ModuleInstance, descriptor?: ModuleDescriptor): Vec3 {
  const base = baseProxySize(instance, descriptor);

  return [
    round(base[0] * instance.transform.scale[0]),
    round(base[1] * instance.transform.scale[1]),
    round(base[2] * instance.transform.scale[2])
  ];
}

function baseProxySize(instance: ModuleInstance, descriptor?: ModuleDescriptor): Vec3 {
  const moduleId = instance.moduleId.toLowerCase();

  if (moduleId.includes("torso")) {
    const chestBulge = instance.regionParams.chest_bulge ?? 0;
    return [1 + chestBulge * 1.2, 1.2 + chestBulge * 0.7, 0.58];
  }

  if (moduleId.includes("head")) {
    const jawWidth = instance.regionParams.jaw_width ?? 0;
    return [0.68 + jawWidth * 1.4, 0.7, 0.66 + jawWidth * 0.8];
  }

  if (moduleId.includes("arm")) {
    const armWidth = instance.regionParams.arm_width ?? 0;
    return [0.28 + armWidth * 2.2, 0.96, 0.28 + armWidth * 2.2];
  }

  if (moduleId.includes("leg")) {
    const legWidth = instance.regionParams.leg_width ?? 0;
    return [0.32 + legWidth * 2.2, 1.08, 0.32 + legWidth * 2.2];
  }

  if (moduleId.includes("weapon") || descriptor?.assetType === "weapon") {
    const bladeLength = instance.regionParams.blade_length ?? 0;
    return [0.14, 1 + bladeLength * 2.8, 0.1];
  }

  return [0.6, 0.6, 0.6];
}

function resolveMaterialColor(materialIds: string[]): string {
  const primary = materialIds[0];
  if (!primary) {
    return "#8a8f99";
  }

  return MATERIAL_COLORS[primary] ?? hashToColor(primary);
}

function hashToColor(input: string): string {
  let hash = 0;
  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const hue = hash % 360;
  return hslToHex(hue, 42, 54);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = l - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return `#${[red, green, blue]
    .map((value) => Math.round((value + match) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
