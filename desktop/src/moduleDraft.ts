import type { DesktopDocument, ModuleDescriptor } from "./types";

export type ReusableModuleDraft = {
  id: string;
  assetType: ModuleDescriptor["assetType"];
  sourceAsset?: ModuleDescriptor["sourceAsset"];
  connectors: Array<{ id: string; kind: string }>;
  regions: Array<{ id: string; min: number; max: number }>;
  materialZones: string[];
};

export type DuplicateReusableModuleResult = {
  document: DesktopDocument;
  duplicateId: string;
};

export type RenameReusableModuleResult = {
  document: DesktopDocument;
  previousId: string;
  renamedId: string;
};

export type DeleteReusableModuleResult = {
  document: DesktopDocument;
  removedId: string;
  removedInstanceIds: string[];
};

export function createReusableModuleDraft(
  document: DesktopDocument,
  moduleId: string
): ReusableModuleDraft | undefined {
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor) {
    return undefined;
  }

  return {
    id: descriptor.id,
    assetType: descriptor.assetType,
    sourceAsset: cloneSourceAsset(descriptor.sourceAsset),
    connectors: descriptor.connectors.map((connector) => ({ ...connector })),
    regions: descriptor.regions.map((region) => ({ ...region })),
    materialZones: [...descriptor.materialZones]
  };
}

export function suggestDuplicateReusableModuleId(
  document: DesktopDocument,
  moduleId: string
): string | undefined {
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor) {
    return undefined;
  }

  return nextDuplicateModuleId(document, moduleId);
}

export function duplicateReusableModule(
  document: DesktopDocument,
  moduleId: string,
  duplicateId?: string
): DuplicateReusableModuleResult | undefined {
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor) {
    return undefined;
  }

  const normalizedDuplicateId = duplicateId?.trim();
  const nextDuplicateId = normalizedDuplicateId || nextDuplicateModuleId(document, moduleId);
  if (document.stylePack.modules.some((module) => module.id === nextDuplicateId)) {
    return undefined;
  }

  const duplicatedDescriptor: ModuleDescriptor = {
    id: nextDuplicateId,
    assetType: descriptor.assetType,
    sourceAsset: cloneSourceAsset(descriptor.sourceAsset),
    connectors: descriptor.connectors.map((connector) => ({ ...connector })),
    regions: descriptor.regions.map((region) => ({ ...region })),
    materialZones: [...descriptor.materialZones]
  };

  return {
    duplicateId: nextDuplicateId,
    document: {
      ...document,
      stylePack: {
        ...document.stylePack,
        modules: [...document.stylePack.modules, duplicatedDescriptor]
      }
    }
  };
}

export function renameReusableModule(
  document: DesktopDocument,
  moduleId: string,
  nextModuleId: string
): RenameReusableModuleResult | undefined {
  const normalizedModuleId = nextModuleId.trim();
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor || !normalizedModuleId || normalizedModuleId === moduleId) {
    return undefined;
  }

  if (document.stylePack.modules.some((module) => module.id === normalizedModuleId)) {
    return undefined;
  }

  return {
    previousId: moduleId,
    renamedId: normalizedModuleId,
    document: {
      ...document,
      project: {
        ...document.project,
        modules: document.project.modules.map((module) =>
          module.moduleId === moduleId
            ? {
                ...module,
                moduleId: normalizedModuleId
              }
            : module
        )
      },
      stylePack: {
        ...document.stylePack,
        modules: document.stylePack.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                id: normalizedModuleId
              }
            : module
        )
      }
    }
  };
}

export function deleteReusableModule(
  document: DesktopDocument,
  moduleId: string
): DeleteReusableModuleResult | undefined {
  const descriptor = document.stylePack.modules.find((module) => module.id === moduleId);
  if (!descriptor) {
    return undefined;
  }

  const removedInstanceIds = document.project.modules
    .filter((module) => module.moduleId === moduleId)
    .map((module) => module.instanceId);
  const removedInstanceIdSet = new Set(removedInstanceIds);

  return {
    removedId: moduleId,
    removedInstanceIds,
    document: {
      ...document,
      project: {
        ...document.project,
        modules: document.project.modules
          .filter((module) => module.moduleId !== moduleId)
          .map((module) => ({
            ...module,
            connectorAttachments: module.connectorAttachments.filter(
              (attachment) => !removedInstanceIdSet.has(attachment.targetInstanceId)
            )
          })),
        paintLayers: document.project.paintLayers.filter(
          (layer) => layer.type !== "decal" || !removedInstanceIdSet.has(layer.target)
        )
      },
      stylePack: {
        ...document.stylePack,
        modules: document.stylePack.modules.filter((module) => module.id !== moduleId)
      }
    }
  };
}

export function updateReusableModuleDraftConnector(
  draft: ReusableModuleDraft,
  connectorId: string,
  patch: { id?: string; kind?: string }
): ReusableModuleDraft {
  return {
    ...draft,
    connectors: draft.connectors.map((connector) =>
      connector.id === connectorId
        ? {
            id: patch.id ?? connector.id,
            kind: patch.kind ?? connector.kind
          }
        : connector
    )
  };
}

export function addReusableModuleDraftRegion(
  draft: ReusableModuleDraft,
  region: { id: string; min: number; max: number }
): ReusableModuleDraft {
  return {
    ...draft,
    regions: [...draft.regions, region]
  };
}

export function setReusableModuleDraftMaterialZones(
  draft: ReusableModuleDraft,
  materialZones: string[]
): ReusableModuleDraft {
  return {
    ...draft,
    materialZones: [...materialZones]
  };
}

function cloneSourceAsset(
  sourceAsset: ModuleDescriptor["sourceAsset"]
): ModuleDescriptor["sourceAsset"] {
  if (!sourceAsset || typeof sourceAsset === "string") {
    return sourceAsset;
  }

  return { ...sourceAsset };
}

function nextDuplicateModuleId(document: DesktopDocument, moduleId: string): string {
  const baseModuleId = moduleId.replace(/_copy_\d+$/, "");

  for (let index = 1; index < Number.MAX_SAFE_INTEGER; index += 1) {
    const candidate = `${baseModuleId}_copy_${String(index).padStart(2, "0")}`;
    if (!document.stylePack.modules.some((module) => module.id === candidate)) {
      return candidate;
    }
  }

  throw new Error("reusable module id space exhausted");
}

export function parseReusableModuleDraftMaterialZones(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((zone) => zone.trim())
    .filter((zone) => {
      if (!zone || seen.has(zone)) {
        return false;
      }

      seen.add(zone);
      return true;
    });
}

export function applyReusableModuleDraft(
  document: DesktopDocument,
  draft: ReusableModuleDraft
): DesktopDocument {
  return {
    ...document,
    stylePack: {
      ...document.stylePack,
      modules: document.stylePack.modules.map((module) =>
        module.id === draft.id
          ? {
              id: draft.id,
              assetType: draft.assetType,
              sourceAsset: cloneSourceAsset(draft.sourceAsset),
              connectors: draft.connectors.map((connector) => ({ ...connector })),
              regions: draft.regions.map((region) => ({ ...region })),
              materialZones: [...draft.materialZones]
            }
          : module
      )
    }
  };
}
