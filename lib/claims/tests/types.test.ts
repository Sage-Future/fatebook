import { parseOutcomeParts, SHAPE_PARTS } from "../types"

describe("parseOutcomeParts", () => {
  it("accepts a complete number-by-date outcome", () => {
    const result = parseOutcomeParts("NUMBER_BY_DATE", {
      measure: { value: "US unemployment rate", status: "extracted" },
      comparison: { value: "at_least", status: "extracted" },
      value: { value: 6, status: "stated" },
      unit: { value: "%", status: "stated" },
      deadline: { value: "2028-12-31", status: "working" },
    })
    expect(result.ok).toBe(true)
  })

  it("accepts missing parts (completeness is the grader's job)", () => {
    expect(parseOutcomeParts("NUMBER_BY_DATE", {}).ok).toBe(true)
    expect(parseOutcomeParts("FREE_TEXT", null).ok).toBe(true)
  })

  it("rejects a part the shape does not have", () => {
    const result = parseOutcomeParts("EVENT_BY_DATE", {
      measure: { value: "x", status: "stated" },
    })
    expect(result).toEqual({
      ok: false,
      error: '"measure" is not a part of EVENT_BY_DATE',
    })
  })

  it("rejects an unknown status", () => {
    const result = parseOutcomeParts("EVENT_BY_DATE", {
      event: { value: "x", status: "guessed" },
    })
    expect(result.ok).toBe(false)
  })

  it("rejects an unknown comparison and a non-numeric value", () => {
    expect(
      parseOutcomeParts("NUMBER_BY_DATE", {
        comparison: { value: "roughly", status: "stated" },
      }).ok,
    ).toBe(false)
    expect(
      parseOutcomeParts("NUMBER_BY_DATE", {
        value: { value: "six", status: "stated" },
      }).ok,
    ).toBe(false)
  })

  it("every shape needs a deadline except free text", () => {
    for (const [shape, parts] of Object.entries(SHAPE_PARTS)) {
      expect((parts.required as readonly string[]).includes("deadline")).toBe(
        shape !== "FREE_TEXT",
      )
    }
  })
})
