import { describe, expect, it } from "vitest";
import { resolveViewportPointerTarget } from "./viewportController";

describe("resolveViewportPointerTarget", () => {
  it("prefers visible transform guides over plain mesh hits", () => {
    expect(
      resolveViewportPointerTarget(
        {
          object: {
            userData: {
              hitTarget: "transform-guide",
              mode: "scale",
              instanceId: "torso_01"
            }
          }
        },
        {
          object: {
            userData: {
              instanceId: "torso_01"
            }
          }
        }
      )
    ).toEqual({
      kind: "guide",
      mode: "scale",
      instanceId: "torso_01"
    });
  });

  it("falls back to the module hit when no guide target is present", () => {
    expect(
      resolveViewportPointerTarget(undefined, {
        object: {
          userData: {
            instanceId: "weapon_01"
          }
        }
      })
    ).toEqual({
      kind: "module",
      instanceId: "weapon_01"
    });
  });

  it("ignores malformed guide metadata instead of entering a hidden mode", () => {
    expect(
      resolveViewportPointerTarget(
        {
          object: {
            userData: {
              hitTarget: "transform-guide",
              mode: "skew",
              instanceId: "torso_01"
            }
          }
        },
        undefined
      )
    ).toBeUndefined();
  });
});
