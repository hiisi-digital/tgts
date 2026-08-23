/**
 * A misspelled platform name must not type-check.
 *
 * `windwos` for `windows`, which is the shape of mistake that reaches a consumer
 * as a target that silently matches nothing rather than as an error here.
 */
import type { Platform } from "../../src/types.ts";

export const typo: Platform = "windwos";
