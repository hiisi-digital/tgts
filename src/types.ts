/**
 * @module tgts/types
 * Core type definitions for the target system.
 */

// =============================================================================
// Runtime Types
// =============================================================================

/**
 * Supported JavaScript runtimes.
 */
export type RuntimeName = "deno" | "node" | "bun" | "browser" | "cloudflare" | "edge";

/**
 * Runtime version constraint.
 * @example ">=18.0.0", "^20.0.0", "1.40.0"
 */
export type RuntimeVersion = string;

/**
 * Runtime definition with optional version constraint.
 */
export interface RuntimeDefinition {
  readonly name: RuntimeName;
  readonly version?: RuntimeVersion;
  readonly displayName?: string;
}

// =============================================================================
// Platform Types
// =============================================================================

/**
 * Supported operating system platforms.
 */
export type Platform = "darwin" | "linux" | "windows" | "android" | "ios" | "freebsd";

/**
 * Platform definition with optional version.
 */
export interface PlatformDefinition {
  readonly name: Platform;
  readonly version?: string;
  readonly displayName?: string;
}

// =============================================================================
// Architecture Types
// =============================================================================

/**
 * Supported CPU architectures.
 */
export type Architecture = "x64" | "arm64" | "arm" | "x86" | "wasm32";

/**
 * Architecture definition.
 */
export interface ArchitectureDefinition {
  readonly name: Architecture;
  readonly displayName?: string;
}

// =============================================================================
// Target Types
// =============================================================================

/**
 * A target identifier string.
 * Format: runtime[-platform[-arch]]
 * @example "deno", "node-linux", "bun-darwin-arm64"
 */
export type TargetId = string & { readonly __brand: unique symbol };

/**
 * Creates a branded TargetId from a string.
 * TODO: Add validation for proper target format
 */
export function targetId(id: string): TargetId {
  // TODO: Validate format
  return id as TargetId;
}

/**
 * A complete target definition combining runtime, platform, and architecture.
 */
export interface Target {
  /** Unique identifier for this target */
  readonly id: TargetId;
  /** The runtime for this target */
  readonly runtime: RuntimeDefinition;
  /** Optional platform constraint */
  readonly platform?: PlatformDefinition;
  /** Optional architecture constraint */
  readonly architecture?: ArchitectureDefinition;
  /** Capabilities this target supports */
  readonly capabilities: readonly Capability[];
  /** Human-readable description */
  readonly description?: string;
}

/**
 * A pattern for matching targets.
 * Supports wildcards and partial matching.
 */
export interface TargetPattern {
  /** Runtime to match (or "*" for any) */
  readonly runtime?: RuntimeName | "*";
  /** Platform to match (or "*" for any) */
  readonly platform?: Platform | "*";
  /** Architecture to match (or "*" for any) */
  readonly architecture?: Architecture | "*";
  /** Required capabilities */
  readonly capabilities?: readonly Capability[];
}

// =============================================================================
// Capability Types
// =============================================================================

/**
 * A capability that a target may or may not support.
 * @example "fs.read", "fs.write", "net.fetch", "process.env"
 */
export type Capability = string & { readonly __capabilityBrand: unique symbol };

/**
 * Creates a branded Capability from a string.
 */
export function capability(name: string): Capability {
  // TODO: Validate format
  return name as Capability;
}

/**
 * Definition of a capability with metadata.
 */
export interface CapabilityDefinition {
  /** Unique identifier */
  readonly id: Capability;
  /** Human-readable description */
  readonly description?: string;
  /** Parent capability (for hierarchical capabilities) */
  readonly parent?: Capability;
  /** Whether this capability is experimental */
  readonly experimental?: boolean;
}

/**
 * Mapping of capabilities to targets that support them.
 */
export interface CapabilityRegistry {
  readonly capabilities: ReadonlyMap<Capability, CapabilityDefinition>;
  readonly targetCapabilities: ReadonlyMap<TargetId, readonly Capability[]>;
}

// =============================================================================
// Target Resolution Types
// =============================================================================

/**
 * Result of matching a target against a pattern.
 */
export interface TargetMatchResult {
  /** Whether the target matches the pattern */
  readonly matches: boolean;
  /** The target that was checked */
  readonly target: Target;
  /** The pattern that was used */
  readonly pattern: TargetPattern;
  /** Missing capabilities if match failed due to capabilities */
  readonly missingCapabilities?: readonly Capability[];
}

/**
 * Options for target resolution.
 */
export interface ResolveOptions {
  /** Prefer more specific targets */
  readonly preferSpecific?: boolean;
  /** Required capabilities */
  readonly requiredCapabilities?: readonly Capability[];
  /** Fallback target if no match found */
  readonly fallback?: Target;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error thrown when a target ID is invalid.
 */
export class InvalidTargetIdError extends Error {
  readonly targetId: string;

  constructor(targetId: string, reason?: string) {
    super(`Invalid target ID "${targetId}"${reason ? `: ${reason}` : ""}`);
    this.name = "InvalidTargetIdError";
    this.targetId = targetId;
  }
}

/**
 * Error thrown when a target is not found.
 */
export class TargetNotFoundError extends Error {
  readonly targetId: TargetId;

  constructor(targetId: TargetId) {
    super(`Target "${targetId}" not found`);
    this.name = "TargetNotFoundError";
    this.targetId = targetId;
  }
}

/**
 * Error thrown when a required capability is not supported.
 */
export class CapabilityNotSupportedError extends Error {
  readonly capability: Capability;
  readonly targetId: TargetId;

  constructor(capability: Capability, targetId: TargetId) {
    super(`Capability "${capability}" is not supported by target "${targetId}"`);
    this.name = "CapabilityNotSupportedError";
    this.capability = capability;
    this.targetId = targetId;
  }
}
