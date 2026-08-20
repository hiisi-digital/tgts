/**
 * Target ID parsing utilities
 *
 * Parses target identifier strings into structured Target objects.
 *
 * @module
 */

import { capability, targetId } from "./types.ts";
import type { Architecture, Platform, RuntimeName, Target } from "./types.ts";

/**
 * Parse result for a target ID string
 */
export interface ParseResult {
  readonly success: boolean;
  readonly target?: Target;
  readonly error?: string;
}

/** Every runtime name the type union admits, as a value the runtime can test against. */
const RUNTIMES: readonly RuntimeName[] = [
  "deno",
  "node",
  "bun",
  "browser",
  "cloudflare",
  "edge",
];

/** Every platform the type union admits. */
const PLATFORMS: readonly Platform[] = [
  "darwin",
  "linux",
  "windows",
  "android",
  "ios",
  "freebsd",
];

/** Every architecture the type union admits. */
const ARCHITECTURES: readonly Architecture[] = ["x64", "arm64", "arm", "x86", "wasm32"];

/**
 * Validates a runtime name string.
 *
 * @param name - The runtime name to validate
 * @returns True if valid runtime name
 */
export function isValidRuntime(name: string): name is RuntimeName {
  return (RUNTIMES as readonly string[]).includes(name);
}

/**
 * Validates a platform name string.
 *
 * @param name - The platform name to validate
 * @returns True if valid platform name
 */
export function isValidPlatform(name: string): name is Platform {
  return (PLATFORMS as readonly string[]).includes(name);
}

/**
 * Validates an architecture name string.
 *
 * @param name - The architecture name to validate
 * @returns True if valid architecture name
 */
export function isValidArchitecture(name: string): name is Architecture {
  return (ARCHITECTURES as readonly string[]).includes(name);
}

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
  const trimmed = id.trim();
  if (trimmed === "") {
    return { success: false, error: "target id is empty" };
  }

  const parts = trimmed.split("-");
  if (parts.length > 3) {
    return {
      success: false,
      error:
        `target id "${trimmed}" has ${parts.length} segments; the format is runtime[-platform][-arch]`,
    };
  }

  const [runtime, ...rest] = parts;
  if (!isValidRuntime(runtime)) {
    return {
      success: false,
      error: `unknown runtime "${runtime}"; expected one of ${RUNTIMES.join(", ")}`,
    };
  }

  let platform: Platform | undefined;
  let architecture: Architecture | undefined;
  for (const segment of rest) {
    if (isValidPlatform(segment)) {
      if (platform !== undefined) {
        return { success: false, error: `target id "${trimmed}" names two platforms` };
      }
      if (architecture !== undefined) {
        return {
          success: false,
          error: `in "${trimmed}" the platform must come before the architecture`,
        };
      }
      platform = segment;
    } else if (isValidArchitecture(segment)) {
      if (architecture !== undefined) {
        return {
          success: false,
          error: `target id "${trimmed}" names two architectures`,
        };
      }
      architecture = segment;
    } else {
      return {
        success: false,
        error: `unknown segment "${segment}" in "${trimmed}"; expected a platform (${
          PLATFORMS.join(", ")
        }) or an architecture (${ARCHITECTURES.join(", ")})`,
      };
    }
  }

  return {
    success: true,
    target: {
      id: targetId(trimmed),
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
export function stringifyTarget(target: Target): string {
  const parts: string[] = [target.runtime.name];
  if (target.platform) parts.push(target.platform.name);
  if (target.architecture) parts.push(target.architecture.name);
  return parts.join("-");
}

/** Re-exported so callers can build capabilities without a second import. */
export { capability };
