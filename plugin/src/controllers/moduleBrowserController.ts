import type { ModuleDescriptor } from "../types";
import { requireStylePack } from "../state/selectors";
import type { Store } from "../state/store";

export class ModuleBrowserController {
  constructor(private readonly store: Store) {}

  listModules(): ModuleDescriptor[] {
    return [...requireStylePack(this.store.getState()).modules];
  }
}
