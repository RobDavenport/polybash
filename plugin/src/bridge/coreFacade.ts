import type {
  ExportBundle,
  ProjectData,
  StylePackData,
  ValidationReport
} from "../types";

export interface CoreFacade {
  validate(project: ProjectData, stylePack: StylePackData): Promise<ValidationReport>;
  export(project: ProjectData, stylePack: StylePackData): Promise<ExportBundle>;
}

export interface WasmBindings {
  validateProject(
    projectJson: string,
    stylePackJson: string
  ): string | Promise<string>;
  exportProject(projectJson: string, stylePackJson: string): string | Promise<string>;
}

interface BridgeErrorPayload {
  code: string;
  message: string;
  validationReport?: ValidationReport;
}

function encodeAsciiBase64(value: string): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = Array.from(value).map((character) => character.charCodeAt(0) & 0xff);
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;

    const chunk = (a << 16) | (b << 8) | c;

    output += alphabet[(chunk >> 18) & 0x3f];
    output += alphabet[(chunk >> 12) & 0x3f];
    output += index + 1 < bytes.length ? alphabet[(chunk >> 6) & 0x3f] : "=";
    output += index + 2 < bytes.length ? alphabet[chunk & 0x3f] : "=";
  }

  return output;
}

function parseBridgeJson<T>(payload: string, operation: string): T {
  try {
    return JSON.parse(payload) as T;
  } catch {
    throw new WasmBridgeError(
      "INVALID_BRIDGE_PAYLOAD",
      `${operation} returned invalid JSON.`
    );
  }
}

function asBridgeErrorPayload(value: unknown): BridgeErrorPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.code !== "string" || typeof candidate.message !== "string") {
    return null;
  }

  return {
    code: candidate.code,
    message: candidate.message,
    validationReport: candidate.validationReport as ValidationReport | undefined
  };
}

function toBridgeError(error: unknown): WasmBridgeError {
  if (error instanceof WasmBridgeError) {
    return error;
  }

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : String(error);

  try {
    const parsed = JSON.parse(raw) as unknown;
    const payload = asBridgeErrorPayload(parsed);
    if (payload) {
      return new WasmBridgeError(
        payload.code,
        payload.message,
        payload.validationReport
      );
    }
  } catch {
    // Fall back to a generic bridge error below.
  }

  return new WasmBridgeError("WASM_BRIDGE_ERROR", raw);
}

export class WasmBridgeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly validationReport?: ValidationReport
  ) {
    super(message);
    this.name = "WasmBridgeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InMemoryCoreFacade implements CoreFacade {
  constructor(
    private readonly reportFactory: (
      project: ProjectData,
      stylePack: StylePackData
    ) => ValidationReport
  ) {}

  async validate(project: ProjectData, stylePack: StylePackData): Promise<ValidationReport> {
    return this.reportFactory(project, stylePack);
  }

  async export(project: ProjectData, stylePack: StylePackData): Promise<ExportBundle> {
    return {
      report: this.reportFactory(project, stylePack),
      glbBytesBase64: encodeAsciiBase64(`glTF:${project.id}:${stylePack.id}`)
    };
  }
}

export class WasmCoreFacade implements CoreFacade {
  constructor(private readonly bindings: WasmBindings) {}

  async validate(
    project: ProjectData,
    stylePack: StylePackData
  ): Promise<ValidationReport> {
    return this.invoke("validateProject", () =>
      this.bindings.validateProject(
        JSON.stringify(project),
        JSON.stringify(stylePack)
      )
    );
  }

  async export(project: ProjectData, stylePack: StylePackData): Promise<ExportBundle> {
    return this.invoke("exportProject", () =>
      this.bindings.exportProject(
        JSON.stringify(project),
        JSON.stringify(stylePack)
      )
    );
  }

  private async invoke<T>(
    operation: string,
    run: () => string | Promise<string>
  ): Promise<T> {
    try {
      const payload = await run();
      return parseBridgeJson<T>(payload, operation);
    } catch (error) {
      throw toBridgeError(error);
    }
  }
}
