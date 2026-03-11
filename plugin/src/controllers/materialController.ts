import { requireProject } from "../state/selectors";
import type { Store } from "../state/store";
import type { PaintLayer } from "../types";

export class MaterialController {
  constructor(private readonly store: Store) {}

  assignMaterialZone(instanceId: string, zone: string, materialId: string): void {
    const project = requireProject(this.store.getState());
    const instance = project.modules.find((candidate) => candidate.instanceId === instanceId);
    if (!instance) {
      throw new Error(`Module instance not found: ${instanceId}`);
    }
    instance.materialSlots[zone] = materialId;
    this.store.patch({ project });
  }

  addFillLayer(target: string, palette: string): PaintLayer {
    const project = requireProject(this.store.getState());
    const layer: PaintLayer = { type: "fill", target, palette };
    project.paintLayers.push(layer);
    this.store.patch({ project });
    return layer;
  }

  addDecalLayer(target: string, decalId: string): PaintLayer {
    const project = requireProject(this.store.getState());
    const layer: PaintLayer = { type: "decal", target, decalId };
    project.paintLayers.push(layer);
    this.store.patch({ project });
    return layer;
  }
}
