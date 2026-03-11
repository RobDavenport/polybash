import { WasmCoreFacade, type WasmBindings } from "./coreFacade";

export interface WasmLoader {
  readonly ready: boolean;
  load(): Promise<WasmBindings>;
}

const missingBindings: WasmBindings = {
  validateProject: () => {
    throw new Error("WASM validate binding is not configured.");
  },
  exportProject: () => {
    throw new Error("WASM export binding is not configured.");
  }
};

export class StubWasmLoader implements WasmLoader {
  public ready = false;

  constructor(private readonly bindings: WasmBindings = missingBindings) {}

  async load(): Promise<WasmBindings> {
    this.ready = true;
    return this.bindings;
  }
}

export async function loadCoreFacade(loader: WasmLoader): Promise<WasmCoreFacade> {
  return new WasmCoreFacade(await loader.load());
}
