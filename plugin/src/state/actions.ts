import type { ProjectData, StylePackData, ValidationReport } from "../types";
import type { Store } from "./store";

export function setProject(store: Store, project: ProjectData): void {
  store.patch({ project });
}

export function setStylePack(store: Store, stylePack: StylePackData): void {
  store.patch({ stylePack });
}

export function setValidationReport(store: Store, validationReport: ValidationReport): void {
  store.patch({ validationReport });
}
