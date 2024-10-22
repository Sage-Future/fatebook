import { emailNewlySharedWithUsers } from "../email_shared"
import prisma from "../../../prisma"
import { createNotification, sendEmailUnbatched } from "../../notifications"
import { getQuestionUrl } from "../../question_url"
import { QuestionWithUserAndSharedWith } from "../../../../prisma/additional"
import { QuestionType } from "@prisma/client"

jest.mock("../../../prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}))

jest.mock("../../notifications", () => ({
  createNotification: jest.fn(),
  sendEmailUnbatched: jest.fn(),
  fatebookEmailFooter: jest.fn().mockReturnValue(""),
}))

jest.mock("../../question_url", () => ({
  getQuestionUrl: jest.fn(),
}))

describe("emailNewlySharedWithUsers", () => {
  const mockQuestion: QuestionWithUserAndSharedWith = {
    id: "q1",
    title: "Test Question",
    user: {
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date(),
      image: null,
      staleReminder: false,
      unsubscribedFromEmailsAt: null,
      apiKey: null,
      discordUserId: null,
      emailVerified: null,
      profiles: [],
    },
    sharedWith: [],
    createdAt: new Date(),
    comment: null,
    profileId: null,
    type: QuestionType.BINARY,
    resolveBy: new Date(),
    resolved: false,
    pingedForResolution: false,
    exclusiveAnswers: null,
    resolution: null,
    resolvedAt: null,
    notes: null,
    hideForecastsUntil: null,
    hideForecastsUntilPrediction: null,
    userId: "u1",
    sharedPublicly: false,
    unlisted: false,
  } as QuestionWithUserAndSharedWith

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getQuestionUrl as jest.Mock).mockReturnValue("http://example.com/q1")
  })

  it("should create notification for existing users", async () => {
    const existingUser = { id: "u2", email: "existing@example.com" }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    await emailNewlySharedWithUsers(["existing@example.com"], mockQuestion)

    expect(createNotification).toHaveBeenCalledWith({
      userId: "u2",
      title: "Test User shared a prediction with you",
      content: "Test User shared a prediction with you",
      url: "http://example.com/q1",
      tags: ["shared_prediction", "q1"],
      questionId: "q1",
    })
    expect(sendEmailUnbatched).not.toHaveBeenCalled()
  })

  it("should send email for non-existing users", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await emailNewlySharedWithUsers(["new@example.com"], mockQuestion)

    expect(sendEmailUnbatched).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        subject: "Test User shared a prediction with you",
      }),
    )
    expect(createNotification).not.toHaveBeenCalled()
  })

  it("should handle multiple users", async () => {
    const existingUser = { id: "u2", email: "existing@example.com" }
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(null)

    await emailNewlySharedWithUsers(
      ["existing@example.com", "new@example.com"],
      mockQuestion,
    )

    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(sendEmailUnbatched).toHaveBeenCalledTimes(1)
  })
})
