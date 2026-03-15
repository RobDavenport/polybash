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

export type ProxyTransformGuide =
  | {
      kind: "translate" | "scale";
      axis: "x" | "y" | "z";
      start: Vec3;
      end: Vec3;
      colorHex: string;
    }
  | {
      kind: "rotate";
      axis: "z";
      center: Vec3;
      radius: number;
      colorHex: string;
    };

export type ProxyConnectorMarker = {
  id: string;
  kind: string;
  label: string;
  position: Vec3;
  state: "attached" | "available" | "snap";
  targetInstanceId?: string;
  targetConnector?: string;
};

export type ProxySnapGuide = {
  from: Vec3;
  to: Vec3;
  label: string;
};

export type ProxyOrientationWidget = {
  anchor: Vec3;
  axes: Array<{
    axis: "x" | "y" | "z";
    label: string;
    colorHex: string;
  }>;
};

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
  transformGuides: ProxyTransformGuide[];
  connectorMarkers: ProxyConnectorMarker[];
  snapGuides: ProxySnapGuide[];
};

export type ProxyScene = {
  nodes: ProxyNode[];
  bounds: {
    min: Vec3;
    max: Vec3;
  };
  center: Vec3;
  orientationWidget: ProxyOrientationWidget;
};

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

const ORIENTATION_AXES: ProxyOrientationWidget["axes"] = [
  { axis: "x", label: "X", colorHex: "#d84f37" },
  { axis: "y", label: "Y", colorHex: "#2f8f63" },
  { axis: "z", label: "Z", colorHex: "#2a6db2" }
];

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
      center: [0, 0, 0],
      orientationWidget: {
        anchor: [0, 0, 0],
        axes: ORIENTATION_AXES
      }
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
    ],
    orientationWidget: {
      anchor: [round(min[0] + 0.55), round(max[1] - 0.55), round(max[2] + 0.05)],
      axes: ORIENTATION_AXES
    }
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
    rotationMode: selected ? "z" : undefined,
    transformGuides: selected ? buildTransformGuides(instance.transform.position, size) : [],
    connectorMarkers: selected ? buildConnectorMarkers(document, instance, descriptor, size) : [],
    snapGuides: selected ? buildSnapGuides(document, instance, descriptor, size) : []
  };
}

function buildTransformGuides(position: Vec3, size: Vec3): ProxyTransformGuide[] {
  const xExtent = round(size[0] / 2 + 0.45);
  const yExtent = round(size[1] / 2 + 0.45);

  return [
    {
      kind: "translate",
      axis: "x",
      start: position,
      end: [round(position[0] + xExtent), position[1], position[2]],
      colorHex: "#d84f37"
    },
    {
      kind: "translate",
      axis: "y",
      start: position,
      end: [position[0], round(position[1] + yExtent), position[2]],
      colorHex: "#2f8f63"
    },
    {
      kind: "scale",
      axis: "y",
      start: [position[0], round(position[1] + size[1] / 2), position[2]],
      end: [position[0], round(position[1] + size[1] / 2 + 0.24), position[2]],
      colorHex: "#f0b429"
    },
    {
      kind: "rotate",
      axis: "z",
      center: position,
      radius: round(Math.max(size[0], size[1]) * 0.7),
      colorHex: "#2a6db2"
    }
  ];
}

function buildConnectorMarkers(
  document: DesktopDocument,
  instance: ModuleInstance,
  descriptor: ModuleDescriptor | undefined,
  size: Vec3
): ProxyConnectorMarker[] {
  if (!descriptor) {
    return [];
  }

  return descriptor.connectors.map((connector) => {
    const attachment = instance.connectorAttachments.find(
      (candidate) => candidate.localConnector === connector.id
    );
    const defaultTarget = buildDefaultSnapTarget(document, instance, connector.kind, attachment);

    return {
      id: connector.id,
      kind: connector.kind,
      label: connector.id,
      position: resolveConnectorPosition(instance, connector.id, size),
      state: attachment ? "attached" : defaultTarget ? "snap" : "available",
      targetInstanceId: attachment?.targetInstanceId ?? defaultTarget?.instanceId,
      targetConnector: attachment?.targetConnector ?? defaultTarget?.connectorId
    };
  });
}

function buildSnapGuides(
  document: DesktopDocument,
  instance: ModuleInstance,
  descriptor: ModuleDescriptor | undefined,
  size: Vec3
): ProxySnapGuide[] {
  if (!descriptor) {
    return [];
  }

  return descriptor.connectors
    .map((connector) => {
      const attachment = instance.connectorAttachments.find(
        (candidate) => candidate.localConnector === connector.id
      );
      const target = buildDefaultSnapTarget(document, instance, connector.kind, attachment);
      if (!target) {
        return undefined;
      }

      const targetInstance = document.project.modules.find(
        (candidate) => candidate.instanceId === target.instanceId
      );
      if (!targetInstance) {
        return undefined;
      }

      return {
        localConnector: connector.id,
        attached: Boolean(attachment),
        guide: {
          from: resolveConnectorPosition(instance, connector.id, size),
          to: resolveConnectorPosition(targetInstance, target.connectorId),
          label: `${connector.id} -> ${target.instanceId}.${target.connectorId}`
        }
      };
    })
    .filter((entry): entry is { localConnector: string; attached: boolean; guide: ProxySnapGuide } =>
      Boolean(entry)
    )
    .sort((left, right) => {
      if (left.attached !== right.attached) {
        return left.attached ? -1 : 1;
      }

      return left.guide.label.localeCompare(right.guide.label);
    })
    .map((entry) => entry.guide);
}

function buildDefaultSnapTarget(
  document: DesktopDocument,
  sourceInstance: ModuleInstance,
  localKind: string,
  attachment?: ModuleInstance["connectorAttachments"][number]
): { instanceId: string; connectorId: string } | undefined {
  const compatibleTargets = document.project.modules
    .filter((candidate) => candidate.instanceId !== sourceInstance.instanceId)
    .flatMap((candidate) => {
      const descriptor = findDescriptor(document, candidate);
      return (descriptor?.connectors ?? [])
        .filter((connector) => connectorIsCompatible(document, localKind, connector.kind))
        .map((connector) => ({
          instanceId: candidate.instanceId,
          connectorId: connector.id,
          distance: measureConnectorTargetDistance(sourceInstance, candidate)
        }));
    });

  const attachedTarget = attachment
    ? compatibleTargets.find(
        (candidate) =>
          candidate.instanceId === attachment.targetInstanceId &&
          candidate.connectorId === attachment.targetConnector
      )
    : undefined;
  if (attachedTarget) {
    return attachedTarget;
  }

  return compatibleTargets.sort((left, right) => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }

    const instanceComparison = left.instanceId.localeCompare(right.instanceId);
    if (instanceComparison !== 0) {
      return instanceComparison;
    }

    return left.connectorId.localeCompare(right.connectorId);
  })[0];
}

function measureConnectorTargetDistance(sourceInstance: ModuleInstance, targetInstance: ModuleInstance): number {
  const [sourceX, sourceY, sourceZ] = sourceInstance.transform.position;
  const [targetX, targetY, targetZ] = targetInstance.transform.position;

  return (sourceX - targetX) ** 2 + (sourceY - targetY) ** 2 + (sourceZ - targetZ) ** 2;
}

function resolveConnectorPosition(
  instance: ModuleInstance,
  connectorId: string,
  size?: Vec3
): Vec3 {
  const resolvedSize = size ?? scaledProxySize(instance);
  const offset = connectorOffset(instance, connectorId, resolvedSize);
  const rotated = rotateOffset(offset, instance.transform.rotation);

  return [
    round(instance.transform.position[0] + rotated[0]),
    round(instance.transform.position[1] + rotated[1]),
    round(instance.transform.position[2] + rotated[2])
  ];
}

function connectorOffset(instance: ModuleInstance, connectorId: string, size: Vec3): Vec3 {
  const lowerId = connectorId.toLowerCase();
  const moduleId = instance.moduleId.toLowerCase();

  if (lowerId.includes("neck")) {
    return [0, round(size[1] / 2), 0];
  }

  if (lowerId === "arm_l") {
    return [round(-size[0] / 2), round(size[1] * 0.15), 0];
  }

  if (lowerId === "arm_r") {
    return [round(size[0] / 2), round(size[1] * 0.15), 0];
  }

  if (lowerId === "arm_plug") {
    return [moduleId.endsWith("_l") ? round(size[0] / 2) : round(-size[0] / 2), round(size[1] * 0.15), 0];
  }

  if (lowerId === "leg_l") {
    return [round(-size[0] * 0.2), round(-size[1] / 2), 0];
  }

  if (lowerId === "leg_r") {
    return [round(size[0] * 0.2), round(-size[1] / 2), 0];
  }

  if (lowerId === "leg_plug") {
    return [0, round(size[1] / 2), 0];
  }

  if (lowerId === "hand_socket_l") {
    return [round(-size[0] / 2), round(-size[1] * 0.18), 0];
  }

  if (lowerId === "hand_socket_r") {
    return [round(size[0] / 2), round(-size[1] * 0.18), 0];
  }

  if (lowerId === "grip") {
    return [0, round(-size[1] / 2), 0];
  }

  return [0, 0, 0];
}

function rotateOffset(offset: Vec3, rotation: Vec3): Vec3 {
  let [x, y, z] = offset;
  const [rx, ry, rz] = rotation.map((value) => (value * Math.PI) / 180);

  let nextY = y * Math.cos(rx) - z * Math.sin(rx);
  let nextZ = y * Math.sin(rx) + z * Math.cos(rx);
  y = nextY;
  z = nextZ;

  let nextX = x * Math.cos(ry) + z * Math.sin(ry);
  nextZ = -x * Math.sin(ry) + z * Math.cos(ry);
  x = nextX;
  z = nextZ;

  nextX = x * Math.cos(rz) - y * Math.sin(rz);
  nextY = x * Math.sin(rz) + y * Math.cos(rz);
  x = nextX;
  y = nextY;

  return [round(x), round(y), round(z)];
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

function findDescriptor(
  document: DesktopDocument,
  instance: ModuleInstance
): ModuleDescriptor | undefined {
  return document.stylePack.modules.find((module) => module.id === instance.moduleId);
}

function connectorIsCompatible(
  document: DesktopDocument,
  leftKind: string,
  rightKind: string
): boolean {
  const leftAllowed = document.stylePack.connectorTaxonomy[leftKind] ?? [];
  const rightAllowed = document.stylePack.connectorTaxonomy[rightKind] ?? [];

  return leftAllowed.includes(rightKind) || rightAllowed.includes(leftKind);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
