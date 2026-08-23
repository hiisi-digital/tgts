/**
 * What this package has to be true of before anything may be committed.
 *
 * Deliberately harsher than the code currently is. A lint set tuned to what
 * already passes measures nothing, and the point of putting it here is that it
 * refuses work rather than describes it.
 *
 * @module
 */

import defaultLints from "@hiisi/viola-default-lints";
import typescript from "@hiisi/viola-grammar-ts";
import { report, viola, when } from "@hiisi/viola";

export default viola()
  .use(defaultLints)
  // the grammar is what turns a file into something a lint can ask questions of
  .add(typescript).as("typescript")
  // anything a linter has any confidence in at all is a failure. a warning
  // is a finding nobody acts on, and a gate that warns is not a gate. the
  // floor was 50 and everything under it passed silently.
  .rule(report.error, when.confidence.atLeast(1))
  // tests are held to the same bar as source. a fixture that drifts is how a
  // suite stops measuring the thing it names.
  .rule(report.error, when.in("tests/**/*.ts"))
  // the compile-fail fixtures are supposed to be wrong. that is their entire
  // job, so the linters have nothing useful to say about them.
  .rule(report.off, when.in("tests/compile_fail/**"))
  // `parseTargetId` and `parseTargetIdParts` are 74% alike by name and the
  // lint asks for a review rather than asserting a fault. Reviewed: one gives
  // back a branded id and the other the axes it is spelled from, the names say
  // which is which, and shortening either would say less.
  .set("similar-functions", {
    ignoreFunctions: [
      // .set replaces rather than merges, so the default that excludes
      // constructors has to be restated or it comes back.
      "constructor",
      "parseTargetId",
      "parseTargetIdParts",
    ],
  });
