/**
 * The control. Every name here is real, so this file must compile.
 *
 * A harness that reported failure for everything would pass the whole
 * compile-fail suite while checking nothing, and this is what catches that.
 */
import type { Platform, RuntimeName } from "../../src/types.ts";

export const runtime: RuntimeName = "deno";
export const platform: Platform = "windows";
