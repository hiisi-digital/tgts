/**
 * Capability system for targets
 *
 * Capabilities define what features a target supports.
 * This allows build tools to determine what code paths are valid for each target.
 *
 * @module
 */

import { capability } from "./types.ts";
import type { Capability, CapabilitySet, Target } from "./types.ts";

/**
 * Standard capability identifiers
 *
 * These are the coarse ones, and they are deliberately coarse: a build tool
 * asking "can this target touch the filesystem" is the common question, and a
 * target that supports `fs` supports `fs.read` by the parent relation below.
 */
export const STANDARD_CAPABILITIES: {
  readonly FS: Capability;
  readonly NET: Capability;
  readonly ENV: Capability;
  readonly PROCESS: Capability;
  readonly FFI: Capability;
  readonly WORKERS: Capability;
  readonly WASM: Capability;
  readonly CRYPTO: Capability;
  readonly WEBGPU: Capability;
  readonly DOM: Capability;
} = {
  /** File system access */
  FS: capability("fs"),
  /** Network access */
  NET: capability("net"),
  /** Environment variable access */
  ENV: capability("env"),
  /** Process/subprocess spawning */
  PROCESS: capability("process"),
  /** FFI/native bindings */
  FFI: capability("ffi"),
  /** Worker threads */
  WORKERS: capability("workers"),
  /** WebAssembly */
  WASM: capability("wasm"),
  /** Crypto APIs */
  CRYPTO: capability("crypto"),
  /** WebGPU */
  WEBGPU: capability("webgpu"),
  /** DOM access (browser only) */
  DOM: capability("dom"),
} as const;

/**
 * Creates a new capability set.
 *
 * A `ReadonlySet` deduplicates by construction, which is the whole requirement:
 * capabilities are an unordered collection and holding one twice means nothing.
 *
 * @param capabilities - The capabilities to include
 * @returns An immutable set of the given capabilities
 */
export function createCapabilitySet(...capabilities: Capability[]): CapabilitySet {
  return new Set(capabilities) as CapabilitySet;
}

/**
 * Gets the capabilities for a target.
 *
 * Reads what the target carries rather than inferring from its runtime: a target
 * is composed from definitions that each contribute capabilities, so by the time
 * one exists the question has already been answered. Inferring here as well
 * would give two sources for one fact.
 *
 * @param target - The target to get capabilities for
 * @returns Set of capabilities the target supports
 */
export function getCapabilities(target: Target): CapabilitySet {
  return new Set(target.capabilities) as CapabilitySet;
}

/**
 * Whether a target supports a capability.
 *
 * A capability implies its ancestors, so a target carrying `fs.read` answers yes
 * to `fs`. The relation runs one way only: carrying `fs` does not answer yes to
 * `fs.read`, because a coarse grant says nothing about which specific operation
 * is available.
 *
 * @param target - The target to check
 * @param wanted - The capability to look for
 * @returns True when the target supports it
 */
export function hasCapability(target: Target, wanted: Capability): boolean {
  const prefix = `${wanted}.`;
  return target.capabilities.some((held) => held === wanted || held.startsWith(prefix));
}

/**
 * Whether a target supports every one of the given capabilities.
 *
 * An empty list is satisfied by any target, which is the standard reading of a
 * universal over nothing and what makes an unconstrained pattern match.
 *
 * @param target - The target to check
 * @param wanted - The capabilities that must all be present
 * @returns True when none are missing
 */
export function hasAllCapabilities(
  target: Target,
  wanted: readonly Capability[],
): boolean {
  return wanted.every((c) => hasCapability(target, c));
}

/**
 * Whether a target supports at least one of the given capabilities.
 *
 * An empty list is satisfied by no target, which is the standard reading of an
 * existential over nothing.
 *
 * @param target - The target to check
 * @param wanted - The capabilities to look for
 * @returns True when at least one is present
 */
export function hasAnyCapability(
  target: Target,
  wanted: readonly Capability[],
): boolean {
  return wanted.some((c) => hasCapability(target, c));
}

/**
 * The capabilities a target lacks, in the order they were asked for.
 *
 * Order is preserved so a caller can report the first missing one and have that
 * match what the user wrote.
 *
 * @param target - The target to check
 * @param wanted - The capabilities required
 * @returns Those of `wanted` the target does not support
 */
export function missingCapabilities(
  target: Target,
  wanted: readonly Capability[],
): readonly Capability[] {
  return wanted.filter((c) => !hasCapability(target, c));
}
