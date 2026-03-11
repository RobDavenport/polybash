import { requireProject } from "../state/selectors";
import type { Store } from "../state/store";

export class RigController {
  constructor(private readonly store: Store) {}

  assignRigTemplate(templateId: string): void {
    const project = requireProject(this.store.getState());
    project.rig = project.rig ?? { templateId, sockets: [] };
    project.rig.templateId = templateId;
    this.store.patch({ project });
  }

  attachSocket(name: string, bone: string): void {
    const project = requireProject(this.store.getState());
    project.rig = project.rig ?? { templateId: "", sockets: [] };
    project.rig.sockets.push({ name, bone });
    this.store.patch({ project });
  }
}
