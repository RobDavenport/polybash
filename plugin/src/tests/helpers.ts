import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ProjectData, StylePackData, ValidationReport } from "../types";

export function loadProjectFixture(): ProjectData {
  const path = resolve(process.cwd(), "../fixtures/projects/valid/fighter_basic.zxmodel.json");
  return JSON.parse(readFileSync(path, "utf8")) as ProjectData;
}

export function loadStylePackFixture(): StylePackData {
  const path = resolve(process.cwd(), "../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");
  return JSON.parse(readFileSync(path, "utf8")) as StylePackData;
}

export function cleanReport(): ValidationReport {
  return {
    status: "ok",
    stats: {
      triangles: 1800,
      materials: 3,
      textures: 1,
      atlasWidth: 512,
      atlasHeight: 512,
      bones: 28,
      sockets: 1,
      moduleCount: 7
    },
    issues: []
  };
}
