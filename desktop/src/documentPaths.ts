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

export function ensureStylePackSavePath(path: string): string {
  if (path.endsWith(".stylepack.json")) {
    return path;
  }

  if (path.endsWith(".json")) {
    return `${path.slice(0, -".json".length)}.stylepack.json`;
  }

  return `${path}.stylepack.json`;
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

export function suggestStylePackSavePath(document?: DesktopDocument): string {
  if (document?.paths.stylePackPath) {
    const basePath = ensureStylePackSavePath(document.paths.stylePackPath);
    if (basePath.endsWith("_authored.stylepack.json")) {
      return basePath;
    }

    return `${basePath.slice(0, -".stylepack.json".length)}_authored.stylepack.json`;
  }

  const stylePackId = document?.stylePack.id ?? "style_pack";
  return `out/desktop/${stylePackId}_authored.stylepack.json`;
}
