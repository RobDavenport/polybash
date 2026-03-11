export type AssetType = "character" | "weapon" | "prop_small" | "vehicle_small";
export type Vec3 = [number, number, number];

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface ConnectorAttachment {
  localConnector: string;
  targetInstanceId: string;
  targetConnector: string;
}

export interface ModuleInstance {
  instanceId: string;
  moduleId: string;
  transform: Transform;
  connectorAttachments: ConnectorAttachment[];
  materialSlots: Record<string, string>;
  regionParams: Record<string, number>;
}

export type PaintLayer =
  | { type: "fill"; target: string; palette: string }
  | { type: "decal"; target: string; decalId: string };

export interface SocketBinding {
  name: string;
  bone: string;
}

export interface RigAssignment {
  templateId: string;
  sockets: SocketBinding[];
}

export interface DeclaredMetrics {
  triangles: number;
  materials: number;
  textures: number;
  atlasWidth: number;
  atlasHeight: number;
  bones: number;
  sockets: number;
}

export interface ProjectData {
  version: number;
  id: string;
  assetType: AssetType;
  stylePackId: string;
  skeletonTemplate?: string | null;
  modules: ModuleInstance[];
  paintLayers: PaintLayer[];
  rig?: RigAssignment | null;
  declaredMetrics: DeclaredMetrics;
}

export interface Budget {
  triangles: number;
  materials: number;
  textures: number;
  atlasWidth: number;
  atlasHeight: number;
  bones: number;
  sockets: number;
}

export interface Palette {
  id: string;
  materials: string[];
}

export interface RigTemplate {
  id: string;
  requiredBones: string[];
  defaultSockets: string[];
}

export interface ConnectorDescriptor {
  id: string;
  kind: string;
}

export interface RegionDescriptor {
  id: string;
  min: number;
  max: number;
}

export interface ModuleDescriptor {
  id: string;
  assetType: AssetType;
  connectors: ConnectorDescriptor[];
  regions: RegionDescriptor[];
  materialZones: string[];
}

export interface StylePackData {
  version: number;
  id: string;
  supportedAssetTypes: AssetType[];
  budgets: Record<string, Budget>;
  connectorTaxonomy: Record<string, string[]>;
  palettes: Palette[];
  rigTemplates: RigTemplate[];
  modules: ModuleDescriptor[];
  decalIds: string[];
}

export type ReportStatus = "ok" | "warning" | "error";
export type IssueSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  code: string;
  severity: IssueSeverity;
  path: string;
  summary: string;
  detail: string;
  suggestedFix?: string | null;
}

export interface ValidationReport {
  status: ReportStatus;
  stats: {
    triangles: number;
    materials: number;
    textures: number;
    atlasWidth: number;
    atlasHeight: number;
    bones: number;
    sockets: number;
    moduleCount: number;
  };
  issues: ValidationIssue[];
}

export interface ExportBundle {
  report: ValidationReport;
  glbBytesBase64: string;
}
