import type {
  DesktopCommandPreview,
  DesktopDocument,
  DesktopPreviewValue,
  ModuleDescriptor,
  ModuleSourceAsset,
  ModuleInstance,
  PaintLayer,
  SelectedModulePaintDetail,
  SnapTarget,
  ValidationIssue,
  ValidationReport,
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

export type ModuleLibrarySource = "stylePack" | "imported" | "authored";

export type ModuleLibraryFilter = "all" | "stylePack" | "imported" | "authored" | "inUse";

export type ModuleLibraryEntry = {
  moduleId: string;
  assetType: string;
  connectorCount: number;
  regionCount: number;
  materialZoneCount: number;
  placementCount: number;
  source: ModuleLibrarySource;
};

export type ModuleLibrarySummary = {
  total: number;
  stylePack: number;
  imported: number;
  authored: number;
  inUse: number;
};

export type ModuleLibraryPreview = {
  moduleId: string;
  assetType: string;
  connectorCount: number;
  regionCount: number;
  materialZoneCount: number;
  placementCount: number;
  placedInstanceIds: string[];
  source: ModuleLibrarySource;
  connectors: Array<{ id: string; kind: string }>;
  suggestedPlacements: Array<{
    localConnector: string;
    localKind: string;
    targetInstanceId: string;
    targetModuleId: string;
    targetConnector: string;
    targetKind: string;
    label: string;
  }>;

  materialZones: string[];
  regionIds: string[];
  sourceAsset?: ModuleSourceAsset;
  silhouette: {
    width: number;
    height: number;
    depth: number;
    dominantAxis: "x" | "y" | "z";
  };
  placementHint: string;
};

export type SuggestedPlacementAction = {
  key: string;
  label: string;
  placement: ModuleLibraryPreview["suggestedPlacements"][number];
};

export type SuggestedPlacementGroup = {
  localConnector: string;
  localKind: string;
  actions: SuggestedPlacementAction[];
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

export type SelectedModuleValidationDetail = {
  instanceId: string;
  moduleId: string;
  issues: ValidationIssue[];
  projectIssues: ValidationIssue[];
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

const moduleLibrarySearchIndex = new WeakMap<ModuleLibraryEntry, string>();

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


export type AddModuleAndSnapRequest = {
  moduleId: string;
  localConnector: string;
  targetInstanceId: string;
  targetConnector: string;
};

export type SuggestedPlacementAlternativeSummary = {
  actionCount: number;
  connectorCount: number;
  label: string;
};
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

export function buildModuleLibrary(
  document: DesktopDocument,
  authoredModuleIds: string[] = []
): ModuleLibraryEntry[] {
  const usageInstanceIdsMap = buildModuleUsageInstanceIdsMap(document);

  return document.stylePack.modules.map((descriptor) => {
    const placedInstanceIds = usageInstanceIdsMap.get(descriptor.id) ?? [];
    const entry: ModuleLibraryEntry = {
      moduleId: descriptor.id,
      assetType: descriptor.assetType,
      connectorCount: descriptor.connectors.length,
      regionCount: descriptor.regions.length,
      materialZoneCount: descriptor.materialZones.length,
      placementCount: placedInstanceIds.length,
      source: classifyModuleLibrarySource(descriptor, authoredModuleIds)
    };

    moduleLibrarySearchIndex.set(
      entry,
      buildModuleLibrarySearchText(entry, descriptor, placedInstanceIds)
    );

    return entry;
  });
}

export function buildModuleLibrarySummary(library: ModuleLibraryEntry[]): ModuleLibrarySummary {
  return {
    total: library.length,
    stylePack: library.filter((entry) => entry.source === "stylePack").length,
    imported: library.filter((entry) => entry.source === "imported").length,
    authored: library.filter((entry) => entry.source === "authored").length,
    inUse: library.filter((entry) => entry.placementCount > 0).length
  };
}

export function filterModuleLibrary(
  library: ModuleLibraryEntry[],
  filter: ModuleLibraryFilter
): ModuleLibraryEntry[] {
  if (filter === "all") {
    return library;
  }

  if (filter === "inUse") {
    return library.filter((entry) => entry.placementCount > 0);
  }

  return library.filter((entry) => entry.source === filter);
}

export function searchModuleLibrary(
  library: ModuleLibraryEntry[],
  query: string
): ModuleLibraryEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return library;
  }

  return library.filter((entry) => {
    const searchText = moduleLibrarySearchIndex.get(entry) ?? buildModuleLibrarySearchText(entry);
    return searchText.includes(normalizedQuery);
  });
}

export function buildModuleLibraryPreview(
  document: DesktopDocument,
  moduleId: string,
  authoredModuleIds: string[] = []
): ModuleLibraryPreview | undefined {
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor) {
    return undefined;
  }

  const silhouette = estimateLibrarySilhouette(descriptor);
  const placedInstanceIds = document.project.modules
    .filter((instance) => instance.moduleId === descriptor.id)
    .map((instance) => instance.instanceId);

  return {
    moduleId: descriptor.id,
    assetType: descriptor.assetType,
    connectorCount: descriptor.connectors.length,
    regionCount: descriptor.regions.length,
    materialZoneCount: descriptor.materialZones.length,
    placementCount: placedInstanceIds.length,
    placedInstanceIds,
    source: classifyModuleLibrarySource(descriptor, authoredModuleIds),
    connectors: descriptor.connectors.map((connector) => ({
      id: connector.id,
      kind: connector.kind
    })),
    suggestedPlacements: buildSuggestedModuleLibraryPlacements(document, descriptor),
    materialZones: [...descriptor.materialZones],
    regionIds: descriptor.regions.map((region) => region.id),
    sourceAsset: normalizeSourceAsset(descriptor.sourceAsset),
    silhouette,
    placementHint: buildPlacementHint(descriptor)
  };
}

export function resolvePrimarySuggestedPlacement(
  preview: ModuleLibraryPreview | undefined
): ModuleLibraryPreview["suggestedPlacements"][number] | undefined {
  return preview?.suggestedPlacements[0];
}

export function buildModuleLibraryAddActionLabel(
  preview: ModuleLibraryPreview | undefined
): string {
  return preview && preview.suggestedPlacements.length > 0
    ? "Add Without Snapping"
    : "Add Selected Module";
}

export function buildModuleLibraryAddActionHint(
  preview: ModuleLibraryPreview | undefined
): string | undefined {
  return preview && preview.suggestedPlacements.length > 0
    ? "Manual fallback: add at the default position without snapping."
    : undefined;
}

export function buildSuggestedPlacementActions(
  preview: ModuleLibraryPreview | undefined
): SuggestedPlacementAction[] {
  return preview?.suggestedPlacements.map((placement) => ({
    key: `${placement.localConnector}::${placement.targetInstanceId}::${placement.targetConnector}`,
    label: `Add and Snap to ${placement.targetInstanceId}::${placement.targetConnector}`,
    placement
  })) ?? [];
}

export function resolvePrimarySuggestedPlacementAction(
  preview: ModuleLibraryPreview | undefined
): SuggestedPlacementAction | undefined {
  return buildSuggestedPlacementActions(preview)[0];
}

export function buildAddModuleAndSnapRequest(
  moduleId: string,
  action: SuggestedPlacementAction
): AddModuleAndSnapRequest {
  return {
    moduleId,
    localConnector: action.placement.localConnector,
    targetInstanceId: action.placement.targetInstanceId,
    targetConnector: action.placement.targetConnector
  };
}

export function buildPrimarySuggestedPlacementRequest(
  moduleId: string,
  preview: ModuleLibraryPreview | undefined
): AddModuleAndSnapRequest | undefined {
  const action = resolvePrimarySuggestedPlacementAction(preview);
  return action ? buildAddModuleAndSnapRequest(moduleId, action) : undefined;
}


export function buildSuggestedPlacementAlternativeSummary(
  preview: ModuleLibraryPreview | undefined
): SuggestedPlacementAlternativeSummary | undefined {
  const groups = buildSuggestedPlacementGroups(preview);
  const actionCount = groups.reduce((total, group) => total + group.actions.length, 0);
  if (actionCount === 0) {
    return undefined;
  }

  const connectorCount = groups.length;
  return {
    actionCount,
    connectorCount,
    label: `${actionCount} alternative target${actionCount === 1 ? "" : "s"} across ${connectorCount} connector${connectorCount === 1 ? "" : "s"}`
  };
}

export function buildModuleLibrarySelectionFeedback(
  preview: ModuleLibraryPreview | undefined,
  selectedDetail: SelectedModuleDetail | undefined
): string | undefined {
  if (!preview || !selectedDetail || selectedDetail.moduleId !== preview.moduleId) {
    return undefined;
  }

  return preview.placementCount > 1
    ? `Selected in scene: ${selectedDetail.instanceId} (${preview.placementCount} placed)`
    : `Selected in scene: ${selectedDetail.instanceId}`;
}
export function buildSuggestedPlacementGroups(
  preview: ModuleLibraryPreview | undefined
): SuggestedPlacementGroup[] {
  const groups = new Map<string, SuggestedPlacementGroup>();

  for (const action of buildSuggestedPlacementActions(preview).slice(1)) {
    const key = `${action.placement.localConnector}::${action.placement.localKind}`;
    const existing = groups.get(key);
    if (existing) {
      existing.actions.push(action);
      continue;
    }

    groups.set(key, {
      localConnector: action.placement.localConnector,
      localKind: action.placement.localKind,
      actions: [action]
    });
  }

  return Array.from(groups.values());
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

export function buildSelectedModuleValidationDetail(
  report: ValidationReport | undefined,
  document: DesktopDocument,
  selectedModuleId?: string
): SelectedModuleValidationDetail | undefined {
  if (!report) {
    return undefined;
  }

  const resolvedId = resolveSelectedModuleId(document, selectedModuleId);
  const moduleIndex = document.project.modules.findIndex((module) => module.instanceId === resolvedId);
  if (moduleIndex < 0) {
    return undefined;
  }

  const instance = document.project.modules[moduleIndex];
  const modulePathPrefix = `/modules/${moduleIndex}`;

  return {
    instanceId: instance.instanceId,
    moduleId: instance.moduleId,
    issues: report.issues.filter((issue) => isSelectedModuleIssue(issue, modulePathPrefix)),
    projectIssues: report.issues.filter((issue) => !issue.path.startsWith("/modules/"))
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

function buildSuggestedModuleLibraryPlacements(
  document: DesktopDocument,
  descriptor: ModuleDescriptor
): ModuleLibraryPreview["suggestedPlacements"] {
  return descriptor.connectors
    .flatMap((connector) =>
      document.project.modules.flatMap((candidate) => {
        const candidateDescriptor = findDescriptor(document, candidate);
        if (!candidateDescriptor) {
          return [];
        }

        return candidateDescriptor.connectors
          .filter((targetConnector) => connectorIsCompatible(document, connector.kind, targetConnector.kind))
          .map((targetConnector) => ({
            localConnector: connector.id,
            localKind: connector.kind,
            targetInstanceId: candidate.instanceId,
            targetModuleId: candidate.moduleId,
            targetConnector: targetConnector.id,
            targetKind: targetConnector.kind,
            label: `${connector.id} -> ${candidate.instanceId}::${targetConnector.id}`
          }));
      })
    )
    .sort((left, right) => {
      const localComparison = left.localConnector.localeCompare(right.localConnector);
      if (localComparison !== 0) {
        return localComparison;
      }

      return compareSuggestedPlacementPriority(descriptor, left, right);
    });
}

function compareSuggestedPlacementPriority(
  descriptor: ModuleDescriptor,
  left: ModuleLibraryPreview["suggestedPlacements"][number],
  right: ModuleLibraryPreview["suggestedPlacements"][number]
): number {
  const leftPriority = getSuggestedPlacementPriority(descriptor, left);
  const rightPriority = getSuggestedPlacementPriority(descriptor, right);
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const instanceComparison = left.targetInstanceId.localeCompare(right.targetInstanceId);
  if (instanceComparison !== 0) {
    return instanceComparison;
  }

  return left.targetConnector.localeCompare(right.targetConnector);
}

function getSuggestedPlacementPriority(
  descriptor: ModuleDescriptor,
  placement: ModuleLibraryPreview["suggestedPlacements"][number]
): number {
  if (descriptor.assetType !== "weapon") {
    return 0;
  }

  const targetConnector = placement.targetConnector.toLowerCase();
  const targetInstanceId = placement.targetInstanceId.toLowerCase();
  if (targetConnector.includes("_r") || targetInstanceId.includes("_r")) {
    return 0;
  }
  if (targetConnector.includes("_l") || targetInstanceId.includes("_l")) {
    return 1;
  }

  return 2;
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

function buildModuleLibrarySearchText(
  entry: ModuleLibraryEntry,
  descriptor?: ModuleDescriptor,
  placedInstanceIds: string[] = []
): string {
  const sourceAsset = descriptor ? normalizeSourceAsset(descriptor.sourceAsset) : undefined;

  return [
    entry.moduleId,
    entry.assetType,
    entry.source,
    entry.placementCount > 0 ? "in use" : "unused",
    ...placedInstanceIds,
    ...(descriptor?.connectors.flatMap((connector) => [connector.id, connector.kind]) ?? []),
    ...(descriptor?.regions.map((region) => region.id) ?? []),
    ...(descriptor?.materialZones ?? []),
    sourceAsset?.path ?? "",
    sourceAsset?.format ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

function classifyModuleLibrarySource(
  descriptor: ModuleDescriptor,
  authoredModuleIds: string[] = []
): ModuleLibrarySource {
  if (authoredModuleIds.includes(descriptor.id)) {
    return "authored";
  }

  return normalizeSourceAsset(descriptor.sourceAsset) ? "imported" : "stylePack";
}

function normalizeSourceAsset(
  sourceAsset: ModuleDescriptor["sourceAsset"]
): ModuleSourceAsset | undefined {
  if (!sourceAsset) {
    return undefined;
  }

  if (typeof sourceAsset === "string") {
    const extension = sourceAsset.split(".").pop()?.toLowerCase() ?? "glb";
    return {
      path: sourceAsset,
      format: extension
    };
  }

  return sourceAsset;
}
function estimateLibrarySilhouette(descriptor: ModuleDescriptor): {
  width: number;
  height: number;
  depth: number;
  dominantAxis: "x" | "y" | "z";
} {
  const moduleId = descriptor.id.toLowerCase();

  if (moduleId.includes("weapon")) {
    return { width: 0.14, height: 1.28, depth: 0.1, dominantAxis: "y" };
  }

  if (moduleId.includes("torso")) {
    return { width: 1, height: 1.2, depth: 0.58, dominantAxis: "y" };
  }

  if (moduleId.includes("head")) {
    return { width: 0.68, height: 0.7, depth: 0.66, dominantAxis: "y" };
  }

  if (moduleId.includes("arm")) {
    return { width: 0.32, height: 0.96, depth: 0.32, dominantAxis: "y" };
  }

  if (moduleId.includes("leg")) {
    return { width: 0.34, height: 1.08, depth: 0.34, dominantAxis: "y" };
  }

  return { width: 0.6, height: 0.6, depth: 0.6, dominantAxis: "y" };
}

function buildModuleUsageInstanceIdsMap(document: DesktopDocument): Map<string, string[]> {
  const usageMap = new Map<string, string[]>();

  for (const module of document.project.modules) {
    const placedInstanceIds = usageMap.get(module.moduleId);
    if (placedInstanceIds) {
      placedInstanceIds.push(module.instanceId);
      continue;
    }

    usageMap.set(module.moduleId, [module.instanceId]);
  }

  return usageMap;
}

function buildPlacementHint(descriptor: ModuleDescriptor): string {
  const moduleId = descriptor.id.toLowerCase();

  if (moduleId.includes("weapon")) {
    return "Snaps to fighter hand sockets and works best as a right-hand starter weapon.";
  }

  if (moduleId.includes("head")) {
    return "Snaps onto torso neck sockets and is a good first placement after a torso.";
  }

  if (moduleId.includes("torso")) {
    return "Use as the anchor module before adding head, arms, legs, and weapon attachments.";
  }

  if (moduleId.includes("arm")) {
    return moduleId.endsWith("_l")
      ? "Snaps into the torso left arm socket and exposes a hand socket for weapons."
      : "Snaps into the torso right arm socket and exposes a hand socket for weapons.";
  }

  if (moduleId.includes("leg")) {
    return moduleId.endsWith("_l")
      ? "Snaps into the torso left leg socket to establish stance and silhouette."
      : "Snaps into the torso right leg socket to establish stance and silhouette.";
  }

  return "Preview the connector and material metadata before placing this module.";
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

function isSelectedModuleIssue(issue: ValidationIssue, modulePathPrefix: string): boolean {
  return issue.path === modulePathPrefix || issue.path.startsWith(`${modulePathPrefix}/`);
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






