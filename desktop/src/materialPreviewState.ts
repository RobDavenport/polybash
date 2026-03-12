import type { DesktopCommandPreview, EditCommand } from "./types";

export type PendingMaterialPreview = {
  instanceId: string;
  zone: string;
  materialId: string;
  successLabel: string;
  command: EditCommand;
  preview: DesktopCommandPreview;
};

export function matchesPendingMaterialPreview(
  instanceId: string,
  zone: string,
  pendingPreview?: PendingMaterialPreview
): pendingPreview is PendingMaterialPreview {
  return (
    pendingPreview !== undefined &&
    pendingPreview.instanceId === instanceId &&
    pendingPreview.zone === zone
  );
}

export function resolveMaterialSelectValue(
  instanceId: string,
  zone: string,
  currentMaterialId: string,
  pendingPreview?: PendingMaterialPreview
): string {
  return matchesPendingMaterialPreview(instanceId, zone, pendingPreview)
    ? pendingPreview.materialId
    : currentMaterialId;
}
