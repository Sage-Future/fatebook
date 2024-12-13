import { User } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { QuestionWithForecastsAndSharedWithAndLists } from "../../../../prisma/additional"
import { assertHasAccess } from "../assert"

describe("assertHasAccess", () => {
  const mockUser: User = {
    id: "user1",
    email: "user1@user1domain.com",
    name: "User One",
    image: null,
    createdAt: new Date(),
    staleReminder: false,
    unsubscribedFromEmailsAt: null,
    apiKey: null,
    discordUserId: null,
    emailVerified: null,
  }

  const mockOtherUser: User = {
    id: "user2",
    email: "user2@user2domain.com",
    name: "User Two",
    image: null,
    createdAt: new Date(),
    staleReminder: false,
    unsubscribedFromEmailsAt: null,
    apiKey: null,
    discordUserId: null,
    emailVerified: null,
  }

  const mockQuestion: QuestionWithForecastsAndSharedWithAndLists = {
    id: "1",
    title: "Test Question",
    userId: "user2",
    createdAt: new Date(),
    comment: null,
    profileId: null,
    type: "BINARY",
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
    hideForecastsUntilPrediction: null,
    unlisted: false,
  }

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

  it("should not throw error if user is in a userList that the question is shared with", () => {
    const sharedQuestion = {
      ...mockQuestion,
      sharedWithLists: [
        {
          id: "list1",
          name: "Test List",
          createdAt: new Date(),
          userId: "otherUser",
          inviteId: null,
          emailDomains: [],
          syncToSlackTeamId: null,
          syncToSlackChannelId: null,
          authorId: "otherUser",
          author: mockOtherUser,
          users: [mockUser],
        },
      ],
    }
    expect(() => assertHasAccess(sharedQuestion, mockUser)).not.toThrow()
  })

  it("should not throw error if user is the author of a userList that the question is shared with", () => {
    const sharedQuestion = {
      ...mockQuestion,
      sharedWithLists: [
        {
          id: "list1",
          name: "Test List",
          createdAt: new Date(),
          userId: "user1",
          inviteId: null,
          emailDomains: [],
          syncToSlackTeamId: null,
          syncToSlackChannelId: null,
          authorId: "user1",
          author: mockUser,
          users: [mockOtherUser],
        },
      ],
    }
    expect(() => assertHasAccess(sharedQuestion, mockUser)).not.toThrow()
  })

  it("should not throw error if user's email domain is in a userList the question is shared with", () => {
    const sharedQuestion = {
      ...mockQuestion,
      sharedWithLists: [
        {
          id: "list1",
          name: "Test List",
          createdAt: new Date(),
          userId: "user2",
          inviteId: null,
          emailDomains: ["user1domain.com"],
          syncToSlackTeamId: null,
          syncToSlackChannelId: null,
          authorId: "user2",
          author: mockOtherUser,
          users: [mockUser],
        },
      ],
    }
    expect(() => assertHasAccess(sharedQuestion, mockUser)).not.toThrow()
  })

  it("should throw error if user's email domain is not in a userList the question is shared with", () => {
    const sharedQuestion = {
      ...mockQuestion,
      sharedWithLists: [
        {
          id: "list1",
          name: "Test List",
          createdAt: new Date(),
          userId: "user2",
          inviteId: null,
          emailDomains: ["user2domain.com"],
          syncToSlackTeamId: null,
          syncToSlackChannelId: null,
          authorId: "user2",
          author: mockOtherUser,
          users: [mockOtherUser],
        },
      ],
    }
    expect(() => assertHasAccess(sharedQuestion, mockUser)).toThrow(TRPCError)
  })
})
