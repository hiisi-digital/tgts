/**
 * Capability system for targets
 *
 * Capabilities define what features a target supports.
 * This allows build tools to determine what code paths are valid for each target.
 *
 * @module
 */

import type { Capability, CapabilitySet, Target } from "./types.ts";

/**
 * Standard capability identifiers
 *
 * TODO: Expand this list based on common runtime differences
 */
export const STANDARD_CAPABILITIES = {
  /** File system access */
  FS: "fs" as Capability,
  /** Network access */
  NET: "net" as Capability,
  /** Environment variable access */
  ENV: "env" as Capability,
  /** Process/subprocess spawning */
  PROCESS: "process" as Capability,
  /** FFI/native bindings */
  FFI: "ffi" as Capability,
  /** Worker threads */
  WORKERS: "workers" as Capability,
  /** WebAssembly */
  WASM: "wasm" as Capability,
  /** Crypto APIs */
  CRYPTO: "crypto" as Capability,
  /** WebGPU */
  WEBGPU: "webgpu" as Capability,
  /** DOM access (browser only) */
  DOM: "dom" as Capability,
} as const;

/**
 * Creates a new capability set
 *
 * TODO: Implement as immutable set
 */
export function createCapabilitySet(..._capabilities: Capability[]): CapabilitySet {
  // TODO: Create Set from capabilities
  // TODO: Deduplicate
  // TODO: Return frozen set
  throw new Error("Not implemented: createCapabilitySet");
}

/**
 * Gets the capabilities for a target
 *
 * TODO: Look up predefined capabilities based on target runtime/platform
 * TODO: Allow capability overrides per target
 *
 * @param target - The target to get capabilities for
 * @returns Set of capabilities the target supports
 */
export function getCapabilities(_target: Target): CapabilitySet {
  // TODO: Look up capabilities based on target.runtime
  // TODO: Merge with platform-specific capabilities
  // TODO: Return combined capability set
  throw new Error("Not implemented: getCapabilities");
}

/**
 * Checks if a target has a specific capability
 *
 * TODO: Implement capability lookup
 *
 * @param target - The target to check
 * @param capability - The capability to check for
 * @returns true if the target has the capability
 */
export function hasCapability(_target: Target, _capability: Capability): boolean {
  // TODO: Get capabilities for target
  // TODO: Check if capability is in set
  throw new Error("Not implemented: hasCapability");
}

/**
 * Checks if a target has all of the specified capabilities
 *
 * TODO: Implement as conjunction of hasCapability
 *
 * @param target - The target to check
 * @param capabilities - The capabilities required
 * @returns true if the target has ALL capabilities
 */
export function hasAllCapabilities(
  _target: Target,
  _capabilities: Capability[],
): boolean {
  // TODO: Check each capability
  // TODO: Return true only if all are present
  throw new Error("Not implemented: hasAllCapabilities");
}

/**
 * Checks if a target has any of the specified capabilities
 *
 * TODO: Implement as disjunction of hasCapability
 *
 * @param target - The target to check
 * @param capabilities - The capabilities to check for
 * @returns true if the target has ANY of the capabilities
 */
export function hasAnyCapability(
  _target: Target,
  _capabilities: Capability[],
): boolean {
  // TODO: Check each capability
  // TODO: Return true if at least one is present
  throw new Error("Not implemented: hasAnyCapability");
}

/**
 * Gets the difference between two capability sets
 *
 * TODO: Implement set difference
 *
 * @param required - The required capabilities
 * @param available - The available capabilities
 * @returns Capabilities in required but not in available
 */
export function missingCapabilities(
  _required: CapabilitySet,
  _available: CapabilitySet,
): Capability[] {
  // TODO: Compute set difference
  // TODO: Return missing capabilities as array
  throw new Error("Not implemented: missingCapabilities");
}
