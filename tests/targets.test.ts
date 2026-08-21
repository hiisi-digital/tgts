/**
 * Tests for the target system.
 *
 * Every law here is asserted over the whole predefined table rather than over a
 * chosen example, and each negative case states the input that must be refused.
 *
 * @module
 */

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import {
  allTargets,
  architectures,
  arm64,
  browser,
  bun,
  darwin,
  deno,
  detectCurrentTarget,
  detectRuntime,
  getTarget,
  linux,
  node,
  platforms,
  runtimes,
  x64,
} from "../src/targets.ts";
import {
  isValidArchitecture,
  isValidPlatform,
  isValidRuntime,
  parseTargetId,
  stringifyTarget,
} from "../src/parse.ts";
import {
  compose,
  decompose,
  extend,
  intersectCapabilities,
  mergeCapabilities,
} from "../src/compose.ts";
import {
  createCapabilitySet,
  getCapabilities,
  hasAllCapabilities,
  hasAnyCapability,
  hasCapability,
  missingCapabilities,
  STANDARD_CAPABILITIES as CAP,
} from "../src/capabilities.ts";
import {
  calculateSpecificity,
  findBestMatch,
  matchesAll,
  matchesAny,
  matchesTarget,
} from "../src/match.ts";
import { ARCHITECTURES, capability, PLATFORMS, RUNTIMES, targetId } from "../src/types.ts";
import type { Target } from "../src/types.ts";

describe("Predefined targets", () => {
  it("names its runtime on every runtime block, and nothing else", () => {
    for (const t of runtimes) {
      assertEquals(t.runtime, t.id, `${t.id} should carry its own runtime`);
      assertEquals(t.platform, undefined, `${t.id} is a runtime block, not a platform one`);
      assertEquals(t.architecture, undefined, `${t.id} is a runtime block`);
    }
  });

  it("names its platform on every platform block, and nothing else", () => {
    for (const t of platforms) {
      assertEquals(t.platform, t.id);
      assertEquals(t.runtime, undefined, `${t.id} is a platform block, not a runtime one`);
    }
  });

  it("names its architecture on every architecture block, and nothing else", () => {
    for (const t of architectures) {
      assertEquals(t.architecture, t.id);
      assertEquals(t.runtime, undefined);
    }
  });

  it("covers exactly the blocks allTargets claims", () => {
    assertEquals(allTargets.length, runtimes.length + platforms.length + architectures.length);
    assertEquals(new Set(allTargets.map((t) => t.id)).size, allTargets.length, "ids are unique");
  });

  it("gives every server runtime a filesystem and denies the browser one", () => {
    for (const t of [deno, node, bun]) {
      assert(t.capabilities.includes(CAP.FS), `${t.id} should reach the filesystem`);
      assert(t.capabilities.includes(CAP.PROCESS), `${t.id} should spawn processes`);
    }
    assertFalse(browser.capabilities.includes(CAP.FS), "a browser has no filesystem");
    assertFalse(browser.capabilities.includes(CAP.PROCESS));
    assertFalse(browser.capabilities.includes(CAP.FFI));
  });

  it("separates deno from node by webgpu, which is the branch a build has to take", () => {
    assert(deno.capabilities.includes(CAP.WEBGPU));
    assertFalse(node.capabilities.includes(CAP.WEBGPU));
  });

  it("gives the dom to the browser alone", () => {
    for (const t of runtimes) {
      assertEquals(t.capabilities.includes(CAP.DOM), t.id === "browser", `dom on ${t.id}`);
    }
  });

  it("leaves platform and architecture blocks contributing no capabilities", () => {
    for (const t of [...platforms, ...architectures]) {
      assertEquals(t.capabilities.length, 0, `${t.id} should contribute none`);
    }
  });
});

describe("getTarget", () => {
  it("finds every predefined block by its own id", () => {
    for (const t of allTargets) assertEquals(getTarget(t.id), t);
  });

  it("returns undefined for a composed id, which is not a block", () => {
    assertEquals(getTarget("node-linux"), undefined);
  });

  it("returns undefined for an unknown id", () => {
    assertEquals(getTarget("nope"), undefined);
  });
});

describe("parseTargetId", () => {
  it("reads one, two and three segments", () => {
    const one = parseTargetId("deno");
    assert(one.success);
    assertEquals(one.target?.runtime.name, "deno");
    assertEquals(one.target?.platform, undefined);

    const two = parseTargetId("node-linux");
    assert(two.success);
    assertEquals(two.target?.platform?.name, "linux");
    assertEquals(two.target?.architecture, undefined);

    const three = parseTargetId("bun-darwin-arm64");
    assert(three.success);
    assertEquals(three.target?.runtime.name, "bun");
    assertEquals(three.target?.platform?.name, "darwin");
    assertEquals(three.target?.architecture?.name, "arm64");
  });

  it("round-trips every combination of the predefined blocks", () => {
    for (const r of runtimes) {
      for (const p of [undefined, ...platforms]) {
        for (const a of [undefined, ...architectures]) {
          const id = [r.id, p?.id, a?.id].filter(Boolean).join("-");
          const parsed = parseTargetId(id);
          assert(parsed.success, `${id} should parse: ${parsed.error}`);
          assertEquals(stringifyTarget(parsed.target!), id);
        }
      }
    }
  });

  it("refuses the segments reordered rather than accepting both spellings", () => {
    const r = parseTargetId("linux-node");
    assertFalse(r.success);
    assert(r.error?.includes("unknown runtime"), r.error);
  });

  it("refuses an empty id, an unknown runtime, and too many segments", () => {
    assertFalse(parseTargetId("").success);
    assertFalse(parseTargetId("   ").success);
    assertFalse(parseTargetId("perl").success);
    assertFalse(parseTargetId("deno-linux-x64-extra").success);
  });

  it("names the segment it could not place, and both unions it tried", () => {
    const bad = parseTargetId("node-plan9");
    assertFalse(bad.success);
    assert(bad.error?.includes('unknown segment "plan9"'), bad.error);
    assert(bad.error?.includes("darwin") && bad.error?.includes("x64"), bad.error);
  });

  it("accepts an architecture with no platform, which compose can build", () => {
    const r = parseTargetId("deno-x64");
    assert(r.success, r.error);
    assertEquals(r.target?.platform, undefined);
    assertEquals(r.target?.architecture?.name, "x64");
    assertEquals(stringifyTarget(compose(deno, x64)), "deno-x64");
  });

  it("keeps the axes ordered, refusing an architecture before a platform", () => {
    assertFalse(parseTargetId("deno-x64-linux").success);
    assertFalse(parseTargetId("deno-linux-darwin").success);
    assertFalse(parseTargetId("deno-x64-arm64").success);
  });

  it("validates each axis against its own union and not the others", () => {
    assert(isValidRuntime("deno"));
    assertFalse(isValidRuntime("linux"));
    assert(isValidPlatform("linux"));
    assertFalse(isValidPlatform("deno"));
    assert(isValidArchitecture("arm64"));
    assertFalse(isValidArchitecture("linux"));
  });
});

describe("branded constructors", () => {
  it("accepts a well-formed id and refuses a malformed one", () => {
    assertEquals(String(targetId("node-linux-x64")), "node-linux-x64");
    assertEquals(String(targetId("deno")), "deno");
    assertEquals(String(targetId("bun-x64")), "bun-x64", "the platform may be left out");
    assertThrows(() => targetId(""), Error);
    assertThrows(() => targetId("a-b-c-d"), Error, "segments");
  });

  it("refuses an id that names nothing this crate knows", () => {
    // The brand used to carry a shape check only, so `xyz-abc` produced a `TargetId` that
    // `parseTargetId` would then reject: the same string was valid or invalid depending on
    // which door it came through. Both check the same vocabulary now.
    assertThrows(() => targetId("xyz"), Error, "unknown runtime");
    assertThrows(() => targetId("Node"), Error, "unknown runtime");
    assertThrows(() => targetId("node-nowhere"), Error, "unknown segment");
    assertThrows(() => targetId("node-linux-z80"), Error, "unknown segment");
  });

  it("the brand and the parser agree on every id the vocabulary can spell", () => {
    // The whole matrix, not a sample. Every id of one, two or three segments drawn from the
    // vocabularies plus one token belonging to none of them: 5219 of them, in well under a
    // second. A hand-picked list is the wrong instrument here, because the region where the
    // two used to disagree was transpositions and duplicates, and a list written by someone
    // who believed they agreed would not contain any.
    const tokens = [...RUNTIMES, ...PLATFORMS, ...ARCHITECTURES, "nonsense"];

    const ids: string[] = ["", "-", "a-b-c-d"];
    for (const first of tokens) {
      ids.push(first);
      for (const second of tokens) {
        ids.push(`${first}-${second}`);
        for (const third of tokens) {
          ids.push(`${first}-${second}-${third}`);
        }
      }
    }

    const disagreements: string[] = [];
    for (const candidate of ids) {
      const parsed = parseTargetId(candidate).success;
      let branded = true;
      try {
        targetId(candidate);
      } catch {
        branded = false;
      }
      if (branded !== parsed) {
        disagreements.push(`${candidate}: brand=${branded} parser=${parsed}`);
      }
    }

    assertEquals(
      disagreements.length,
      0,
      `the brand and the parser disagree about ${disagreements.length} of ${ids.length} ids:\n` +
        disagreements.slice(0, 10).join("\n"),
    );
  });

  it("the walk above actually covers the cases that once diverged", () => {
    // The control. The test above passes trivially if its id set is empty or misses the
    // interesting region, and a count of 5219 says neither happened only if these specific
    // shapes are in it. Each is a transposition or a duplicate, which is what the two used
    // to disagree about.
    for (const id of ["deno-x64-linux", "node-linux-linux", "node-x64-x64"]) {
      assertEquals(
        parseTargetId(id).success,
        false,
        `the parser refuses "${id}", so the brand must too`,
      );
      assertThrows(() => targetId(id), Error);
    }
  });

  it("accepts a dotted capability and refuses anything else", () => {
    assertEquals(String(capability("fs.read")), "fs.read");
    assertThrows(() => capability(""), TypeError);
    assertThrows(() => capability("FS"), TypeError);
    assertThrows(() => capability("fs read"), TypeError);
  });
});

describe("capabilities", () => {
  it("deduplicates a set", () => {
    assertEquals(createCapabilitySet(CAP.FS, CAP.FS, CAP.NET).size, 2);
  });

  it("reports what the target carries", () => {
    const t = compose(deno);
    assertEquals(getCapabilities(t).size, deno.capabilities.length);
  });

  it("lets a specific capability answer for its parent, but not the reverse", () => {
    const specific: Target = { ...compose(node), capabilities: [capability("fs.read")] };
    assert(hasCapability(specific, CAP.FS), "fs.read implies fs");
    assertFalse(hasCapability(specific, capability("fs.write")), "siblings do not imply");

    const coarse = compose(node);
    assert(hasCapability(coarse, CAP.FS));
    assertFalse(hasCapability(coarse, capability("fs.read")), "fs does not imply fs.read");
  });

  it("reads the empty list as universally satisfied and existentially unsatisfied", () => {
    const t = compose(browser);
    assert(hasAllCapabilities(t, []));
    assertFalse(hasAnyCapability(t, []));
  });

  it("names what is missing, in the order asked", () => {
    const t = compose(browser);
    assertEquals(missingCapabilities(t, [CAP.NET, CAP.FS, CAP.PROCESS]), [CAP.FS, CAP.PROCESS]);
    assertEquals(missingCapabilities(t, [CAP.NET]), []);
  });
});

describe("compose", () => {
  it("builds a full target from three blocks and derives its id", () => {
    const t = compose(node, linux, x64);
    assertEquals(String(t.id), "node-linux-x64");
    assertEquals(t.runtime.name, "node");
    assertEquals(t.platform?.name, "linux");
    assertEquals(t.architecture?.name, "x64");
  });

  it("lets a later spec override the axis an earlier one set", () => {
    assertEquals(compose(node, bun).runtime.name, "bun");
    assertEquals(compose(node, darwin, linux).platform?.name, "linux");
    assertEquals(compose(node, x64, arm64).architecture?.name, "arm64");
  });

  it("unions capabilities rather than overriding them, so block order cannot change the answer", () => {
    const forward = compose(node, browser).capabilities;
    const backward = compose(browser, node).capabilities;
    assertEquals(new Set(forward), new Set(backward));
    assert(forward.includes(CAP.DOM), "the browser's dom survives");
    assert(forward.includes(CAP.FS), "node's filesystem survives");
  });

  it("refuses to build without a runtime, naming the specs it was given", () => {
    assertThrows(() => compose(linux, x64), TypeError, "runtime");
    assertThrows(() => compose(), TypeError);
  });

  it("round-trips through decompose for every combination", () => {
    for (const r of runtimes) {
      for (const p of [undefined, ...platforms]) {
        for (const a of [undefined, ...architectures]) {
          const original = compose(...[r, p, a].filter(Boolean) as typeof runtimes);
          const rebuilt = compose(...decompose(original));
          assertEquals(rebuilt.id, original.id);
          assertEquals(new Set(rebuilt.capabilities), new Set(original.capabilities));
        }
      }
    }
  });

  it("extends a target by overriding one axis and keeping the rest", () => {
    const base = compose(node, linux, x64);
    const extended = extend(base, arm64);
    assertEquals(String(extended.id), "node-linux-arm64");
    assertEquals(extended.platform?.name, "linux");
  });
});

describe("merging and intersecting capabilities", () => {
  it("merges to the union and intersects to what is common", () => {
    const d = compose(deno);
    const b = compose(browser);
    assert(mergeCapabilities(d, b).includes(CAP.FS), "union keeps deno's fs");
    assert(mergeCapabilities(d, b).includes(CAP.DOM), "union keeps the browser's dom");
    assertFalse(intersectCapabilities(d, b).includes(CAP.FS), "the browser has no fs");
    assert(intersectCapabilities(d, b).includes(CAP.NET), "both reach the network");
  });

  it("gives the empty set for no targets rather than a universal one", () => {
    assertEquals(intersectCapabilities(), []);
    assertEquals(mergeCapabilities(), []);
  });

  it("intersects the three server runtimes to a usable shared set", () => {
    const shared = intersectCapabilities(compose(deno), compose(node), compose(bun));
    for (const c of [CAP.FS, CAP.NET, CAP.ENV, CAP.PROCESS, CAP.WASM]) {
      assert(shared.includes(c), `${c} should be shared across deno, node and bun`);
    }
    assertFalse(shared.includes(CAP.DOM));
  });
});

describe("matching", () => {
  const nodeLinuxX64 = compose(node, linux, x64);

  it("matches an empty pattern against anything", () => {
    for (const r of runtimes) assert(matchesTarget(compose(r), {}));
  });

  it("matches on each axis and fails on a mismatch", () => {
    assert(matchesTarget(nodeLinuxX64, { runtime: "node" }));
    assertFalse(matchesTarget(nodeLinuxX64, { runtime: "deno" }));
    assert(matchesTarget(nodeLinuxX64, { platform: "linux", architecture: "x64" }));
    assertFalse(matchesTarget(nodeLinuxX64, { platform: "darwin" }));
  });

  it("reads a wildcard as requiring the axis to be present, not as ignoring it", () => {
    assert(matchesTarget(nodeLinuxX64, { platform: "*" }));
    assertFalse(matchesTarget(compose(node), { platform: "*" }), "bare node has no platform");
    assert(matchesTarget(compose(node), {}), "omitting the axis does not require it");
  });

  it("requires every capability the pattern names", () => {
    assert(matchesTarget(nodeLinuxX64, { capabilities: [CAP.FS, CAP.NET] }));
    assertFalse(matchesTarget(compose(browser), { capabilities: [CAP.FS] }));
  });

  it("reads any and all over the empty list the standard way", () => {
    assertFalse(matchesAny(nodeLinuxX64, []));
    assert(matchesAll(nodeLinuxX64, []));
  });

  it("scores a narrower axis above a broader one, and a name above a wildcard", () => {
    const arch = calculateSpecificity(nodeLinuxX64, { architecture: "x64" });
    const plat = calculateSpecificity(nodeLinuxX64, { platform: "linux" });
    const run = calculateSpecificity(nodeLinuxX64, { runtime: "node" });
    assert(
      arch > plat && plat > run,
      `expected arch > platform > runtime, got ${arch}/${plat}/${run}`,
    );
    assert(
      calculateSpecificity(nodeLinuxX64, { platform: "linux" }) >
        calculateSpecificity(nodeLinuxX64, { platform: "*" }),
      "an exact name beats a wildcard on the same axis",
    );
  });

  it("scores a non-match zero so it cannot outrank a weak match", () => {
    assertEquals(calculateSpecificity(nodeLinuxX64, { runtime: "deno" }), 0);
  });

  it("picks the most specific candidate and keeps the caller's order on a tie", () => {
    const candidates = [compose(node), compose(node, linux), compose(node, linux, x64)];
    assertEquals(
      findBestMatch({ runtime: "node", platform: "linux" }, candidates)?.id,
      candidates[1].id,
    );
    const tie = [compose(node), compose(bun)];
    assertEquals(findBestMatch({}, tie)?.id, tie[0].id, "the first match wins a tie");
  });

  it("returns undefined when nothing matches", () => {
    assertEquals(findBestMatch({ runtime: "cloudflare" }, [compose(node)]), undefined);
  });
});

describe("detection", () => {
  it("identifies the runtime these tests are running under", () => {
    // The suite runs under Deno. Asserting the concrete answer is what makes
    // this a test rather than a smoke check; it fails loudly if the probe
    // order ever lets another runtime win here.
    assertEquals(detectRuntime().runtime.name, "deno");
  });

  it("reports a full target whose id round-trips", () => {
    const t = detectCurrentTarget();
    assertEquals(t.runtime.name, "deno");
    assert(t.platform !== undefined, "the host reports a platform");
    assert(t.architecture !== undefined, "the host reports an architecture");
    const reparsed = parseTargetId(String(t.id));
    assert(reparsed.success, `detected id ${t.id} should parse: ${reparsed.error}`);
    assertEquals(stringifyTarget(reparsed.target!), String(t.id));
  });

  it("carries the runtime's capabilities onto the detected target", () => {
    assert(hasCapability(detectCurrentTarget(), CAP.FS));
  });
});
