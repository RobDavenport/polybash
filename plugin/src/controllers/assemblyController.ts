import { requireProject } from "../state/selectors";
import type { Store } from "../state/store";
import type { ModuleInstance } from "../types";

function defaultTransform() {
  return {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number]
  };
}

export class AssemblyController {
  constructor(private readonly store: Store) {}

  addModule(moduleId: string, instanceId?: string): ModuleInstance {
    const state = this.store.getState();
    const project = requireProject(state);
    const module: ModuleInstance = {
      instanceId: instanceId ?? `${moduleId}_${project.modules.length + 1}`,
      moduleId,
      transform: defaultTransform(),
      connectorAttachments: [],
      materialSlots: {},
      regionParams: {}
    };
    project.modules.push(module);
    this.store.patch({ project });
    return module;
  }

  attachModule(
    sourceInstanceId: string,
    localConnector: string,
    targetInstanceId: string,
    targetConnector: string
  ): void {
    const project = requireProject(this.store.getState());
    const source = project.modules.find((candidate) => candidate.instanceId === sourceInstanceId);
    if (!source) {
      throw new Error(`Source instance not found: ${sourceInstanceId}`);
    }
    source.connectorAttachments.push({
      localConnector,
      targetInstanceId,
      targetConnector
    });
    this.store.patch({ project });
  }
}
