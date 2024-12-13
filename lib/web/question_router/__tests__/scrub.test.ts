import { Decimal } from "@prisma/client/runtime/library"
import { QuestionWithForecasts } from "../../../../prisma/additional"
import {
  scrubApiKeyPropertyRecursive,
  scrubHiddenForecastsAndSensitiveDetailsFromQuestion,
} from "../scrub"

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
        forecast: new Decimal(0.5),
        createdAt: new Date(),
        comment: null,
        profileId: null,
        questionId: "1",
        optionId: null,
      },
      {
        id: 2,
        userId: "user2",
        forecast: new Decimal(0.7),
        createdAt: new Date(),
        comment: null,
        profileId: null,
        questionId: "1",
        optionId: null,
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

  it("should show your and other user's predictions if you've predicted", () => {
    const result = scrubHiddenForecastsAndSensitiveDetailsFromQuestion(
      mockQuestion,
      "user1",
    )
    expect(result.forecasts[0].forecast).toStrictEqual(new Decimal(0.5))
    expect(result.forecasts[1].forecast).toStrictEqual(new Decimal(0.7))
  })

  it("should scrub all forecasts if you haven't predicted", () => {
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
    const obj = {
      name: "Test",
      email: "test@example.com",
      apiKey: "12345",
      nested: { email: "another@example.com" },
    }
    const result = scrubApiKeyPropertyRecursive(obj, ["email"])
    expect(result.apiKey).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(result.name).toBe("Test")
    expect(result.nested.email).toBeUndefined()
  })
})
