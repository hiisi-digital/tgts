/**
 * A misspelled runtime name must not type-check.
 *
 * This is the whole reason the vocabulary is a union rather than a string. The
 * catalogue in `src/targets.ts` used to write every entry as `"deno" as
 * RuntimeName`, and a cast on a literal accepts anything: `"dneo" as
 * RuntimeName` compiled, in the file that defines what a runtime is.
 */
import type { RuntimeName } from "../../src/types.ts";

export const typo: RuntimeName = "dneo";
