/**
 * Predefined targets for common runtimes, platforms, and architectures.
 *
 * @module
 */

import type { Architecture, Platform, RuntimeName, Target, TargetDefinition } from "./types.ts";

// =============================================================================
// Runtime Targets
// =============================================================================

/**
 * Deno runtime target
 *
 * TODO: Define capabilities specific to Deno
 * - Native TypeScript support
 * - Built-in testing
 * - Permissions system
 * - Web standard APIs
 */
export const deno: TargetDefinition = {
  id: "deno",
  runtime: "deno" as RuntimeName,
  capabilities: [],
  // TODO: Add Deno-specific capabilities
};

/**
 * Node.js runtime target
 *
 * TODO: Define capabilities specific to Node
 * - CommonJS support
 * - npm ecosystem
 * - Native modules
 * - process.* APIs
 */
export const node: TargetDefinition = {
  id: "node",
  runtime: "node" as RuntimeName,
  capabilities: [],
  // TODO: Add Node-specific capabilities
};

/**
 * Bun runtime target
 *
 * TODO: Define capabilities specific to Bun
 * - Fast startup
 * - Built-in bundler
 * - npm compatibility
 * - Native TypeScript
 */
export const bun: TargetDefinition = {
  id: "bun",
  runtime: "bun" as RuntimeName,
  capabilities: [],
  // TODO: Add Bun-specific capabilities
};

/**
 * Browser runtime target
 *
 * TODO: Define capabilities specific to browsers
 * - DOM APIs
 * - Web APIs
 * - No filesystem access
 * - No native modules
 */
export const browser: TargetDefinition = {
  id: "browser",
  runtime: "browser" as RuntimeName,
  capabilities: [],
  // TODO: Add Browser-specific capabilities
};

// =============================================================================
// Platform Targets
// =============================================================================

/**
 * macOS platform target
 *
 * TODO: Define macOS-specific capabilities
 */
export const darwin: TargetDefinition = {
  id: "darwin",
  platform: "darwin" as Platform,
  capabilities: [],
  // TODO: Add macOS-specific capabilities
};

/**
 * Linux platform target
 *
 * TODO: Define Linux-specific capabilities
 */
export const linux: TargetDefinition = {
  id: "linux",
  platform: "linux" as Platform,
  capabilities: [],
  // TODO: Add Linux-specific capabilities
};

/**
 * Windows platform target
 *
 * TODO: Define Windows-specific capabilities
 */
export const windows: TargetDefinition = {
  id: "windows",
  platform: "windows" as Platform,
  capabilities: [],
  // TODO: Add Windows-specific capabilities
};

// =============================================================================
// Architecture Targets
// =============================================================================

/**
 * x64 (AMD64) architecture target
 */
export const x64: TargetDefinition = {
  id: "x64",
  architecture: "x64" as Architecture,
  capabilities: [],
};

/**
 * ARM64 (aarch64) architecture target
 */
export const arm64: TargetDefinition = {
  id: "arm64",
  architecture: "arm64" as Architecture,
  capabilities: [],
};

// =============================================================================
// Composed Targets
// =============================================================================

/**
 * All predefined runtime targets
 */
export const runtimes: readonly TargetDefinition[] = [deno, node, bun, browser];

/**
 * All predefined platform targets
 */
export const platforms: readonly TargetDefinition[] = [darwin, linux, windows];

/**
 * All predefined architecture targets
 */
export const architectures: readonly TargetDefinition[] = [x64, arm64];

/**
 * All predefined targets
 */
export const allTargets: readonly TargetDefinition[] = [
  ...runtimes,
  ...platforms,
  ...architectures,
];

/**
 * Lookup a predefined target by ID
 *
 * TODO: Implement efficient lookup
 *
 * @param id - The target ID to look up
 * @returns The target definition or undefined
 */
export function getTarget(_id: string): TargetDefinition | undefined {
  // TODO: Build a Map for O(1) lookups
  // TODO: Support partial matching (e.g., "node" matches node target)
  throw new Error("Not implemented: getTarget");
}

/**
 * Get the current runtime target based on environment detection
 *
 * TODO: Implement runtime detection
 *
 * @returns The detected runtime target
 */
export function detectRuntime(): Target {
  // TODO: Check for Deno global
  // TODO: Check for Bun global
  // TODO: Check for Node process global
  // TODO: Check for browser window global
  throw new Error("Not implemented: detectRuntime");
}

/**
 * Get the current platform target based on environment detection
 *
 * TODO: Implement platform detection
 *
 * @returns The detected platform target
 */
export function detectPlatform(): Target {
  // TODO: Use Deno.build.os or process.platform or navigator.platform
  throw new Error("Not implemented: detectPlatform");
}

/**
 * Get the current architecture target based on environment detection
 *
 * TODO: Implement architecture detection
 *
 * @returns The detected architecture target
 */
export function detectArchitecture(): Target {
  // TODO: Use Deno.build.arch or process.arch
  throw new Error("Not implemented: detectArchitecture");
}

/**
 * Get the full current target (runtime + platform + architecture)
 *
 * TODO: Compose detected targets
 *
 * @returns The complete detected target
 */
export function detectCurrentTarget(): Target {
  // TODO: Compose detectRuntime, detectPlatform, detectArchitecture
  throw new Error("Not implemented: detectCurrentTarget");
}
