import type { ProjectData, StylePackData } from "../types";
import type { AppState } from "./store";

export function requireProject(state: AppState): ProjectData {
  if (!state.project) {
    throw new Error("No project loaded.");
  }
  return state.project;
}

export function requireStylePack(state: AppState): StylePackData {
  if (!state.stylePack) {
    throw new Error("No style pack loaded.");
  }
  return state.stylePack;
}
