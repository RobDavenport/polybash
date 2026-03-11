import type { CoreFacade } from "../bridge/coreFacade";
import { setValidationReport } from "../state/actions";
import { requireProject, requireStylePack } from "../state/selectors";
import type { Store } from "../state/store";
import type { ExportBundle, ValidationReport } from "../types";

export class ValidationController {
  constructor(
    private readonly store: Store,
    private readonly core: CoreFacade
  ) {}

  async validate(): Promise<ValidationReport> {
    const state = this.store.getState();
    const project = requireProject(state);
    const stylePack = requireStylePack(state);
    const report = await this.core.validate(project, stylePack);
    setValidationReport(this.store, report);
    return report;
  }

  async export(): Promise<ExportBundle> {
    const state = this.store.getState();
    const project = requireProject(state);
    const stylePack = requireStylePack(state);
    const bundle = await this.core.export(project, stylePack);
    setValidationReport(this.store, bundle.report);
    return bundle;
  }
}
