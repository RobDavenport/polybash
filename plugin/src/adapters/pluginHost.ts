export interface PluginHost {
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  notify(message: string): void;
}
