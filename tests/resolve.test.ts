/**
 * @module
 *
 * `resolveTarget` against `parseTargetId`, which is the pair that motivated it: they take
 * the same string and differ only in whether the answer carries capabilities, and the
 * difference is invisible until a pattern asks for one.
 */

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import {
  capability,
  hasCapability,
  InvalidTargetIdError,
  matchesTarget,
  parseTargetId,
  resolveTarget,
} from "../mod.ts";

Deno.test("a resolved target carries its runtime's capabilities", () => {
  const t = resolveTarget("deno");
  assert(hasCapability(t, capability("webgpu")));
  assert(hasCapability(t, capability("ffi")));
});

Deno.test("a parsed target carries none, which is the whole reason resolveTarget exists", () => {
  // The control. Without it the test above passes whether `resolveTarget` composes anything
  // or merely forwards to `parseTargetId` and the capability set came from somewhere else.
  const parsed = parseTargetId("deno");
  assert(parsed.success);
  assertEquals(parsed.target.capabilities.length, 0);
  assertFalse(hasCapability(parsed.target, capability("webgpu")));
});

Deno.test("a capability pattern matches a resolved target and not a parsed one", () => {
  // This is the failure the function was added for, stated as the two answers it gives.
  // Nothing reports the second one: it is a plain false, indistinguishable from a target
  // that genuinely lacks the capability.
  const pattern = { capabilities: [capability("webgpu")] };
  const parsed = parseTargetId("deno");
  assert(parsed.success);

  assert(matchesTarget(resolveTarget("deno"), pattern));
  assertFalse(matchesTarget(parsed.target, pattern));
});

Deno.test("every axis of a three-part id is resolved", () => {
  const t = resolveTarget("deno-linux-x64");
  assertEquals(t.runtime.name, "deno");
  assertEquals(t.platform?.name, "linux");
  assertEquals(t.architecture?.name, "x64");
  assert(hasCapability(t, capability("ffi")));
});

Deno.test("node has no webgpu, so the capability set is the runtime's and not a constant", () => {
  // Without this, every assertion above is satisfied by a `resolveTarget` that attaches one
  // fixed capability set to everything.
  const n = resolveTarget("node");
  assert(hasCapability(n, capability("ffi")));
  assertFalse(hasCapability(n, capability("webgpu")));
});

Deno.test("a malformed id throws rather than resolving to something", () => {
  assertThrows(() => resolveTarget("nonesuch"), InvalidTargetIdError);
  assertThrows(() => resolveTarget("deno-linux-x64-extra"), InvalidTargetIdError);
  assertThrows(() => resolveTarget(""), InvalidTargetIdError);
});
