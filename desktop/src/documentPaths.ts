import type { DesktopDocument } from "./types";

export function resolveDialogPath(selection: string | string[] | null): string | undefined {
  if (!selection) {
    return undefined;
  }

  return Array.isArray(selection) ? selection[0] : selection;
}

export function ensureProjectSavePath(path: string): string {
  if (path.endsWith(".zxmodel.json") || path.endsWith(".json")) {
    return path;
  }

  return `${path}.zxmodel.json`;
}

export function suggestProjectSavePath(document?: DesktopDocument): string {
  if (document?.paths.savePath) {
    return document.paths.savePath;
  }

  if (document?.paths.projectPath) {
    return ensureProjectSavePath(document.paths.projectPath);
  }

  return "out/desktop/project.zxmodel.json";
}
