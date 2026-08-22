/**
 * Every predefined target names something the vocabulary actually contains.
 *
 * The compile-fail fixtures next door establish that the unions refuse a typo.
 * They cannot see this, because a cast inside the catalogue opts out of the very
 * union it is casting to: `"dneo" as RuntimeName` type-checks, and the catalogue
 * was written that way for every entry, in the module that defines what a
 * runtime is.
 *
 * So this checks the values rather than the types, over the whole catalogue
 * rather than over a chosen example, and it holds whether or not somebody
 * reintroduces a cast.
 *
 * @module
 */

import { assert } from "@std/assert";

import { allTargets } from "../src/targets.ts";
import { ARCHITECTURES, PLATFORMS, RUNTIMES } from "../src/types.ts";

const targets = allTargets;

Deno.test("the catalogue is not empty, so the laws below quantify over something", () => {
  // a law over an empty collection passes by vacuity, which is the cheapest way
  // for this whole file to say nothing.
  assert(targets.length > 0, "the catalogue is empty");
});

Deno.test("and each axis is populated, so no law below is vacuous on its own", () => {
  // every axis is optional, so three laws that each skip every entry would all
  // pass while checking nothing. This is what says they have something to check.
  for (
    const [axis, present] of [
      ["runtime", targets.filter((t) => t.runtime !== undefined)],
      ["platform", targets.filter((t) => t.platform !== undefined)],
      ["architecture", targets.filter((t) => t.architecture !== undefined)],
    ] as const
  ) {
    assert(present.length > 0, `no entry in the catalogue declares a ${axis}`);
  }
});

Deno.test("every target's runtime is a runtime this package knows", () => {
  // every axis is optional on a definition, because the catalogue holds
  // single-axis blocks: a platform block names a platform and no runtime, and
  // composing is what puts a whole target together.
  const names: readonly string[] = RUNTIMES;
  for (const target of targets) {
    if (target.runtime === undefined) continue;
    assert(
      names.includes(target.runtime),
      `${target.id} declares runtime "${target.runtime}", which is not one of ${names.join(", ")}`,
    );
  }
});

Deno.test("every target's platform is a platform this package knows", () => {
  const names: readonly string[] = PLATFORMS;
  for (const target of targets) {
    if (target.platform === undefined) continue;
    assert(
      names.includes(target.platform),
      `${target.id} declares platform "${target.platform}", which is not one of ${
        names.join(", ")
      }`,
    );
  }
});

Deno.test("every target's architecture is an architecture this package knows", () => {
  const names: readonly string[] = ARCHITECTURES;
  for (const target of targets) {
    if (target.architecture === undefined) continue;
    assert(
      names.includes(target.architecture),
      `${target.id} declares architecture "${target.architecture}", which is not one of ${
        names.join(", ")
      }`,
    );
  }
});
