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

function swapMirrorToken(value: string): string {
  return value
    .replace(/_l_/g, "__mirror__")
    .replace(/_r_/g, "_l_")
    .replace(/__mirror__/g, "_r_")
    .replace(/_l$/g, "__mirror__")
    .replace(/_r$/g, "_l")
    .replace(/__mirror__$/g, "_r")
    .replace(/_l(?=\d)/g, "__mirror__")
    .replace(/_r(?=\d)/g, "_l")
    .replace(/__mirror__(?=\d)/g, "_r");
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

  mirrorModule(sourceInstanceId: string, mirroredInstanceId?: string): ModuleInstance {
    const project = requireProject(this.store.getState());
    const source = project.modules.find((candidate) => candidate.instanceId === sourceInstanceId);
    if (!source) {
      throw new Error(`Source instance not found: ${sourceInstanceId}`);
    }

    const mirrored: ModuleInstance = {
      instanceId: mirroredInstanceId ?? swapMirrorToken(source.instanceId),
      moduleId: swapMirrorToken(source.moduleId),
      transform: {
        position: [
          -source.transform.position[0],
          source.transform.position[1],
          source.transform.position[2]
        ],
        rotation: [...source.transform.rotation] as [number, number, number],
        scale: [...source.transform.scale] as [number, number, number]
      },
      connectorAttachments: source.connectorAttachments.map((attachment) => ({
        localConnector: swapMirrorToken(attachment.localConnector),
        targetInstanceId: swapMirrorToken(attachment.targetInstanceId),
        targetConnector: swapMirrorToken(attachment.targetConnector)
      })),
      materialSlots: { ...source.materialSlots },
      regionParams: { ...source.regionParams }
    };

    project.modules.push(mirrored);
    this.store.patch({ project });
    return mirrored;
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
