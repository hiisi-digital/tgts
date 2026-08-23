/**
 * A target id may not be conjured out of a bare string.
 *
 * `TargetId` is branded, and the brand's entire meaning is that the value came
 * through `targetId()` and was checked against the vocabulary. A cast fabricates
 * the brand without the check, which is a hole in the perimeter rather than a
 * shortcut: `"" as Target["id"]` compiled and is not an id of anything.
 */
import type { TargetId } from "../../src/types.ts";

export const fabricated: TargetId = "";
