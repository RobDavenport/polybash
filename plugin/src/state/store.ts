import type { ProjectData, StylePackData, ValidationReport } from "../types";

export interface AppState {
  project?: ProjectData;
  stylePack?: StylePackData;
  validationReport?: ValidationReport;
  lastProjectPath?: string;
  lastStylePackPath?: string;
}

export class Store {
  private state: AppState = {};

  getState(): AppState {
    return this.state;
  }

  replace(nextState: AppState): void {
    this.state = nextState;
  }

  patch(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
  }
}
