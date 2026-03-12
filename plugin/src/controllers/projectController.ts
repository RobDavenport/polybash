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

  createProjectFromTemplate(template: "fighter", projectId: string): ProjectData {
    const state = this.store.getState();
    const stylePack = state.stylePack;
    if (!stylePack) {
      throw new Error("No style pack loaded.");
    }

    const project: ProjectData = {
      version: 1,
      id: projectId,
      assetType: template === "fighter" ? "character" : "character",
      stylePackId: stylePack.id,
      skeletonTemplate: stylePack.rigTemplates[0]?.id ?? null,
      modules: [],
      paintLayers: [],
      rig: stylePack.rigTemplates[0]
        ? {
            templateId: stylePack.rigTemplates[0].id,
            sockets: []
          }
        : null,
      declaredMetrics: {
        triangles: 0,
        materials: 0,
        textures: 0,
        atlasWidth: 0,
        atlasHeight: 0,
        bones: 0,
        sockets: 0
      }
    };

    setProject(this.store, project);
    return project;
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
