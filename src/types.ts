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
export const RUNTIMES = [
  "deno",
  "node",
  "bun",
  "browser",
  "cloudflare",
  "edge",
] as const;

/**
 * A runtime this crate knows about.
 *
 * Derived from {@link RUNTIMES} rather than written out beside it. The list and the union
 * used to be two declarations of the same thing in two files, with nothing tying them
 * together, so adding a runtime to one and not the other would have left the type
 * admitting a name every validator rejected.
 */
export type RuntimeName = typeof RUNTIMES[number];

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
export const PLATFORMS = [
  "darwin",
  "linux",
  "windows",
  "android",
  "ios",
  "freebsd",
] as const;

/** A platform this crate knows about. Derived from {@link PLATFORMS}. */
export type Platform = typeof PLATFORMS[number];

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
export const ARCHITECTURES = ["x64", "arm64", "arm", "x86", "wasm32"] as const;

/** An architecture this crate knows about. Derived from {@link ARCHITECTURES}. */
export type Architecture = typeof ARCHITECTURES[number];

/**
 * Whether this names a runtime this package knows.
 *
 * A type predicate rather than a boolean, so a caller that has asked the
 * question gets a narrowed type out of it and needs no cast. These live beside
 * the tables they narrow: `parse.ts` had them, and `parse.ts` imports this
 * module, so nothing here could reach them. The result was that this file
 * checked membership inline and then asserted the narrowing with a cast, which
 * is the same check written twice with the compiler trusting the second one.
 */
export function isValidRuntime(name: string): name is RuntimeName {
  return (RUNTIMES as readonly string[]).includes(name);
}

/** Whether this names a platform this package knows. */
export function isValidPlatform(name: string): name is Platform {
  return (PLATFORMS as readonly string[]).includes(name);
}

/** Whether this names an architecture this package knows. */
export function isValidArchitecture(name: string): name is Architecture {
  return (ARCHITECTURES as readonly string[]).includes(name);
}


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
 * Creates a branded `TargetId`, checking that it names something real.
 *
 * The segments are checked against the vocabularies above, not only against a shape. A
 * brand that admits `xyz-abc` guarantees nothing beyond "it has hyphens in the right
 * places", and this one used to: the shape check lived here and the vocabulary check lived
 * in `parseTargetId`, so the same string was valid or invalid depending on which door it
 * came through.
 *
 * @throws InvalidTargetIdError if the id is empty, has too many segments, or names a
 * runtime, platform or architecture this crate does not know.
 */
/** What a target id decomposes into, when it is a valid one. */
interface TargetIdParts {
  readonly runtime: RuntimeName;
  readonly platform?: Platform;
  readonly architecture?: Architecture;
}

/**
 * Decomposes a target id, or says why it is not one.
 *
 * The single place the format is decided. `targetId` and `parseTargetId` both come here, so
 * a string cannot be valid through one door and invalid through the other. They used to
 * each carry their own rules, and the rules were not the same: this one checked that every
 * segment was *a* platform or *an* architecture, in any order and any number, so
 * `deno-x64-linux`, `node-linux-linux` and `node-x64-x64` were accepted here and rejected
 * there. Over the whole vocabulary that is 546 ids of 5219 disagreeing.
 *
 * The format is `runtime[-platform][-arch]`: the runtime first, then at most one platform,
 * then at most one architecture, in that order.
 */
export function parseTargetIdParts(
  id: string,
): { ok: true; parts: TargetIdParts } | { ok: false; error: string } {
  const trimmed = id.trim();
  if (trimmed === "") {
    return { ok: false, error: "a target id cannot be empty" };
  }

  const segments = trimmed.split("-");
  if (segments.length > 3) {
    return {
      ok: false,
      error: `has ${segments.length} segments; the format is runtime[-platform][-arch]`,
    };
  }

  const [runtime, ...rest] = segments;
  // the predicate rather than a bare membership test, so `runtime` is narrowed
  // for the rest of this function and the return needs no cast to say what the
  // check already established.
  if (runtime === undefined || !isValidRuntime(runtime)) {
    return {
      ok: false,
      error: `unknown runtime "${runtime}"; expected one of ${RUNTIMES.join(", ")}`,
    };
  }

  let platform: Platform | undefined;
  let architecture: Architecture | undefined;

  for (const segment of rest) {
    if (isValidPlatform(segment)) {
      if (platform !== undefined) {
        return { ok: false, error: `target id "${trimmed}" names two platforms` };
      }
      if (architecture !== undefined) {
        return {
          ok: false,
          error: `in "${trimmed}" the platform must come before the architecture`,
        };
      }
      platform = segment;
    } else if (isValidArchitecture(segment)) {
      if (architecture !== undefined) {
        return { ok: false, error: `target id "${trimmed}" names two architectures` };
      }
      architecture = segment;
    } else {
      return {
        ok: false,
        error: `unknown segment "${segment}" in "${trimmed}"; expected a platform (${
          PLATFORMS.join(", ")
        }) or an architecture (${ARCHITECTURES.join(", ")})`,
      };
    }
  }

  return {
    ok: true,
    parts: {
      runtime,
      ...(platform !== undefined ? { platform } : {}),
      ...(architecture !== undefined ? { architecture } : {}),
    },
  };
}

/**
 * Mints a {@link TargetId} from a string, or refuses.
 *
 * The one door a branded id comes through. It parses the string into its axes
 * first, so an id that reaches the type system is one this module built and
 * agrees with, rather than any string a caller happened to cast.
 *
 * @param id the target id to validate, for example `deno-linux-x64`
 * @returns the same string, branded
 * @throws {InvalidTargetIdError} when the string is not a target id
 */
export function targetId(id: string): TargetId {
  const parsed = parseTargetIdParts(id);
  if (!parsed.ok) {
    throw new InvalidTargetIdError(id, parsed.error);
  }
  return id.trim() as TargetId;
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
 * One building block of a target: a runtime, a platform, an architecture, or a bundle of
 * capabilities. The predefined targets in `targets.ts` are these, and `compose` merges
 * several of them into a single {@link Target}.
 *
 * Unlike {@link Target}, the runtime, platform and architecture are the plain names rather
 * than their full definitions, and the id is an ordinary string: a definition is an input to
 * composition, not a composed result.
 */
export interface TargetDefinition {
  /** Identifier for this building block, for example "node" or "x64" */
  readonly id: string;
  /** The runtime this block contributes, if any */
  readonly runtime?: RuntimeName;
  /** The platform this block contributes, if any */
  readonly platform?: Platform;
  /** The architecture this block contributes, if any */
  readonly architecture?: Architecture;
  /** Capabilities this block contributes */
  readonly capabilities: readonly Capability[];
  /** Human-readable description */
  readonly description?: string;
}

/**
 * What {@link compose} accepts. Each spec contributes part of the resulting target, with
 * later specs overriding earlier ones where they conflict.
 */
export type TargetSpec = TargetDefinition;

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
  const trimmed = name.trim();
  if (trimmed === "") {
    throw new TypeError("a capability name cannot be empty");
  }
  // Dots separate a capability from its parent, which is what makes `fs.read`
  // imply `fs` in hasCapability. Anything else would make that relation
  // ambiguous, so the shape is enforced at construction.
  if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(trimmed)) {
    throw new TypeError(
      `capability "${name}" is not lowercase dot-separated alphanumerics`,
    );
  }
  return trimmed as Capability;
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
 * An unordered collection of capabilities, as carried by a target or required by a check.
 */
export type CapabilitySet = ReadonlySet<Capability>;

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
