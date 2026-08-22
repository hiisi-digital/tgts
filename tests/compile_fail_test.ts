/**
 * The constructions the type system is supposed to refuse, checked rather than
 * remembered.
 *
 * Each law here asserts that a type check on a fixture *fails*, which is the
 * negative-test pattern: the failure is the pass. There is no trybuild for this
 * ecosystem, so the checker runs as a subprocess and its exit status is the
 * assertion.
 *
 * Every one of these was first established by hand, in a scratch file that was
 * then thrown away. That answers the question once and leaves nothing behind,
 * so the next person to doubt it does the same work again and possibly
 * differently. The fixtures under `compile_fail/` are that scratch file, kept.
 *
 * What they establish is not that a typo is wrong, which is obvious. It is that
 * the type system *notices*, which it did not: the catalogue wrote every entry
 * as `"deno" as RuntimeName`, and a cast on a literal accepts anything the
 * target type could ever hold, so `"dneo" as RuntimeName` type-checked inside
 * the module that defines what a runtime is.
 *
 * The subprocess goes through `@hiisi/shimp` rather than one runtime's own
 * namespace, because this package builds for three of them and a test that runs
 * under one is a test that stops being run.
 *
 * That means the foundation depends on a package that transitively depends back
 * on it, and that is fine: a mutual cycle type-checks and publishes clean, and a
 * published version is a different instance from the one linked on disk. The
 * alternative was reaching for `Deno.*` here, which is the exact leak `shimp`
 * exists to remove, in the package everything else is built on.
 *
 * @module
 */

import { assert, assertStringIncludes } from "@std/assert";
import { execPath, run } from "@hiisi/shimp";

// resolved through URLs rather than through a path package, because this one
// declares few dependencies and a test harness is not a reason to add another.
const HERE = new URL(".", import.meta.url);
const REPO = new URL("../", HERE);
const FIXTURES = new URL("compile_fail/", HERE);

/** Type-check one fixture, and report whether it compiled and what was said. */
async function check(fixture: string): Promise<{ ok: boolean; output: string }> {
  const result = await run(
    execPath(),
    ["check", new URL(fixture, FIXTURES).pathname],
    { cwd: REPO.pathname },
  );
  return { ok: result.success, output: result.stdout + result.stderr };
}

/**
 * Every fixture that must be refused, with a string its diagnostic has to carry.
 *
 * The second half matters as much as the first. A fixture that fails for an
 * unrelated reason, a bad import path being the easy one, passes a bare "did not
 * compile" assertion while establishing nothing.
 */
const REFUSED: readonly (readonly [string, string])[] = [
  ["typo_in_a_runtime_name.ts", "dneo"],
  ["typo_in_a_platform_name.ts", "windwos"],
  ["a_fabricated_target_id.ts", "TargetId"],
];

for (const [fixture, mentions] of REFUSED) {
  Deno.test(`the compiler refuses ${fixture}`, async () => {
    const { ok, output } = await check(fixture);
    assert(!ok, `${fixture} compiled, and the whole point of it is that it must not`);
    assertStringIncludes(
      output,
      mentions,
      `${fixture} was refused, but the diagnostic never mentions ${mentions}, so it may `
        + "have been refused for an unrelated reason",
    );
  });
}

Deno.test("the control compiles, so the harness is not refusing everything", async () => {
  // without this, a harness broken in a way that fails every check would pass
  // every law above while establishing nothing at all.
  const { ok, output } = await check("control_compiles.ts");
  assert(ok, `the control does not compile, so the suite above proves nothing:\n${output}`);
});
