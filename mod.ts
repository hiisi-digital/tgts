/**
 * @module @hiisi/tgts
 *
 * Target definitions for cross-runtime and cross-platform compilation.
 * Provides schemas for runtimes, platforms, architectures, and their capabilities.
 *
 * @example
 * ```ts
 * import { targets, compose, matchesTarget, targetId } from "@hiisi/tgts";
 *
 * // Use predefined targets
 * const nodeLinux = compose(targets.node, targets.linux, targets.x64);
 *
 * // Match against patterns
 * if (matchesTarget(nodeLinux, { runtime: "node", platform: "linux" })) {
 *   // Target-specific code
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
    TargetSpec
} from "./src/types.ts";

export {
    capability,
    CapabilityNotSupportedError,
    InvalidTargetIdError,
    targetId,
    TargetNotFoundError
} from "./src/types.ts";

export type { TargetId } from "./src/types.ts";

// =============================================================================
// Predefined Targets
// =============================================================================

export {
    allTargets,
    architectures,
    arm64, browser, bun,
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
    runtimes,
    windows,
    x64
} from "./src/targets.ts";

// Re-export as namespace for convenience
export * as targets from "./src/targets.ts";

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
    STANDARD_CAPABILITIES
} from "./src/capabilities.ts";

// =============================================================================
// Composition
// =============================================================================

export {
    compose,
    decompose,
    extend,
    intersectCapabilities,
    mergeCapabilities
} from "./src/compose.ts";

// =============================================================================
// Parsing
// =============================================================================

export {
    isValidArchitecture,
    isValidPlatform,
    isValidRuntime,
    parseTargetId,
    stringifyTarget
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
    matchesTarget
} from "./src/match.ts";

