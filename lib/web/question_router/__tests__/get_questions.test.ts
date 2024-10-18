import { getQuestionsUserCreatedOrForecastedOnOrIsSharedWith } from "../get_questions"
import prisma from "../../../prisma"
import { Context } from "../../trpc_base"
import { ExtraFilters } from "../types"

jest.mock("../../../prisma", () => ({
  question: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}))

describe("getQuestionsUserCreatedOrForecastedOnOrIsSharedWith", () => {
  const mockContext: Context = {
    userId: "user1",
    session: null,
  }

  const mockInput = {
    cursor: 0,
    limit: 10,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return questions with default settings", async () => {
    const mockQuestions = [
      { id: "q1", title: "Question 1" },
      { id: "q2", title: "Question 2" },
    ]
    ;(prisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions)

    const result = await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
      mockInput,
      mockContext,
    )

    expect(result.items).toEqual(mockQuestions)
    expect(result.nextCursor).toBeUndefined()
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 11,
        orderBy: { createdAt: "desc" },
      }),
    )
  })

  it("should handle pagination", async () => {
    const mockQuestions = Array(11)
      .fill(null)
      .map((_, i) => ({ id: `q${i}`, title: `Question ${i}` }))
    ;(prisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions)

    const result = await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
      mockInput,
      mockContext,
    )

    expect(result.items).toHaveLength(10)
    expect(result.nextCursor).toBe(10)
  })

  it("should apply extra filters", async () => {
    const extraFilters: ExtraFilters = {
      resolved: true,
      searchString: "test",
    }
    ;(prisma.question.findMany as jest.Mock).mockResolvedValue([])

    await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
      { ...mockInput, extraFilters },
      mockContext,
    )

    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: [
                { userId: "user1" },
                { forecasts: { some: { userId: "user1" } } },
                { sharedWith: { some: { id: "user1" } } },
                {
                  sharedWithLists: {
                    some: {
                      OR: [
                        { authorId: "user1" },
                        { users: expect.anything() },
                        { emailDomains: expect.anything() },
                      ],
                    },
                  },
                },
              ],
            }),
            { resolution: { not: null } },
            expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: "test", mode: "insensitive" } },
                {
                  comments: {
                    some: { comment: { contains: "test", mode: "insensitive" } },
                  },
                },
                {
                  tags: {
                    some: {
                      name: { contains: "test", mode: "insensitive" },
                      userId: "user1",
                    },
                  },
                },
              ]),
            }),
          ]),
        }),
      }),
    )
  })

  it("should handle showAllPublic filter", async () => {
    const extraFilters: ExtraFilters = {
      showAllPublic: true,
    }
    ;(prisma.question.findMany as jest.Mock).mockResolvedValue([])

    await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
      { ...mockInput, extraFilters },
      mockContext,
    )

    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { AND: [{ sharedPublicly: true }, { unlisted: false }] },
          ]),
        }),
      }),
    )
  })
})
