import {
  scrubHiddenForecastsAndSensitiveDetailsFromQuestion,
  scrubApiKeyPropertyRecursive,
} from "../scrub"
import { QuestionWithForecasts } from "../../../../prisma/additional"
import { Decimal } from "@prisma/client/runtime/library"

describe("scrubHiddenForecastsAndSensitiveDetailsFromQuestion", () => {
  const mockQuestion: QuestionWithForecasts = {
    id: "1",
    title: "Test Question",
    userId: "user1",
    hideForecastsUntilPrediction: true,
    forecasts: [
      {
        id: 1,
        userId: "user1",
        forecast: new Decimal(50), // Use Decimal instead of number
        createdAt: new Date(),
        comment: null,
        profileId: null,
        questionId: "1",
        optionId: null, // Make this nullable
      },
      {
        id: 2,
        userId: "user2",
        forecast: new Decimal(70), // Use Decimal instead of number
        createdAt: new Date(),
        comment: null,
        profileId: null,
        questionId: "1",
        optionId: null, // Make this nullable
      },
    ],
    createdAt: new Date(),
    comment: null,
    profileId: null,
    type: "BINARY",
    resolveBy: new Date(),
    resolved: false,
    pingedForResolution: false,
    exclusiveAnswers: null,
    resolution: null,
    resolvedAt: null,
    notes: null,
    hideForecastsUntil: null,
    unlisted: false,
    sharedPublicly: false,
    sharedWith: [],
    sharedWithLists: [],
  } as QuestionWithForecasts

  it("should not scrub forecasts for the question owner", () => {
    const result = scrubHiddenForecastsAndSensitiveDetailsFromQuestion(
      mockQuestion,
      "user1",
    )
    expect(result.forecasts[0].forecast).toStrictEqual(new Decimal(50))
    expect(result.forecasts[1].forecast).toStrictEqual(new Decimal(70))
  })

  it("should scrub all forecasts for other users", () => {
    const result = scrubHiddenForecastsAndSensitiveDetailsFromQuestion(
      mockQuestion,
      "user3",
    )
    expect(result.forecasts[0].forecast).toBeNull()
    expect(result.forecasts[1].forecast).toBeNull()
  })

  it("should scrub all forecasts when no user is provided", () => {
    const result = scrubHiddenForecastsAndSensitiveDetailsFromQuestion(
      mockQuestion,
      undefined,
    )
    expect(result.forecasts[0].forecast).toBeNull()
    expect(result.forecasts[1].forecast).toBeNull()
  })
})

describe("scrubApiKeyPropertyRecursive", () => {
  it("should remove apiKey from object", () => {
    const obj = { name: "Test", apiKey: "12345", nested: { apiKey: "67890" } }
    const result = scrubApiKeyPropertyRecursive(obj)
    expect(result.apiKey).toBeUndefined()
    expect(result.nested.apiKey).toBeUndefined()
    expect(result.name).toBe("Test")
  })

  it("should remove specified keys", () => {
    const obj = { name: "Test", email: "test@example.com", apiKey: "12345" }
    const result = scrubApiKeyPropertyRecursive(obj, ["email"])
    expect(result.apiKey).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(result.name).toBe("Test")
  })
})
