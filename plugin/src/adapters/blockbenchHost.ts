import type { PluginHost } from "./pluginHost";

/**
 * Adapter seam for the future real Blockbench host integration.
 * Keep host-specific globals out of controller logic.
 */
export class BlockbenchHost implements PluginHost {
  async readText(_path: string): Promise<string> {
    throw new Error("BlockbenchHost.readText is not implemented yet.");
  }

  async writeText(_path: string, _contents: string): Promise<void> {
    throw new Error("BlockbenchHost.writeText is not implemented yet.");
  }

  notify(message: string): void {
    // Replace with Blockbench UI notification hook during host integration.
    console.info(`[PolyBash] ${message}`);
  }
}
