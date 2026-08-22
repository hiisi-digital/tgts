/**
 * @module @hiisi/tgts
 *
 * What a build target is, as data: which runtime, which platform, which architecture, and
 * what that combination can actually reach for.
 *
 * The axes, the predefined targets, the capability sets and the operations over them
 * (compose, parse, resolve, match, capability queries, host detection) are all implemented.
 * Detection refuses rather than guessing: an unrecognised platform or architecture throws,
 * because a build that stops and says so beats one that silently picked wrong.
 *
 * @example
 * ```ts
 * import { compose, matchesTarget, targets } from "@hiisi/tgts";
 *
 * // predefined targets
 * const nodeLinux = compose(targets.node, targets.linux, targets.x64);
 *
 * // match against patterns
 * if (matchesTarget(nodeLinux, { runtime: "node", platform: "linux" })) {
 *   // target-specific code
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  Architecture,
  ArchitectureDefinition,
  Capability,
  CapabilityDefinition,
  CapabilityRegistry,
  CapabilitySet,
  Platform,
  PlatformDefinition,
  ResolveOptions,
  RuntimeDefinition,
  RuntimeName,
  RuntimeVersion,
  Target,
  TargetDefinition,
  TargetMatchResult,
  TargetPattern,
  TargetSpec,
} from "./src/types.ts";

export {
  capability,
  CapabilityNotSupportedError,
  InvalidTargetIdError,
  targetId,
  TargetNotFoundError,
} from "./src/types.ts";

export type { TargetId } from "./src/types.ts";

// =============================================================================
// Predefined Targets
// =============================================================================

export {
  allTargets,
  architectures,
  arm64,
  browser,
  bun,
  darwin,
  deno,
  detectArchitecture,
  detectCurrentTarget,
  detectPlatform,
  detectRuntime,
  getTarget,
  linux,
  node,
  platforms,
  resolveTarget,
  runtimes,
  windows,
  x64,
} from "./src/targets.ts";

// Re-export as namespace for convenience
export * as targets from "./src/targets.ts";

/**
 * The mapping from a raw host string into this module's vocabulary.
 *
 * Exported because this module owns the names. Anything that reads a platform
 * or an architecture off the host holds a raw string and needs a way in, and a
 * second mapping written elsewhere is how one estate ends up with two spellings
 * of one architecture.
 */
export { normaliseArchitecture, normalisePlatform } from "./src/targets.ts";

// =============================================================================
// Capabilities
// =============================================================================

export {
  createCapabilitySet,
  getCapabilities,
  hasAllCapabilities,
  hasAnyCapability,
  hasCapability,
  missingCapabilities,
  STANDARD_CAPABILITIES,
} from "./src/capabilities.ts";

// =============================================================================
// Composition
// =============================================================================

export {
  compose,
  decompose,
  extend,
  intersectCapabilities,
  mergeCapabilities,
} from "./src/compose.ts";

// =============================================================================
// Parsing
// =============================================================================

export {
  isValidArchitecture,
  isValidPlatform,
  isValidRuntime,
  parseTargetId,
  stringifyTarget,
} from "./src/parse.ts";

export type { ParseResult } from "./src/parse.ts";

// =============================================================================
// Matching
// =============================================================================

export {
  calculateSpecificity,
  findBestMatch,
  matchesAll,
  matchesAny,
  matchesTarget,
} from "./src/match.ts";
