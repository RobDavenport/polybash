import type { PluginHost } from "../adapters/pluginHost";
import type { ProjectData, StylePackData } from "../types";
import { setProject, setStylePack } from "../state/actions";
import type { Store } from "../state/store";

export class ProjectController {
  constructor(
    private readonly host: PluginHost,
    private readonly store: Store
  ) {}

  createProject(project: ProjectData): void {
    setProject(this.store, project);
  }

  async openProject(path: string): Promise<ProjectData> {
    const data = JSON.parse(await this.host.readText(path)) as ProjectData;
    setProject(this.store, data);
    this.store.patch({ lastProjectPath: path });
    return data;
  }

  async saveProject(path?: string): Promise<string> {
    const state = this.store.getState();
    if (!state.project) {
      throw new Error("No project loaded.");
    }
    const resolvedPath = path ?? state.lastProjectPath ?? "project.zxmodel.json";
    await this.host.writeText(resolvedPath, JSON.stringify(state.project, null, 2));
    this.store.patch({ lastProjectPath: resolvedPath });
    return resolvedPath;
  }

  async loadStylePack(path: string): Promise<StylePackData> {
    const data = JSON.parse(await this.host.readText(path)) as StylePackData;
    setStylePack(this.store, data);
    this.store.patch({ lastStylePackPath: path });
    return data;
  }
}
