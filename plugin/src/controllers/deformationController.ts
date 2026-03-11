import { requireProject } from "../state/selectors";
import type { Store } from "../state/store";

export class DeformationController {
  constructor(private readonly store: Store) {}

  setRegionParam(instanceId: string, region: string, value: number): void {
    const project = requireProject(this.store.getState());
    const instance = project.modules.find((candidate) => candidate.instanceId === instanceId);
    if (!instance) {
      throw new Error(`Module instance not found: ${instanceId}`);
    }
    instance.regionParams[region] = value;
    this.store.patch({ project });
  }
}
