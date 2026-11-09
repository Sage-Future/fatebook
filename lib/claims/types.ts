/**
 * Mark-to-Market My Words: the shape of a claim's outcome.
 *
 * A claim's outcome is stored on Question as:
 *   - claimShape:   which of the five shapes it is
 *   - outcomeParts: a JSON object of the parts that shape needs
 *
 * This file is the single definition of what that JSON may contain.
 * It has no database or AI code in it, so the grading code, the AI step,
 * the API and the UI can all share it.
 */
import { ClaimShape } from "@prisma/client"
import { z } from "zod"

/**
 * Where a part's value came from.
 *   stated    - I said it (or I confirmed/edited it)
 *   extracted - the AI pulled it from my text; not yet confirmed
 *   working   - a default the engine suggested and I accepted without editing
 */
export const PART_STATUSES = ["stated", "extracted", "working"] as const
export type PartStatus = (typeof PART_STATUSES)[number]

export const COMPARISONS = ["above", "below", "at_least", "between"] as const
export type Comparison = (typeof COMPARISONS)[number]

export const outcomePartSchema = z.object({
  value: z.union([z.string().min(1), z.number().finite()]),
  status: z.enum(PART_STATUSES),
})
export type OutcomePart = z.infer<typeof outcomePartSchema>

/**
 * The parts each shape can have.
 * "required" parts must be present for the claim to be complete;
 * "optional" parts are stored if given but never asked about.
 *
 * "deadline" appears in every shape. Its value lives in Question.resolveBy
 * (Fatebook requires that column), so the part here only records the
 * deadline's status - e.g. "working" when the engine suggested it.
 */
export const SHAPE_PARTS = {
  NUMBER_BY_DATE: {
    required: ["measure", "comparison", "value", "unit", "deadline"],
    // valueHigh: upper bound when comparison is "between"
    // baseline: what a change is measured from ("today's close")
    optional: ["valueHigh", "baseline"],
  },
  EVENT_BY_DATE: {
    required: ["event", "deadline"],
    optional: [],
  },
  A_BEATS_B: {
    required: ["a", "b", "metric", "deadline"],
    optional: [],
  },
  RANK_OR_AWARD: {
    required: ["subject", "rankOrAward", "deadline"],
    optional: [],
  },
  FREE_TEXT: {
    required: [],
    optional: ["deadline"],
  },
} as const satisfies Record<
  ClaimShape,
  { required: readonly string[]; optional: readonly string[] }
>

export type PartName =
  (typeof SHAPE_PARTS)[ClaimShape][keyof (typeof SHAPE_PARTS)[ClaimShape]][number]

export type OutcomeParts = Partial<Record<PartName, OutcomePart>>

export function allowedParts(shape: ClaimShape): readonly string[] {
  return [...SHAPE_PARTS[shape].required, ...SHAPE_PARTS[shape].optional]
}

/**
 * Checks that outcomeParts is well formed for the given shape:
 * only parts that shape knows about, each with a value and a status.
 * It does NOT check completeness - missing parts are fine here and are
 * what the grading code looks at.
 */
export function parseOutcomeParts(
  shape: ClaimShape,
  raw: unknown,
): { ok: true; parts: OutcomeParts } | { ok: false; error: string } {
  const result = z.record(outcomePartSchema).safeParse(raw ?? {})
  if (!result.success) {
    return { ok: false, error: result.error.issues[0].message }
  }
  const allowed = allowedParts(shape)
  for (const [name, part] of Object.entries(result.data)) {
    if (!allowed.includes(name)) {
      return { ok: false, error: `"${name}" is not a part of ${shape}` }
    }
    if (
      name === "comparison" &&
      !COMPARISONS.includes(part.value as Comparison)
    ) {
      return {
        ok: false,
        error: `comparison must be one of: ${COMPARISONS.join(", ")}`,
      }
    }
    if (
      (name === "value" || name === "valueHigh") &&
      typeof part.value !== "number"
    ) {
      return { ok: false, error: `${name} must be a number` }
    }
  }
  return { ok: true, parts: result.data as OutcomeParts }
}
