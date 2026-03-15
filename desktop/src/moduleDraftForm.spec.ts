import { describe, expect, it } from "vitest";
import {
  parseReusableModuleMaterialZones,
  validateReusableModuleRegionDraft
} from "./moduleDraftForm";

describe("moduleDraftForm", () => {
  it("parses comma-separated reusable material zones for authoring inputs", () => {
    expect(parseReusableModuleMaterialZones(" skin, trim , accent ,, ")).toEqual([
      "skin",
      "trim",
      "accent"
    ]);
  });

  it("deduplicates reusable material zones to keep authoring output deterministic", () => {
    expect(parseReusableModuleMaterialZones("skin, trim, skin, accent, trim")).toEqual([
      "skin",
      "trim",
      "accent"
    ]);
  });

  it("rejects invalid reusable region authoring values", () => {
    expect(validateReusableModuleRegionDraft("", "-0.1", "0.2")).toEqual({
      ok: false,
      error: "Region id is required."
    });
    expect(validateReusableModuleRegionDraft("brow_height", "abc", "0.2")).toEqual({
      ok: false,
      error: "Region min and max must both be valid numbers."
    });
    expect(validateReusableModuleRegionDraft("brow_height", "0.3", "0.2")).toEqual({
      ok: false,
      error: "Region min cannot be greater than max."
    });
  });
});
