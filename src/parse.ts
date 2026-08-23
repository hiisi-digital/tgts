/**
 * Target ID parsing utilities
 *
 * Parses target identifier strings into structured Target objects.
 *
 * @module
 */

import {
  ARCHITECTURES,
  capability,
  parseTargetIdParts,
  PLATFORMS,
  RUNTIMES,
  targetId,
} from "./types.ts";
import type { Architecture, Platform, RuntimeName, Target } from "./types.ts";

/**
 * What {@link parseTargetId} answers with.
 *
 * A discriminated union rather than one shape with two optional fields, so checking
 * `success` narrows and a caller cannot reach for `target` on a failure or `error` on a
 * success. The optional-fields form admitted `{ success: true }` carrying no target at all,
 * which is a state the function never produces and every caller had to defend against with
 * a non-null assertion.
 */
export type ParseResult =
  | { readonly success: true; readonly target: Target; readonly error?: undefined }
  | { readonly success: false; readonly target?: undefined; readonly error: string };

/** Every runtime name the type union admits, as a value the runtime can test against. */
// The vocabularies live beside the types they define, in types.ts, and the types are
// derived from them. They used to be restated here as arrays typed against the unions,
// which is two declarations of one list with nothing tying them together: adding a runtime
// to the union and not to the array would have left the type admitting a name every
// validator here rejected.

// The three validity predicates live in `types.ts`, beside the tables they
// narrow, and are re-exported here because this is where consumers have always
// imported them from.
export { isValidArchitecture, isValidPlatform, isValidRuntime } from "./types.ts";

/**
 * Parses a target ID string into a Target object.
 *
 * Target IDs follow the format `runtime[-platform][-arch]`:
 *
 * - `"deno"` gives `{ runtime: "deno" }`
 * - `"node-linux"` gives `{ runtime: "node", platform: "linux" }`
 * - `"bun-darwin-arm64"` gives all three
 * - `"deno-x64"` gives a runtime and an architecture, with no platform
 *
 * The platform is optional independently of the architecture, which the earlier
 * `runtime[-platform[-arch]]` spelling did not allow. That mattered because
 * `compose` can build a runtime-and-architecture target, and its id has to parse
 * back or the two halves of this package disagree about what a target is.
 *
 * Segments stay ordered: runtime, then platform, then architecture. The three
 * unions are disjoint, so no segment is ambiguous about which axis it belongs
 * to, but accepting them in any order would make the id non-canonical and break
 * round-tripping through {@link stringifyTarget}. So `"linux-node"` and
 * `"deno-x64-linux"` are both refused.
 *
 * Returns a result rather than throwing, because parsing user input is the
 * expected path here and a failed parse is data, not an exception.
 *
 * @param id - The target ID string to parse
 * @returns ParseResult with target or error
 */
export function parseTargetId(id: string): ParseResult {
  // The format lives in `parseTargetIdParts`, which `targetId` also calls, so the two
  // cannot disagree about what a valid id is. They used to each carry their own rules.
  const parsed = parseTargetIdParts(id);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  const { runtime, platform, architecture } = parsed.parts;
  return {
    success: true,
    target: {
      id: targetId(id),
      runtime: { name: runtime },
      ...(platform !== undefined ? { platform: { name: platform } } : {}),
      ...(architecture !== undefined ? { architecture: { name: architecture } } : {}),
      capabilities: [],
    },
  };
}

/**
 * Renders a target back to its ID string.
 *
 * The inverse of {@link parseTargetId} for any target that came from it, so
 * `parseTargetId(stringifyTarget(t))` gives back an equal target. It reads the
 * runtime, platform and architecture rather than the stored `id`, so a target
 * built by composition renders correctly without anyone maintaining its id by
 * hand.
 *
 * @param target - The target to render
 * @returns The canonical target ID string
 */
/**
 * The axes a target's name is spelled from.
 *
 * Naming this is what removes a cast rather than relocating one. Spelling a
 * target reads three axis names and nothing else, so asking for a whole
 * `Target` demanded an `id` from the one caller whose reason for calling is to
 * compute that id. It supplied `"" as Target["id"]`, which is the fabricated
 * brand this package's own compile-fail fixture names as the hole it cannot
 * close from outside.
 */
export type TargetAxes = Pick<Target, "runtime" | "platform" | "architecture">;

export function stringifyTarget(target: TargetAxes): string {
  const parts: string[] = [target.runtime.name];
  if (target.platform) parts.push(target.platform.name);
  if (target.architecture) parts.push(target.architecture.name);
  return parts.join("-");
}

/** Re-exported so callers can build capabilities without a second import. */
export { capability };
