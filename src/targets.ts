/**
 * Predefined targets for common runtimes, platforms, and architectures.
 *
 * @module
 */

import { STANDARD_CAPABILITIES as CAP } from "./capabilities.ts";
import { compose } from "./compose.ts";
import { InvalidTargetIdError, parseTargetIdParts } from "./types.ts";
import type {
  Architecture,
  Capability,
  Platform,
  RuntimeName,
  Target,
  TargetDefinition,
} from "./types.ts";

// =============================================================================
// Runtime Targets
// =============================================================================

/**
 * Everything a server-side runtime is expected to reach. The three server
 * runtimes differ in how they expose these, not in whether they have them, so
 * the shared set is named once and the differences sit beside it.
 */
const SERVER_CAPABILITIES: readonly Capability[] = [
  CAP.FS,
  CAP.NET,
  CAP.ENV,
  CAP.PROCESS,
  CAP.WORKERS,
  CAP.WASM,
  CAP.CRYPTO,
];

/**
 * Deno runtime target.
 *
 * Carries FFI, which is what separates it from a browser, and WebGPU, which
 * Deno ships and Node does not.
 */
export const deno: TargetDefinition = {
  id: "deno",
  runtime: "deno" as RuntimeName,
  capabilities: [...SERVER_CAPABILITIES, CAP.FFI, CAP.WEBGPU],
  description: "Deno, with web-standard APIs and a permissions system",
};

/**
 * Node.js runtime target.
 *
 * FFI is present through native addons. WebGPU is not, which is the capability
 * a build has to branch on when targeting both Deno and Node.
 */
export const node: TargetDefinition = {
  id: "node",
  runtime: "node" as RuntimeName,
  capabilities: [...SERVER_CAPABILITIES, CAP.FFI],
  description: "Node.js, with native addons for FFI",
};

/**
 * Bun runtime target.
 *
 * Node-compatible surface plus its own FFI. Treated as its own runtime rather
 * than an alias for Node, because the build output differs.
 */
export const bun: TargetDefinition = {
  id: "bun",
  runtime: "bun" as RuntimeName,
  capabilities: [...SERVER_CAPABILITIES, CAP.FFI],
  description: "Bun, Node-compatible with its own FFI",
};

/**
 * Browser target.
 *
 * The narrow one, and the reason capabilities exist at all: no filesystem, no
 * environment, no subprocesses, no FFI. A code path reaching for any of those
 * cannot be emitted here.
 */
export const browser: TargetDefinition = {
  id: "browser",
  runtime: "browser" as RuntimeName,
  capabilities: [CAP.NET, CAP.WORKERS, CAP.WASM, CAP.CRYPTO, CAP.WEBGPU, CAP.DOM],
  description: "A browser, with no filesystem, environment or subprocesses",
};

// =============================================================================
// Platform Targets
// =============================================================================

/** macOS platform target. */
export const darwin: TargetDefinition = {
  id: "darwin",
  platform: "darwin" as Platform,
  capabilities: [],
  description: "macOS",
};

/** Linux platform target. */
export const linux: TargetDefinition = {
  id: "linux",
  platform: "linux" as Platform,
  capabilities: [],
  description: "Linux",
};

/** Windows platform target. */
export const windows: TargetDefinition = {
  id: "windows",
  platform: "windows" as Platform,
  capabilities: [],
  description: "Windows",
};

// =============================================================================
// Architecture Targets
// =============================================================================

/** x64 (AMD64) architecture target. */
export const x64: TargetDefinition = {
  id: "x64",
  architecture: "x64" as Architecture,
  capabilities: [],
  description: "x86-64",
};

/** ARM64 (aarch64) architecture target. */
export const arm64: TargetDefinition = {
  id: "arm64",
  architecture: "arm64" as Architecture,
  capabilities: [],
  description: "ARM64",
};

// =============================================================================
// Composed Targets
// =============================================================================

/** All predefined runtime targets. */
export const runtimes: readonly TargetDefinition[] = [deno, node, bun, browser];

/** All predefined platform targets. */
export const platforms: readonly TargetDefinition[] = [darwin, linux, windows];

/** All predefined architecture targets. */
export const architectures: readonly TargetDefinition[] = [x64, arm64];

/** All predefined targets. */
export const allTargets: readonly TargetDefinition[] = [
  ...runtimes,
  ...platforms,
  ...architectures,
];

/**
 * Built once at module load rather than per call, so a lookup in a loop over
 * every target does not rescan the list each time.
 */
const BY_ID: ReadonlyMap<string, TargetDefinition> = new Map(
  allTargets.map((t) => [t.id, t]),
);

/**
 * Looks up a predefined building block by id.
 *
 * Only the blocks in {@link allTargets}, which are single-axis by construction.
 * A composed id like `"node-linux"` is not a predefined block and returns
 * undefined; build one with {@link compose} or parse it with `parseTargetId`.
 *
 * @param id - The target ID to look up
 * @returns The target definition or undefined
 */
export function getTarget(id: string): TargetDefinition | undefined {
  return BY_ID.get(id);
}

/**
 * The globals each runtime is identified by.
 *
 * Order matters and is not alphabetical. Bun and Deno both provide enough of
 * `process` to be mistaken for Node, so they are tested first; Node is the
 * fallback among the server runtimes, and the browser is identified by a
 * `document` rather than by a bare `window`, which Deno also defines.
 */
const RUNTIME_PROBES: readonly (readonly [RuntimeName, () => boolean])[] = [
  ["deno", () => typeof (globalThis as Record<string, unknown>).Deno !== "undefined"],
  ["bun", () => typeof (globalThis as Record<string, unknown>).Bun !== "undefined"],
  [
    "node",
    () => {
      const p = (globalThis as { process?: { versions?: { node?: string } } }).process;
      return typeof p?.versions?.node === "string";
    },
  ],
  [
    "browser",
    () => typeof (globalThis as Record<string, unknown>).document !== "undefined",
  ],
];

/**
 * Detects the runtime this code is executing under.
 *
 * @returns The detected runtime as a target
 * @throws Error when no probe matches, rather than guessing a default: a wrong
 * runtime silently chosen is worse than a build that stops and says so
 */
export function detectRuntime(): Target {
  for (const [name, probe] of RUNTIME_PROBES) {
    if (probe()) return compose(getTarget(name)!);
  }
  throw new Error(
    `no known runtime detected; expected one of ${RUNTIME_PROBES.map(([n]) => n).join(", ")}`,
  );
}

/**
 * Maps what a runtime calls a platform onto this module's names.
 *
 * Public because this module owns the vocabulary, and anything holding a raw
 * host string needs a way in. Without it a consumer writes its own mapping,
 * and two mappings of the same three names is how `x86_64` and `x64` came to
 * mean the same architecture in two packages with no conversion between them.
 *
 * @returns the name, or `undefined` when this module does not know it. It does
 * not guess: an unrecognised platform is reported rather than defaulted.
 */
export function normalisePlatform(raw: string): Platform | undefined {
  switch (raw) {
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    case "windows":
    case "win32":
      return "windows";
    case "android":
      return "android";
    case "ios":
      return "ios";
    case "freebsd":
      return "freebsd";
    default:
      return undefined;
  }
}

/**
 * Maps what a runtime calls an architecture onto this module's names.
 *
 * Both spellings arrive in practice: node says `x64` and `arm64`, rust and
 * uname say `x86_64` and `aarch64`. They are the same two architectures, and
 * this is the only place that says so.
 *
 * @returns the name, or `undefined` when this module does not know it.
 */
export function normaliseArchitecture(raw: string): Architecture | undefined {
  switch (raw) {
    case "x86_64":
    case "x64":
      return "x64";
    case "aarch64":
    case "arm64":
      return "arm64";
    case "arm":
      return "arm";
    case "wasm32":
      return "wasm32";
    case "ia32":
    case "x86":
      return "x86";
    default:
      return undefined;
  }
}

/** What the host reports, read through whichever runtime is present. */
function hostBuild(): { os?: string; arch?: string } {
  const g = globalThis as {
    Deno?: { build?: { os?: string; arch?: string } };
    process?: { platform?: string; arch?: string };
  };
  if (g.Deno?.build) return { os: g.Deno.build.os, arch: g.Deno.build.arch };
  if (g.process) return { os: g.process.platform, arch: g.process.arch };
  return {};
}

/**
 * Detects the platform this code is executing on.
 *
 * @returns The detected platform, composed onto the detected runtime, because a
 * platform alone is not a target: nothing can be built for it
 * @throws Error when the host reports a platform this module does not name
 */
export function detectPlatform(): Target {
  const { os } = hostBuild();
  const name = os === undefined ? undefined : normalisePlatform(os);
  if (name === undefined) {
    throw new Error(
      os === undefined
        ? "the runtime exposes no platform information"
        : `unrecognised platform "${os}"`,
    );
  }
  return compose(...runtimeSpecs(), { id: name, platform: name, capabilities: [] });
}

/**
 * Detects the architecture this code is executing on.
 *
 * @returns The detected architecture, composed onto the detected runtime
 * @throws Error when the host reports an architecture this module does not name
 */
export function detectArchitecture(): Target {
  const { arch } = hostBuild();
  const name = arch === undefined ? undefined : normaliseArchitecture(arch);
  if (name === undefined) {
    throw new Error(
      arch === undefined
        ? "the runtime exposes no architecture information"
        : `unrecognised architecture "${arch}"`,
    );
  }
  return compose(...runtimeSpecs(), {
    id: name,
    architecture: name,
    capabilities: [],
  });
}

/** The detected runtime as specs, so the detect functions can build on it. */
function runtimeSpecs(): TargetDefinition[] {
  const rt = detectRuntime();
  return [getTarget(rt.runtime.name)!];
}

/**
 * The full target this code is executing as: runtime, platform and
 * architecture together.
 *
 * This is what a build compares against when deciding whether it is
 * cross-compiling, and what `otso` resolves the host target with.
 *
 * @returns The complete detected target
 */
export function detectCurrentTarget(): Target {
  const { os, arch } = hostBuild();
  const platform = os === undefined ? undefined : normalisePlatform(os);
  const architecture = arch === undefined ? undefined : normaliseArchitecture(arch);
  const specs: TargetDefinition[] = [...runtimeSpecs()];
  if (platform) specs.push({ id: platform, platform, capabilities: [] });
  if (architecture) specs.push({ id: architecture, architecture, capabilities: [] });
  return compose(...specs);
}

/**
 * The full target a target id names, capabilities included.
 *
 * {@link parseTargetId} answers a different question. It validates the spelling and returns
 * the axes it found, with `capabilities: []`, because parsing a string cannot know what a
 * runtime can do. This looks each axis up among the predefined targets and composes them,
 * so `resolveTarget("deno-linux-x64")` carries deno's capability set and
 * `matchesTarget(resolved, { capabilities: [capability("ffi")] })` answers correctly.
 *
 * That distinction is worth stating because the failure is silent: matching a parsed target
 * against a pattern with capabilities returns false for every target, including the ones
 * that have the capability, and nothing reports why.
 *
 * @param id - A target id: `runtime[-platform][-arch]`.
 * @returns The composed target.
 * @throws InvalidTargetIdError when `id` is not a well-formed target id.
 *
 * @example
 * ```ts
 * const t = resolveTarget("deno-linux-x64");
 * hasCapability(t, capability("webgpu")); // true
 * ```
 */
export function resolveTarget(id: string): Target {
  const parsed = parseTargetIdParts(id);
  if (!parsed.ok) {
    throw new InvalidTargetIdError(id, parsed.error);
  }

  const { runtime, platform, architecture } = parsed.parts;
  const specs: TargetDefinition[] = [];

  // Every axis is looked up rather than synthesised, so a target composed here carries the
  // same capabilities as the predefined one it was named from. A missing entry falls back
  // to a bare spec: the axis is real and known to the parser, and inventing capabilities
  // for it would be worse than carrying none.
  const runtimeDef = getTarget(runtime);
  specs.push(runtimeDef ?? { id: runtime, runtime, capabilities: [] });

  if (platform !== undefined) {
    const platformDef = getTarget(platform);
    specs.push(platformDef ?? { id: platform, platform, capabilities: [] });
  }
  if (architecture !== undefined) {
    const archDef = getTarget(architecture);
    specs.push(archDef ?? { id: architecture, architecture, capabilities: [] });
  }

  return compose(...specs);
}
