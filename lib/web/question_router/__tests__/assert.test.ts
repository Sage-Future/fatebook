import { assertHasAccess } from "../assert"
import { TRPCError } from "@trpc/server"
import { QuestionWithForecastsAndSharedWithAndLists } from "../../../../prisma/additional"
import { User } from "@prisma/client"

describe("assertHasAccess", () => {
  const mockUser: User = { id: "user1", email: "user1@example.com" } as User
  const mockQuestion: QuestionWithForecastsAndSharedWithAndLists = {
    id: "1",
    title: "Test Question",
    userId: "user2",
    createdAt: new Date(),
    comment: null,
    profileId: null,
    type: "BINARY", // Assuming this is a valid QuestionType
    resolveBy: new Date(),
    resolved: false,
    pingedForResolution: false,
    resolution: null,
    resolvedAt: null,
    notes: null,
    hideForecastsUntil: null,
    exclusiveAnswers: null,
    sharedPublicly: false,
    sharedWith: [],
    sharedWithLists: [],
    forecasts: [],
    hideForecastsUntilPrediction: null, // Add this line
    unlisted: false, // Add this line
    // ... Add any other missing properties
  } as QuestionWithForecastsAndSharedWithAndLists

  it("should throw error if question is null", () => {
    expect(() => assertHasAccess(null, mockUser)).toThrow(TRPCError)
  })

  it("should not throw error if question is shared publicly", () => {
    const publicQuestion = { ...mockQuestion, sharedPublicly: true }
    expect(() => assertHasAccess(publicQuestion, mockUser)).not.toThrow()
  })

  it("should not throw error if user is the question owner", () => {
    const ownedQuestion = { ...mockQuestion, userId: "user1" }
    expect(() => assertHasAccess(ownedQuestion, mockUser)).not.toThrow()
  })

  it("should throw error if user has no access", () => {
    expect(() => assertHasAccess(mockQuestion, mockUser)).toThrow(TRPCError)
  })

  it("should not throw error if question is shared with user", () => {
    const sharedQuestion = {
      ...mockQuestion,
      sharedWith: [
        {
          id: "user1",
          name: "User One",
          createdAt: new Date(),
          email: "user1@example.com",
          image: null,
          staleReminder: false,
          unsubscribedFromEmailsAt: null,
          apiKey: "apiKey1",
          discordUserId: null,
          emailVerified: null,
        },
      ],
    }
    expect(() => assertHasAccess(sharedQuestion, mockUser)).not.toThrow()
  })
})
