export type Vec3 = [number, number, number];

export type AssetType = "character" | "weapon" | "prop_small" | "vehicle_small";

export type DesktopPaths = {
  projectPath: string;
  stylePackPath: string;
  savePath?: string | null;
};

export type Transform = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type TransformField = "position" | "rotation" | "scale";

export type ConnectorAttachment = {
  localConnector: string;
  targetInstanceId: string;
  targetConnector: string;
};

export type ModuleInstance = {
  instanceId: string;
  moduleId: string;
  transform: Transform;
  connectorAttachments: ConnectorAttachment[];
  materialSlots: Record<string, string>;
  regionParams: Record<string, number>;
};

export type PaintLayer =
  | {
      type: "fill";
      target: string;
      palette: string;
    }
  | {
      type: "decal";
      target: string;
      decalId: string;
    };

export type PaintFillDetail = {
  zone: string;
  paletteId?: string;
  availablePaletteIds: string[];
};

export type PaintDecalDetail = {
  decalId: string;
};

export type SelectedModulePaintDetail = {
  fills: PaintFillDetail[];
  decals: PaintDecalDetail[];
  availableDecalIds: string[];
};

export type SocketBinding = {
  name: string;
  bone: string;
};

export type RigAssignment = {
  templateId: string;
  sockets: SocketBinding[];
};

export type DeclaredMetrics = {
  triangles: number;
  materials: number;
  textures: number;
  atlasWidth: number;
  atlasHeight: number;
  bones: number;
  sockets: number;
};

export type Project = {
  id: string;
  version: number;
  assetType: AssetType;
  stylePackId: string;
  skeletonTemplate?: string | null;
  modules: ModuleInstance[];
  paintLayers: PaintLayer[];
  rig?: RigAssignment | null;
  declaredMetrics: DeclaredMetrics;
};

export type Budget = {
  triangles: number;
  materials: number;
  textures: number;
  atlasWidth: number;
  atlasHeight: number;
  bones: number;
  sockets: number;
};

export type Palette = {
  id: string;
  materials: string[];
};

export type ModuleSourceAsset = {
  path: string;
  format: string;
};

export type ModuleDescriptor = {
  id: string;
  assetType: AssetType;
  sourceAsset?: string | ModuleSourceAsset;
  connectors: Array<{ id: string; kind: string }>;
  regions: Array<{ id: string; min: number; max: number }>;
  materialZones: string[];
};

export type RigTemplate = {
  id: string;
  requiredBones: string[];
  defaultSockets: string[];
};

export type StylePack = {
  id: string;
  version: number;
  supportedAssetTypes: AssetType[];
  budgets: Record<string, Budget>;
  connectorTaxonomy: Record<string, string[]>;
  palettes: Palette[];
  rigTemplates: RigTemplate[];
  modules: ModuleDescriptor[];
  decalIds: string[];
};

export type DesktopDocument = {
  project: Project;
  stylePack: StylePack;
  paths: DesktopPaths;
};

export type ValidationIssue = {
  code: string;
  severity: string;
  path: string;
  summary: string;
  detail: string;
  suggestedFix?: string;
};

export type ValidationReport = {
  status: "ok" | "warning" | "error";
  stats: {
    moduleCount: number;
    triangles: number;
    materials: number;
    textures: number;
  };
  issues: ValidationIssue[];
};

export type DesktopExportBundle = {
  document: DesktopDocument;
  report: ValidationReport;
  glbBytesBase64: string;
};

export type DesktopPreviewValue =
  | {
      kind: "vector3";
      value: Vec3;
    }
  | {
      kind: "scalar";
      value: number;
    }
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "missing";
    };

export type DesktopCommandChange = {
  path: string;
  before: DesktopPreviewValue;
  after: DesktopPreviewValue;
};

export type DesktopCommandDiff = {
  op: string;
  target: string;
  changes: DesktopCommandChange[];
};

export type DesktopCommandPreview = {
  document: DesktopDocument;
  diff: DesktopCommandDiff;
};

export type DesktopUndoSnapshot = {
  projectId: string;
  projectPath: string;
  stylePackPath: string;
  savePath: string;
  moduleImportPath?: string;
  selectedModuleId?: string;
  selectedLibraryModuleId?: string;
  authoredModuleIds?: string[];
  document?: DesktopDocument;
  report?: ValidationReport;
  exportBundle?: DesktopExportBundle;
};

export type DesktopHistoryEntry = {
  label: string;
  snapshot: DesktopUndoSnapshot;
};

export type DesktopHistoryState = {
  past: DesktopHistoryEntry[];
  future: DesktopHistoryEntry[];
};

export type SnapTarget = {
  localConnector: string;
  targetInstanceId: string;
  targetConnector: string;
  label: string;
};

export type SetTransformCommand = {
  op: "set_transform";
  instanceId: string;
  field: TransformField;
  value: Vec3;
};

export type SetRegionParamCommand = {
  op: "set_region_param";
  instanceId: string;
  region: string;
  value: number;
};

export type AssignMaterialZoneCommand = {
  op: "assign_material_zone";
  instanceId: string;
  zone: string;
  materialId: string;
};

export type AssignRigTemplateCommand = {
  op: "assign_rig_template";
  templateId: string;
};

export type SetConnectorAttachmentCommand = {
  op: "set_connector_attachment";
  instanceId: string;
  localConnector: string;
  targetInstanceId: string;
  targetConnector: string;
};

export type ClearConnectorAttachmentCommand = {
  op: "clear_connector_attachment";
  instanceId: string;
  localConnector: string;
};

export type AttachSocketCommand = {
  op: "attach_socket";
  name: string;
  bone: string;
};

export type EditCommand =
  | SetTransformCommand
  | SetRegionParamCommand
  | AssignMaterialZoneCommand
  | AssignRigTemplateCommand
  | SetConnectorAttachmentCommand
  | ClearConnectorAttachmentCommand
  | AttachSocketCommand;

export type ViewportTranslationMode = "xy";
export type ViewportScaleMode = "uniform";
export type ViewportRotationMode = "z";

export type ViewportTranslateCommit = {
  instanceId: string;
  position: Vec3;
  command: SetTransformCommand & {
    field: "position";
  };
};

export type ViewportScaleCommit = {
  instanceId: string;
  scale: Vec3;
  command: SetTransformCommand & {
    field: "scale";
  };
};

export type ViewportRotateCommit = {
  instanceId: string;
  rotation: Vec3;
  command: SetTransformCommand & {
    field: "rotation";
  };
};

