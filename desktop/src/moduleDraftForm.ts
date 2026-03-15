export function parseReusableModuleMaterialZones(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((zone) => zone.trim())
    .filter((zone) => {
      if (!zone || seen.has(zone)) {
        return false;
      }

      seen.add(zone);
      return true;
    });
}

export function validateReusableModuleRegionDraft(
  id: string,
  min: string,
  max: string
):
  | { ok: true; region: { id: string; min: number; max: number } }
  | { ok: false; error: string } {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return {
      ok: false,
      error: "Region id is required."
    };
  }

  const minValue = Number(min);
  const maxValue = Number(max);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return {
      ok: false,
      error: "Region min and max must both be valid numbers."
    };
  }

  if (minValue > maxValue) {
    return {
      ok: false,
      error: "Region min cannot be greater than max."
    };
  }

  return {
    ok: true,
    region: {
      id: trimmedId,
      min: minValue,
      max: maxValue
    }
  };
}
