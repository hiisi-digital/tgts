/**
 * Target composition
 *
 * Builds a full target out of the building blocks in `targets.ts`: a runtime, a
 * platform, an architecture, and whatever capabilities each contributes.
 *
 * @module
 */

import { stringifyTarget } from "./parse.ts";
import { targetId } from "./types.ts";
import type { Capability, Target, TargetSpec } from "./types.ts";

/**
 * Composes several specs into one target.
 *
 * Later specs win where they name the same axis, so `compose(node, bun)` is a
 * bun target: this is the override rule the type documents, and it makes
 * composition usable as "the defaults, then my changes".
 *
 * Capabilities are the exception. They union rather than override, because a
 * spec contributing `ffi` is stating something the target can do, not replacing
 * what earlier specs said it could do. Overriding there would make the order of
 * two unrelated blocks change the answer.
 *
 * The id is derived from the composed axes rather than taken from any spec, so
 * it always round-trips through `parseTargetId`.
 *
 * @param specs - The building blocks, in increasing precedence
 * @returns The composed target
 * @throws TypeError when no spec contributes a runtime, since a target without
 * one cannot be built for or detected against
 */
export function compose(...specs: TargetSpec[]): Target {
  if (specs.length === 0) {
    throw new TypeError("compose needs at least one spec");
  }

  let runtime: TargetSpec["runtime"];
  let platform: TargetSpec["platform"];
  let architecture: TargetSpec["architecture"];
  const capabilities = new Set<Capability>();
  const descriptions: string[] = [];

  for (const spec of specs) {
    if (spec.runtime !== undefined) runtime = spec.runtime;
    if (spec.platform !== undefined) platform = spec.platform;
    if (spec.architecture !== undefined) architecture = spec.architecture;
    for (const c of spec.capabilities) capabilities.add(c);
    if (spec.description) descriptions.push(spec.description);
  }

  if (runtime === undefined) {
    throw new TypeError(
      `none of the ${specs.length} specs contributes a runtime: ${
        specs.map((s) => s.id).join(", ")
      }`,
    );
  }

  const partial = {
    runtime: { name: runtime },
    ...(platform !== undefined ? { platform: { name: platform } } : {}),
    ...(architecture !== undefined ? { architecture: { name: architecture } } : {}),
  };

  return {
    id: targetId(stringifyTarget(partial)),
    ...partial,
    capabilities: [...capabilities],
    ...(descriptions.length > 0 ? { description: descriptions.join("; ") } : {}),
  };
}

/**
 * Splits a target back into the specs it is made of.
 *
 * One spec per axis the target carries, each holding only that axis, so
 * `compose(...decompose(t))` gives back an equal target. Capabilities travel
 * with the runtime spec rather than being spread across all three, because
 * there is no way to tell after the fact which block contributed which, and
 * inventing an attribution would be a claim the data does not support.
 *
 * @param target - The target to split
 * @returns Its specs, in composition order
 */
export function decompose(target: Target): TargetSpec[] {
  const specs: TargetSpec[] = [{
    id: target.runtime.name,
    runtime: target.runtime.name,
    capabilities: target.capabilities,
  }];
  if (target.platform) {
    specs.push({
      id: target.platform.name,
      platform: target.platform.name,
      capabilities: [],
    });
  }
  if (target.architecture) {
    specs.push({
      id: target.architecture.name,
      architecture: target.architecture.name,
      capabilities: [],
    });
  }
  return specs;
}

/**
 * The union of every target's capabilities.
 *
 * Answers "what can be done on at least one of these", which is the question a
 * build asks when deciding whether a code path is worth emitting at all.
 *
 * @param targets - The targets to merge
 * @returns Every capability held by any of them, deduplicated
 */
export function mergeCapabilities(...targets: Target[]): Capability[] {
  const out = new Set<Capability>();
  for (const t of targets) for (const c of t.capabilities) out.add(c);
  return [...out];
}

/**
 * The capabilities every target has.
 *
 * Answers "what can be relied on across all of these", which is the question a
 * shared code path asks. An empty input gives an empty result rather than a
 * universal set, because there is no enumerable universe of capabilities to
 * take the complement of.
 *
 * @param targets - The targets to intersect
 * @returns The capabilities present in all of them
 */
export function intersectCapabilities(...targets: Target[]): Capability[] {
  if (targets.length === 0) return [];
  const [first, ...rest] = targets;
  return first.capabilities.filter((c) => rest.every((t) => t.capabilities.includes(c)));
}

/**
 * Extends a target with more specs.
 *
 * The same rule as {@link compose}: extensions override the axes they name and
 * add to the capabilities.
 *
 * @param base - The target to start from
 * @param extensions - What to apply on top
 * @returns The extended target
 */
export function extend(base: Target, ...extensions: TargetSpec[]): Target {
  return compose(...decompose(base), ...extensions);
}
