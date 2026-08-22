/**
 * What a consumer can reach through the package's own entry point.
 *
 * `deno test` resolves `../src/*.ts` happily, so a suite that imports source
 * paths passes whether or not `mod.ts` re-exports the thing. A consumer does
 * not have that: it imports `@hiisi/tgts`, gets whatever `mod.ts` names, and
 * fails at its own build if a name is missing. That gap is what this file
 * closes, so every law below imports from `../mod.ts` and from nowhere else.
 *
 * @module
 */

import { assert, assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import {
  ARCHITECTURES,
  normaliseArchitecture,
  normalisePlatform,
  PLATFORMS,
  RUNTIMES,
} from "../mod.ts";

describe("the entry point", () => {
  it("hands out the vocabulary as values, not only as types", () => {
    // a consumer enumerating the names, validating against them or writing an
    // exhaustive test over them needs the table. Without it, it writes the list
    // out again, and that second copy is what this package exists to prevent:
    // onlywhen's own architecture list said x86_64 where this one says x64.
    for (const table of [RUNTIMES, PLATFORMS, ARCHITECTURES]) {
      assert(Array.isArray(table), "the table is not an array");
      assert(table.length > 0, "the table is empty");
      for (const name of table) assertEquals(typeof name, "string");
    }
  });

  it("hands out the normalisers that map a foreign spelling into it", () => {
    // reachability, not behaviour: targets.test.ts owns what these answer.
    // What is asserted here is that a consumer can call them at all.
    assertEquals(typeof normalisePlatform, "function");
    assertEquals(typeof normaliseArchitecture, "function");
    assertEquals(normalisePlatform("win32"), "windows");
    assertEquals(normaliseArchitecture("x86_64"), "x64");
  });

  it("agrees with the normalisers about what the vocabulary is", () => {
    // the table and the normaliser are two surfaces onto one catalogue, so a
    // name reachable through one and refused by the other is a split
    // vocabulary wearing a single package's name.
    for (const p of PLATFORMS) assertEquals(normalisePlatform(p), p);
    for (const a of ARCHITECTURES) assertEquals(normaliseArchitecture(a), a);
  });
});
