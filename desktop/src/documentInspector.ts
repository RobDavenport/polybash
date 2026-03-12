import type {
  DesktopCommandPreview,
  DesktopDocument,
  DesktopPreviewValue,
  ModuleDescriptor,
  ModuleInstance,
  PaintLayer,
  SelectedModulePaintDetail,
  SnapTarget,
  Vec3
} from "./types";

export type ModuleCard = {
  instanceId: string;
  moduleId: string;
  assetType: string;
  attachmentCount: number;
  materialCount: number;
  selected: boolean;
};

export type ModuleLibraryEntry = {
  moduleId: string;
  assetType: string;
  connectorCount: number;
  regionCount: number;
  materialZoneCount: number;
};

export type ModuleRegionDetail = {
  id: string;
  current: number;
  min: number;
  max: number;
  utilization: number;
};

export type MaterialAssignment = {
  zone: string;
  materialId: string;
  availableMaterialIds: string[];
};

export type SelectedModuleDetail = {
  instanceId: string;
  moduleId: string;
  assetType: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  connectors: ConnectorDetail[];
  attachments: Array<{ localConnector: string; targetInstanceId: string; targetConnector: string }>;
  materials: MaterialAssignment[];
  regions: ModuleRegionDetail[];
  paint: SelectedModulePaintDetail;
  paintLayers: PaintLayer[];
};

export type RigDetail = {
  templateId?: string;
  availableTemplates: Array<{
    id: string;
    requiredBones: string[];
    defaultSockets: string[];
  }>;
  sockets: Array<{ name: string; bone: string }>;
};

export type ConnectorOption = {
  instanceId: string;
  moduleId: string;
  connectorId: string;
  kind: string;
};

export type ConnectorDetail = {
  id: string;
  kind: string;
  attachment?: { targetInstanceId: string; targetConnector: string };
  snapTarget?: SnapTarget;
  compatibleTargets: ConnectorOption[];
};

export function resolveSelectedModuleId(
  document: DesktopDocument,
  selectedModuleId?: string
): string | undefined {
  if (
    selectedModuleId &&
    document.project.modules.some((module) => module.instanceId === selectedModuleId)
  ) {
    return selectedModuleId;
  }

  return document.project.modules[0]?.instanceId;
}

export function buildModuleCards(
  document: DesktopDocument,
  selectedModuleId?: string
): ModuleCard[] {
  const selected = resolveSelectedModuleId(document, selectedModuleId);

  return document.project.modules.map((instance) => {
    const descriptor = findDescriptor(document, instance);

    return {
      instanceId: instance.instanceId,
      moduleId: instance.moduleId,
      assetType: descriptor?.assetType ?? "character",
      attachmentCount: instance.connectorAttachments.length,
      materialCount: Object.keys(instance.materialSlots).length,
      selected: instance.instanceId === selected
    };
  });
}

export function buildModuleLibrary(document: DesktopDocument): ModuleLibraryEntry[] {
  return document.stylePack.modules.map((descriptor) => ({
    moduleId: descriptor.id,
    assetType: descriptor.assetType,
    connectorCount: descriptor.connectors.length,
    regionCount: descriptor.regions.length,
    materialZoneCount: descriptor.materialZones.length
  }));
}

export function buildSelectedModuleDetail(
  document: DesktopDocument,
  selectedModuleId?: string
): SelectedModuleDetail | undefined {
  const resolvedId = resolveSelectedModuleId(document, selectedModuleId);
  const instance = document.project.modules.find((module) => module.instanceId === resolvedId);

  if (!instance) {
    return undefined;
  }

  const descriptor = findDescriptor(document, instance);
  const availableMaterialIds = Array.from(
    new Set(document.stylePack.palettes.flatMap((palette) => palette.materials))
  ).sort();
  const materials = (descriptor?.materialZones ?? Object.keys(instance.materialSlots)).map((zone) => ({
    zone,
    materialId: instance.materialSlots[zone] ?? "unassigned",
    availableMaterialIds
  }));
  const regions = (descriptor?.regions ?? []).map((region) => {
    const current = instance.regionParams[region.id] ?? 0;
    const utilization =
      region.max === region.min ? 0 : (current - region.min) / (region.max - region.min);

    return {
      id: region.id,
      current,
      min: region.min,
      max: region.max,
      utilization: clamp(round(utilization), 0, 1)
    };
  });
  const paintLayers = document.project.paintLayers.filter((layer) =>
    paintLayerTargetsModule(layer, instance)
  );

  return {
    instanceId: instance.instanceId,
    moduleId: instance.moduleId,
    assetType: descriptor?.assetType ?? "character",
    position: instance.transform.position,
    rotation: instance.transform.rotation,
    scale: instance.transform.scale,
    connectors: (descriptor?.connectors ?? []).map((connector) => {
      const attachment = instance.connectorAttachments.find(
        (candidate) => candidate.localConnector === connector.id
      );
      const compatibleTargets = buildCompatibleConnectorTargets(document, instance, connector.kind);

      return {
        id: connector.id,
        kind: connector.kind,
        attachment: attachment
          ? {
              targetInstanceId: attachment.targetInstanceId,
              targetConnector: attachment.targetConnector
            }
          : undefined,
        snapTarget: buildDefaultSnapTarget(
          document,
          instance,
          connector.id,
          attachment,
          compatibleTargets
        ),
        compatibleTargets
      };
    }),
    attachments: instance.connectorAttachments,
    materials,
    regions,
    paint: buildModulePaintDetail(document, instance),
    paintLayers
  };
}

export function buildSetFillLayerPaletteRequest(zone: string, paletteId?: string): {
  zone: string;
  paletteId: string | null;
} {
  return {
    zone,
    paletteId: paletteId ? paletteId : null
  };
}

export function buildAddModuleDecalLayerRequest(instanceId: string, decalId: string): {
  instanceId: string;
  decalId: string;
} {
  return {
    instanceId,
    decalId
  };
}

export function buildRemoveModuleDecalLayerRequest(instanceId: string, decalId: string): {
  instanceId: string;
  decalId: string;
} {
  return {
    instanceId,
    decalId
  };
}

export function setFillLayerPalette(
  document: DesktopDocument,
  zone: string,
  paletteId?: string
): DesktopDocument {
  const paintLayers = replacePaintLayers(document.project.paintLayers, (layer) =>
    layer.type === "fill" && layer.target === zone
  , paletteId ? [{ type: "fill", target: zone, palette: paletteId }] : []);

  return {
    ...document,
    project: {
      ...document.project,
      paintLayers
    }
  };
}

export function addModuleDecalLayer(
  document: DesktopDocument,
  instanceId: string,
  decalId: string
): DesktopDocument {
  const alreadyExists = document.project.paintLayers.some(
    (layer) => layer.type === "decal" && layer.target === instanceId && layer.decalId === decalId
  );
  if (alreadyExists) {
    return document;
  }

  return {
    ...document,
    project: {
      ...document.project,
      paintLayers: [...document.project.paintLayers, { type: "decal", target: instanceId, decalId }]
    }
  };
}

export function removeModuleDecalLayer(
  document: DesktopDocument,
  instanceId: string,
  decalId: string
): DesktopDocument {
  return {
    ...document,
    project: {
      ...document.project,
      paintLayers: document.project.paintLayers.filter(
        (layer) => !(layer.type === "decal" && layer.target === instanceId && layer.decalId === decalId)
      )
    }
  };
}

function buildModulePaintDetail(
  document: DesktopDocument,
  instance: ModuleInstance
): SelectedModulePaintDetail {
  const descriptor = findDescriptor(document, instance);
  const materialZones = descriptor?.materialZones ?? Object.keys(instance.materialSlots);
  const availablePaletteIds = document.stylePack.palettes.map((palette) => palette.id);

  return {
    fills: materialZones.map((zone) => ({
      zone,
      paletteId: findFillLayer(document.project.paintLayers, zone)?.palette,
      availablePaletteIds
    })),
    decals: document.project.paintLayers.flatMap((layer) => {
      if (layer.type !== "decal" || layer.target !== instance.instanceId) {
        return [];
      }

      return [{ decalId: layer.decalId }];
    }),
    availableDecalIds: [...document.stylePack.decalIds]
  };
}

function replacePaintLayers(
  paintLayers: PaintLayer[],
  predicate: (layer: PaintLayer) => boolean,
  replacements: PaintLayer[]
): PaintLayer[] {
  const nextPaintLayers: PaintLayer[] = [];
  let inserted = false;

  for (const layer of paintLayers) {
    if (!predicate(layer)) {
      nextPaintLayers.push(layer);
      continue;
    }

    if (!inserted) {
      nextPaintLayers.push(...replacements);
      inserted = true;
    }
  }

  if (!inserted) {
    nextPaintLayers.push(...replacements);
  }

  return nextPaintLayers;
}

function findFillLayer(
  paintLayers: PaintLayer[],
  zone: string
): Extract<PaintLayer, { type: "fill" }> | undefined {
  return paintLayers.find(
    (layer): layer is Extract<PaintLayer, { type: "fill" }> =>
      layer.type === "fill" && layer.target === zone
  );
}

function buildCompatibleConnectorTargets(
  document: DesktopDocument,
  sourceInstance: ModuleInstance,
  localKind: string
): ConnectorOption[] {
  return document.project.modules
    .filter((candidate) => candidate.instanceId !== sourceInstance.instanceId)
    .flatMap((candidate) => {
      const descriptor = findDescriptor(document, candidate);
      return (descriptor?.connectors ?? [])
        .filter((connector) => connectorIsCompatible(document, localKind, connector.kind))
        .map((connector) => ({
          instanceId: candidate.instanceId,
          moduleId: candidate.moduleId,
          connectorId: connector.id,
          kind: connector.kind
        }));
    });
}

function buildDefaultSnapTarget(
  document: DesktopDocument,
  sourceInstance: ModuleInstance,
  localConnector: string,
  attachment: ModuleInstance["connectorAttachments"][number] | undefined,
  compatibleTargets: ConnectorOption[]
): SnapTarget | undefined {
  const attachedTarget = attachment
    ? compatibleTargets.find(
        (candidate) =>
          candidate.instanceId === attachment.targetInstanceId &&
          candidate.connectorId === attachment.targetConnector
      )
    : undefined;
  const target =
    attachedTarget ??
    compatibleTargets.reduce<ConnectorOption | undefined>((best, candidate) => {
      if (!best) {
        return candidate;
      }

      const candidateDistance = measureConnectorTargetDistance(document, sourceInstance, candidate.instanceId);
      const bestDistance = measureConnectorTargetDistance(document, sourceInstance, best.instanceId);
      if (candidateDistance < bestDistance) {
        return candidate;
      }

      if (candidateDistance > bestDistance) {
        return best;
      }

      const instanceComparison = candidate.instanceId.localeCompare(best.instanceId);
      if (instanceComparison !== 0) {
        return instanceComparison < 0 ? candidate : best;
      }

      return candidate.connectorId.localeCompare(best.connectorId) < 0 ? candidate : best;
    }, undefined);

  if (!target) {
    return undefined;
  }

  return {
    localConnector,
    targetInstanceId: target.instanceId,
    targetConnector: target.connectorId,
    label: `${target.instanceId} -> ${target.connectorId}`
  };
}

function measureConnectorTargetDistance(
  document: DesktopDocument,
  sourceInstance: ModuleInstance,
  targetInstanceId: string
): number {
  const targetInstance = document.project.modules.find(
    (candidate) => candidate.instanceId === targetInstanceId
  );
  if (!targetInstance) {
    return Number.POSITIVE_INFINITY;
  }

  const [sourceX, sourceY, sourceZ] = sourceInstance.transform.position;
  const [targetX, targetY, targetZ] = targetInstance.transform.position;

  return (sourceX - targetX) ** 2 + (sourceY - targetY) ** 2 + (sourceZ - targetZ) ** 2;
}

export function buildRigDetail(document: DesktopDocument): RigDetail {
  return {
    templateId: document.project.rig?.templateId ?? document.project.skeletonTemplate ?? undefined,
    availableTemplates: document.stylePack.rigTemplates.map((template) => ({
      id: template.id,
      requiredBones: template.requiredBones,
      defaultSockets: template.defaultSockets
    })),
    sockets: document.project.rig?.sockets ?? []
  };
}

function findDescriptor(
  document: DesktopDocument,
  instance: ModuleInstance
): ModuleDescriptor | undefined {
  return document.stylePack.modules.find((module) => module.id === instance.moduleId);
}

function paintLayerTargetsModule(layer: PaintLayer, instance: ModuleInstance): boolean {
  if (layer.type === "decal") {
    return layer.target === instance.instanceId;
  }

  return Object.prototype.hasOwnProperty.call(instance.materialSlots, layer.target);
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


