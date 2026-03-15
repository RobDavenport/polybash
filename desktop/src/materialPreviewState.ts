import type { DesktopCommandPreview, EditCommand, TransformField } from "./types";

export type PendingMaterialPreview = {
  kind: "material";
  instanceId: string;
  zone: string;
  materialId: string;
  successLabel: string;
  command: Extract<EditCommand, { op: "assign_material_zone" }>;
  preview: DesktopCommandPreview;
};

export type PendingTransformPreview = {
  kind: "transform";
  instanceId: string;
  field: TransformField;
  value: [number, number, number];
  successLabel: string;
  command: Extract<EditCommand, { op: "set_transform" }>;
  preview: DesktopCommandPreview;
};

export type PendingRigTemplatePreview = {
  kind: "rig_template";
  templateId: string;
  successLabel: string;
  command: Extract<EditCommand, { op: "assign_rig_template" }>;
  preview: DesktopCommandPreview;
};

export type PendingConnectorPreview = {
  kind: "connector";
  instanceId: string;
  localConnector: string;
  targetInstanceId?: string;
  targetConnector?: string;
  successLabel: string;
  command: Extract<EditCommand, { op: "set_connector_attachment" | "clear_connector_attachment" }>;
  preview: DesktopCommandPreview;
};

export type PendingSocketPreview = {
  kind: "socket";
  name: string;
  bone: string;
  successLabel: string;
  command: Extract<EditCommand, { op: "attach_socket" }>;
  preview: DesktopCommandPreview;
};

export type PendingRegionPreview = {
  kind: "region";
  instanceId: string;
  region: string;
  value: number;
  successLabel: string;
  command: Extract<EditCommand, { op: "set_region_param" }>;
  preview: DesktopCommandPreview;
};

export type PendingEditPreview =
  | PendingMaterialPreview
  | PendingRigTemplatePreview
  | PendingConnectorPreview
  | PendingSocketPreview
  | PendingRegionPreview
  | PendingTransformPreview;

export function matchesPendingMaterialPreview(
  instanceId: string,
  zone: string,
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingMaterialPreview {
  return (
    pendingPreview !== undefined &&
    pendingPreview.kind === "material" &&
    pendingPreview.instanceId === instanceId &&
    pendingPreview.zone === zone
  );
}

export function resolveMaterialSelectValue(
  instanceId: string,
  zone: string,
  currentMaterialId: string,
  pendingPreview?: PendingEditPreview
): string {
  return matchesPendingMaterialPreview(instanceId, zone, pendingPreview)
    ? pendingPreview.materialId
    : currentMaterialId;
}

export function matchesPendingRigTemplatePreview(
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingRigTemplatePreview {
  return pendingPreview !== undefined && pendingPreview.kind === "rig_template";
}

export function resolveRigTemplateValue(
  currentTemplateId: string | undefined,
  pendingPreview?: PendingEditPreview
): string | undefined {
  return matchesPendingRigTemplatePreview(pendingPreview)
    ? pendingPreview.templateId
    : currentTemplateId;
}

export function matchesPendingConnectorPreview(
  instanceId: string,
  localConnector: string,
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingConnectorPreview {
  return (
    pendingPreview !== undefined &&
    pendingPreview.kind === "connector" &&
    pendingPreview.instanceId === instanceId &&
    pendingPreview.localConnector === localConnector
  );
}

export function resolveConnectorSelectValue(
  instanceId: string,
  localConnector: string,
  currentAttachment:
    | {
        targetInstanceId: string;
        targetConnector: string;
      }
    | undefined,
  pendingPreview?: PendingEditPreview
): string {
  if (!matchesPendingConnectorPreview(instanceId, localConnector, pendingPreview)) {
    return currentAttachment
      ? `${currentAttachment.targetInstanceId}::${currentAttachment.targetConnector}`
      : "";
  }

  return pendingPreview.targetInstanceId && pendingPreview.targetConnector
    ? `${pendingPreview.targetInstanceId}::${pendingPreview.targetConnector}`
    : "";
}

export function matchesPendingSocketPreview(
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingSocketPreview {
  return pendingPreview !== undefined && pendingPreview.kind === "socket";
}

export function resolveVisibleSockets(
  sockets: Array<{ name: string; bone: string }>,
  pendingPreview?: PendingEditPreview
): Array<{ name: string; bone: string }> {
  return matchesPendingSocketPreview(pendingPreview)
    ? [...sockets, { name: pendingPreview.name, bone: pendingPreview.bone }]
    : sockets;
}

export function matchesPendingRegionPreview(
  instanceId: string,
  region: string,
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingRegionPreview {
  return (
    pendingPreview !== undefined &&
    pendingPreview.kind === "region" &&
    pendingPreview.instanceId === instanceId &&
    pendingPreview.region === region
  );
}

export function resolveRegionSliderValue(
  instanceId: string,
  region: string,
  currentValue: number,
  pendingPreview?: PendingEditPreview
): number {
  return matchesPendingRegionPreview(instanceId, region, pendingPreview)
    ? pendingPreview.value
    : currentValue;
}

export function matchesPendingTransformPreview(
  instanceId: string,
  field: TransformField,
  pendingPreview?: PendingEditPreview
): pendingPreview is PendingTransformPreview {
  return (
    pendingPreview !== undefined &&
    pendingPreview.kind === "transform" &&
    pendingPreview.instanceId === instanceId &&
    pendingPreview.field === field
  );
}

export function resolveTransformInputValue(
  instanceId: string,
  field: TransformField,
  axis: "x" | "y" | "z",
  currentValue: number,
  pendingPreview?: PendingEditPreview
): number {
  if (!matchesPendingTransformPreview(instanceId, field, pendingPreview)) {
    return currentValue;
  }

  const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
  return pendingPreview.value[axisIndex];
}