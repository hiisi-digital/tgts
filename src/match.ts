/**
 * Target matching utilities.
 *
 * Provides functions to check if a target matches a pattern or specification.
 *
 * @module
 */

import { hasAllCapabilities } from "./capabilities.ts";
import type { Target, TargetPattern } from "./types.ts";

/**
 * Matches one axis of a pattern against a target.
 *
 * Three cases and they are not the same. An axis the pattern omits is not being
 * constrained, so anything matches. An axis the pattern sets to `"*"` is being
 * constrained to *present*, so a target lacking that axis fails. Otherwise the
 * names must be equal.
 *
 * The middle case is the one worth being explicit about: `{ platform: "*" }`
 * means "any platform, but it must have one", which is how a build asks for a
 * platform-specific target without naming the platform.
 */
function axisMatches(want: string | undefined, held: string | undefined): boolean {
  if (want === undefined) return true;
  if (want === "*") return held !== undefined;
  return want === held;
}

/**
 * Checks if a target matches a given pattern.
 *
 * Every axis the pattern names must match, and every capability it requires must
 * be held. A pattern that names nothing matches every target.
 *
 * @param target - The target to check
 * @param pattern - The pattern to match against
 * @returns True if the target matches the pattern
 */
export function matchesTarget(target: Target, pattern: TargetPattern): boolean {
  if (!axisMatches(pattern.runtime, target.runtime.name)) return false;
  if (!axisMatches(pattern.platform, target.platform?.name)) return false;
  if (!axisMatches(pattern.architecture, target.architecture?.name)) return false;
  if (pattern.capabilities && !hasAllCapabilities(target, pattern.capabilities)) {
    return false;
  }
  return true;
}

/**
 * Whether the target matches at least one of the patterns.
 *
 * Empty gives false: nothing to match means nothing matched.
 *
 * @param target - The target to check
 * @param patterns - The patterns to try
 * @returns True when any of them matches
 */
export function matchesAny(target: Target, patterns: TargetPattern[]): boolean {
  return patterns.some((p) => matchesTarget(target, p));
}

/**
 * Whether the target matches every one of the patterns.
 *
 * Empty gives true, which is the standard reading of a universal over nothing
 * and keeps `matchesAll(t, [])` from being a special case at every call site.
 *
 * @param target - The target to check
 * @param patterns - The patterns that must all match
 * @returns True when none of them fails
 */
export function matchesAll(target: Target, patterns: TargetPattern[]): boolean {
  return patterns.every((p) => matchesTarget(target, p));
}

/**
 * Scores how specifically a target satisfies a pattern.
 *
 * Higher is more specific. The weights are ordered rather than arbitrary:
 * naming an architecture is a narrower claim than naming a platform, which is
 * narrower than naming a runtime, so a pattern that pins the arch beats one that
 * only pins the runtime. A wildcard scores below an exact name on the same axis
 * because it constrains presence and not identity. Required capabilities each
 * add one, so between two otherwise equal patterns the one demanding more wins.
 *
 * Scoring a target the pattern does not match returns 0, so a caller cannot
 * accidentally rank a non-match above a weak match.
 *
 * @param target - The target being scored
 * @param pattern - The pattern it matched against
 * @returns A numeric specificity score, 0 when it does not match
 */
export function calculateSpecificity(target: Target, pattern: TargetPattern): number {
  if (!matchesTarget(target, pattern)) return 0;
  let score = 0;
  if (pattern.runtime !== undefined) score += pattern.runtime === "*" ? 1 : 4;
  if (pattern.platform !== undefined) score += pattern.platform === "*" ? 2 : 8;
  if (pattern.architecture !== undefined) {
    score += pattern.architecture === "*" ? 3 : 16;
  }
  score += pattern.capabilities?.length ?? 0;
  return score;
}

/**
 * Picks the candidate that satisfies the pattern most specifically.
 *
 * Ties keep the earliest candidate, so the caller's order is the tiebreak and
 * the result is deterministic rather than dependent on sort stability.
 *
 * @param pattern - The pattern to satisfy
 * @param candidates - The targets to choose between
 * @returns The best match, or undefined when none matches
 */
export function findBestMatch(
  pattern: TargetPattern,
  candidates: Target[],
): Target | undefined {
  let best: Target | undefined;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = calculateSpecificity(candidate, pattern);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  // A pattern naming nothing scores 0 against everything while still matching,
  // so fall back to the first match rather than reporting no match at all.
  if (best === undefined) {
    return candidates.find((c) => matchesTarget(c, pattern));
  }
  return best;
}
