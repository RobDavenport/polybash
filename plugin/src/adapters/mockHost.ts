import type { PluginHost } from "./pluginHost";

export class MockHost implements PluginHost {
  private readonly files = new Map<string, string>();
  public readonly notifications: string[] = [];

  seedFile(path: string, contents: string): void {
    this.files.set(path, contents);
  }

  async readText(path: string): Promise<string> {
    const value = this.files.get(path);
    if (value === undefined) {
      throw new Error(`Missing file: ${path}`);
    }
    return value;
  }

  async writeText(path: string, contents: string): Promise<void> {
    this.files.set(path, contents);
  }

  notify(message: string): void {
    this.notifications.push(message);
  }

  snapshot(path: string): string | undefined {
    return this.files.get(path);
  }
}
