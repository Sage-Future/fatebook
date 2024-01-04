import { Prisma, Resolution, Tag, User } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { getBucketedForecasts } from "../../pages/api/calibration_graph"
import {
  QuestionWithForecasts,
  QuestionWithForecastsAndSharedWithAndLists,
  QuestionWithUserAndSharedWith,
} from "../../prisma/additional"
import {
  filterToUniqueIds,
  forecastsAreHidden,
  getDateYYYYMMDD,
} from "../_utils_common"
import prisma, {
  backendAnalyticsEvent,
  updateForecastQuestionMessages,
} from "../_utils_server"
import { deleteQuestion } from "../interactive_handlers/edit_question_modal"
import { syncToSlackIfNeeded } from "../interactive_handlers/postFromWeb"
import {
  handleQuestionResolution,
  undoQuestionResolution,
} from "../interactive_handlers/resolve"
import { questionsToCsv } from "./export"
import {
  createNotification,
  fatebookEmailFooter,
  sendEmailUnbatched,
} from "./notifications"
import { getQuestionUrl } from "./question_url"
import { Context, publicProcedure, router } from "./trpc_base"
import {
  getHtmlLinkQuestionTitle,
  getMarkdownLinkQuestionTitle,
  matchesAnEmailDomain,
} from "./utils"

const questionIncludes = (userId: string | undefined) => ({
  forecasts: {
    include: {
      user: true,
    },
  },
  user: true,
  sharedWith: true,
  sharedWithLists: {
    include: {
      author: true,
      users: true,
    },
  },
  questionMessages: {
    include: {
      message: true,
    },
  },
  comments: {
    include: {
      user: true,
    },
  },
  tags: {
    where: {
      user: {
        id:
          userId || "match with no users (because no user with this ID exists)",
      },
    },
  },
})

export type ExtraFilters = {
  resolved: boolean
  readyToResolve: boolean
  resolvingSoon: boolean
  filterTagIds?: string[]
  showAllPublic?: boolean // for fatebook.io/public, show all public questions from all users
  theirUserId?: string // for fatebook.io/user/:id, show all questions from this user
  filterTournamentId?: string // for fatebook.io/tournament/:id, show all questions from this tournament
  filterUserListId?: string // for fatebook.io/team/:id, show all questions from this user list
}

export const questionRouter = router({
  getQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!input.questionId) {
        return null
      }

      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          forecasts: {
            include: {
              user: true,
            },
          },
          user: true,
          sharedWith: true,
          sharedWithLists: {
            include: {
              author: true,
              users: true,
            },
          },
          questionMessages: {
            include: {
              message: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
          },
          ...(ctx.userId
            ? {
                tags: {
                  where: {
                    user: {
                      id: ctx.userId,
                    },
                  },
                },
              }
            : {
                tags: {
                  where: {
                    id: {
                      in: [],
                    },
                  },
                },
              }),
        },
      })
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId || "NO MATCH" },
      })
      assertHasAccess(ctx, question, user)
      return question && scrubHiddenForecastsFromQuestion(question, ctx.userId)
    }),

  getQuestionsUserCreatedOrForecastedOnOrIsSharedWith: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.number(),
        extraFilters: z
          .object({
            resolved: z.boolean(),
            readyToResolve: z.boolean(),
            resolvingSoon: z.boolean(),
            filterTagIds: z.array(z.string()).optional(),
            showAllPublic: z.boolean().optional(),
            theirUserId: z.string().optional(),
            filterTournamentId: z.string().optional(),
            filterUserListId: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (
        !ctx.userId &&
        !input.extraFilters?.showAllPublic &&
        !input.extraFilters?.theirUserId &&
        !input.extraFilters?.filterTournamentId
      ) {
        return null
      }

      return await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
        input,
        ctx,
      )
    }),

  getForecastCountByDate: publicProcedure
    .input(
      z.object({
        tags: z.array(z.string()).optional(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.userId) {
        return null
      }

      const forecasts = await prisma.forecast.findMany({
        where: {
          AND: [
            {
              userId: input.userId,
            },
            input.tags && input.userId === ctx.userId && input.tags.length > 0
              ? {
                  question: {
                    tags: {
                      some: {
                        name: {
                          in: input.tags,
                        },
                        userId: input.userId,
                      },
                    },
                  },
                }
              : {},
          ],
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      // count number per day
      const dateCounts = forecasts
        .map((f) => getDateYYYYMMDD(f.createdAt))
        .reduce(
          (acc, date) => {
            acc[date] = (acc[date] || 0) + 1
            return acc
          },
          {} as { [date: string]: number },
        )

      return { dateCounts, total: forecasts.length }
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        resolveBy: z.date(),
        prediction: z.number().max(1).min(0).optional(),
        tags: z.array(z.string()).optional(),
        unlisted: z.boolean().optional(),
        sharedPublicly: z.boolean().optional(),
        tournamentId: z.string().optional(),
        shareWithListIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a question",
        })
      }

      let tags: Tag[] = []
      if (input.tags && input.tags.length > 0) {
        tags = await prisma.tag.findMany({
          where: {
            userId: ctx.userId,
          },
        })
      }

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          userId: ctx.userId,
          unlisted: input.unlisted,
          sharedPublicly: input.sharedPublicly,
          forecasts: input.prediction
            ? {
                create: {
                  userId: ctx.userId,
                  forecast: input.prediction,
                },
              }
            : undefined,
          tags:
            input.tags && input.tags.length > 0
              ? {
                  connectOrCreate: input.tags.map((tag) => ({
                    where: {
                      id:
                        tags.find((t) => t.name === tag)?.id ||
                        "no tag with this id exists",
                    },
                    create: {
                      name: tag,
                      userId: ctx.userId as string,
                    },
                  })),
                }
              : undefined,
          tournaments: input.tournamentId
            ? {
                connect: {
                  id: input.tournamentId,
                },
              }
            : undefined,
          sharedWithLists: input.shareWithListIds
            ? {
                connect: input.shareWithListIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          tournaments: true,
          sharedWithLists: true,
        },
      })

      await backendAnalyticsEvent("question_created", {
        platform: "web",
        user: ctx.userId,
      })

      if (input.prediction) {
        await backendAnalyticsEvent("forecast_submitted", {
          platform: "web",
          user: ctx.userId,
          question: question.id,
          forecast: input.prediction,
        })
      }

      await syncToSlackIfNeeded(question, ctx.userId)
      return { url: getQuestionUrl(question), ...input }
    }),

  resolveQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        resolution: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await handleQuestionResolution(
        input.questionId,
        input.resolution as Resolution,
      )

      await backendAnalyticsEvent("question_resolved", {
        platform: "web",
        resolution: input.resolution.toLowerCase(),
      })
    }),

  undoResolution: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await undoQuestionResolution(input.questionId)

      await backendAnalyticsEvent("question_resolution_undone", {
        platform: "web",
        user: ctx.userId,
      })
    }),

  setSharedPublicly: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        sharedPublicly: z.boolean().optional(),
        unlisted: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          sharedPublicly: input.sharedPublicly,
          unlisted: input.unlisted,
        },
      })
    }),

  setSharedWith: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        sharedWith: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const question = (await getQuestionAssertAuthor(ctx, input.questionId, {
        user: true,
        sharedWith: true,
      })) as QuestionWithUserAndSharedWith

      const sharedWith = Array.from(new Set(input.sharedWith))
      const newlySharedWith = sharedWith.filter(
        (email) => !question.sharedWith.some((u) => u.email === email),
      )
      if (newlySharedWith.length === 0) {
        console.log("Shared with no one new")
        return
      }

      const existingUsers = await prisma.user.findMany({
        where: {
          email: {
            in: sharedWith,
          },
        },
      })

      const nonExistingUsers = sharedWith.filter(
        (email) => !existingUsers.some((u) => u.email === email),
      )

      if (nonExistingUsers.length > 0) {
        await prisma.user.createMany({
          data: nonExistingUsers.map((email) => ({ email })),
        })
      }

      await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          sharedWith: {
            set: sharedWith.map((email) => ({ email })),
          },
        },
      })

      await emailNewlySharedWithUsers(newlySharedWith, question)
    }),

  addForecast: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        forecast: z.number().max(1).min(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          forecasts: true,
          sharedWith: true,
          sharedWithLists: {
            include: {
              users: true,
              author: true,
            },
          },
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: ctx.userId || "NO MATCH" },
      })

      assertHasAccess(ctx, question, user)
      if (question === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        })
      }

      if (question.resolution) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Question has already been resolved",
        })
      }

      const lastForecastByUser = question.forecasts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // most recent first
        .find((f) => f.userId === ctx.userId)

      // disallow submitting the same forecast twice within two minutes
      if (
        lastForecastByUser?.forecast.toNumber() === input.forecast &&
        new Date().getTime() - lastForecastByUser?.createdAt.getTime() <
          1000 * 60 * 2
      ) {
        return
      }

      const submittedForecast = await prisma.forecast.create({
        data: {
          user: {
            connect: {
              id: ctx.userId,
            },
          },
          question: {
            connect: {
              id: input.questionId,
            },
          },
          forecast: input.forecast,
        },
        include: {
          user: true,
          question: {
            include: {
              forecasts: {
                include: {
                  user: {
                    include: {
                      profiles: true,
                    },
                  },
                },
              },
              questionMessages: {
                include: {
                  message: true,
                },
              },
              user: {
                include: {
                  profiles: true,
                },
              },
              comments: {
                include: {
                  user: true,
                },
              },
              sharedWith: true,
              sharedWithLists: {
                include: {
                  users: true,
                },
              },
            },
          },
        },
      })

      await updateForecastQuestionMessages(
        submittedForecast.question,
        "New forecast",
      )

      const q = submittedForecast.question
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const mostRecentForecast = q.forecasts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0]

      if (
        !mostRecentForecast ||
        q.forecasts.length < 4 ||
        mostRecentForecast.createdAt.getTime() < twoHoursAgo.getTime()
      ) {
        for (const user of filterToUniqueIds([
          q.user,
          ...q.forecasts.map((f) => f.user),
          ...q.comments.map((c) => c.user),
          ...q.sharedWith,
          ...q.sharedWithLists.flatMap((l) => l.users),
        ]).filter((u) => u && u.id !== submittedForecast.user.id)) {
          await createNotification({
            userId: user.id,
            title: `${submittedForecast.user.name || "Someone"} predicted ${
              submittedForecast.forecast.toNumber() * 100
            }% on "${q.title}"`,
            content: `${submittedForecast.user.name || "Someone"} predicted **${
              submittedForecast.forecast.toNumber() * 100
            }%** on ${getMarkdownLinkQuestionTitle(q)}.`,
            tags: ["new_forecast", q.id],
            url: getQuestionUrl(q),
          })
        }
      }

      await backendAnalyticsEvent("forecast_submitted", {
        platform: "web",
        user: ctx.userId,
        question: question.id,
        forecast: input.forecast,
      })
    }),

  addComment: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        comment: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          forecasts: {
            include: {
              user: true,
            },
          },
          sharedWith: true,
          sharedWithLists: {
            include: {
              users: true,
              author: true,
            },
          },
          user: true,
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: ctx.userId || "NO MATCH" },
      })
      assertHasAccess(ctx, question, user)
      if (question === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        })
      }

      const newComment = await prisma.comment.create({
        data: {
          question: {
            connect: {
              id: input.questionId,
            },
          },
          user: {
            connect: {
              id: ctx.userId,
            },
          },
          comment: input.comment,
        },
        include: {
          user: true,
        },
      })

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const mostRecentComment = question.comments.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0]

      if (
        !mostRecentComment ||
        question.comments.length < 4 ||
        mostRecentComment.createdAt.getTime() < twoHoursAgo.getTime()
      ) {
        for (const user of filterToUniqueIds([
          question.user,
          ...question.forecasts.map((f) => f.user),
          ...question.comments.map((c) => c.user),
          ...question.sharedWith,
          ...question.sharedWithLists.flatMap((l) => l.users),
        ]).filter((u) => u && u.id !== newComment.user.id)) {
          await createNotification({
            userId: user.id,
            title: `${newComment.user.name || "Someone"} commented on "${
              question.title
            }"`,
            content: `${
              newComment.user.name || "Someone"
            } commented on ${getMarkdownLinkQuestionTitle(question)}:\n\n${
              newComment.comment
            }`,
            tags: ["new_comment", question.id],
            url: getQuestionUrl(question),
          })
        }
      }

      await backendAnalyticsEvent("comment_added", {
        platform: "web",
        user: ctx.userId,
      })
    }),

  deleteComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await prisma.comment.findUnique({
        where: {
          id: input.commentId,
        },
        include: {
          user: true,
        },
      })

      if (!comment || comment.user.id !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" })
      }

      await prisma.comment.delete({
        where: {
          id: input.commentId,
        },
      })

      await backendAnalyticsEvent("comment_deleted", {
        platform: "web",
        user: ctx.userId,
      })
    }),

  getQuestionScores: publicProcedure
    .input(
      z.object({
        tags: z.array(z.string()).optional(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.userId) {
        return null
      }

      const questionScores = await prisma.questionScore.findMany({
        where: {
          AND: [
            {
              userId: input.userId,
            },
            input.tags && input.userId === ctx.userId && input.tags.length > 0
              ? {
                  question: {
                    tags: {
                      some: {
                        name: {
                          in: input.tags,
                        },
                        userId: input.userId,
                      },
                    },
                  },
                }
              : {},
          ],
        },
      })

      return questionScores
    }),

  getBrierScorePercentile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.userId) return null

      const allUsersScores = await prisma.questionScore.groupBy({
        by: ["userId"],
        _avg: {
          absoluteScore: true,
          relativeScore: true,
        },
      })

      const getPercentile = (metric: "relativeScore" | "absoluteScore") => {
        const sortedScores = allUsersScores
          .filter((score) => score._avg[metric] !== null)
          .sort((a, b) => Number(a._avg[metric]) - Number(b._avg[metric])) // ascending
        const userScore = sortedScores.find(
          (score) => score.userId === input.userId,
        )
        if (!userScore) return null

        return sortedScores.indexOf(userScore) / sortedScores.length
      }

      return {
        relativeScorePercentile: getPercentile("relativeScore"),
        absoluteScorePercentile: getPercentile("absoluteScore"),
      }
    }),

  getBucketedForecasts: publicProcedure
    .input(
      z.object({
        tags: z.array(z.string()).optional(),
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.userId) {
        return null
      }
      return await getBucketedForecasts(input.userId, input.tags)
    }),

  deleteQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await deleteQuestion(input.questionId)

      await backendAnalyticsEvent("question_deleted", {
        platform: "web",
        user: ctx.userId,
      })
    }),

  editQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        title: z.string().optional(),
        resolveBy: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      const question = await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
        },
        include: {
          forecasts: {
            include: {
              user: {
                include: {
                  profiles: true,
                },
              },
            },
          },
          user: {
            include: {
              profiles: true,
            },
          },
          questionMessages: {
            include: {
              message: true,
            },
          },
        },
      })

      await updateForecastQuestionMessages(question, "Question edited")

      await backendAnalyticsEvent("question_edited", {
        platform: "web",
        user: ctx.userId,
      })
    }),

  exportAllQuestions: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId) {
      return null
    }
    const questionsQ =
      await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
        {
          cursor: 0,
          limit: 100000,
        },
        ctx,
      )
    const questions = questionsQ.items

    const csv = await questionsToCsv(questions, ctx.userId)

    await backendAnalyticsEvent("exported_to_csv", {
      user: ctx.userId,
      platform: "web",
    })

    return csv
  }),
})

async function getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
  input: {
    cursor: number
    limit?: number | null | undefined
    extraFilters?: ExtraFilters | undefined
  },
  ctx: Context,
) {
  const limit = input.limit || 100

  const skip = input.cursor
  const userIdIfAuthed = ctx.userId || "no user id, don't match" // because of prisma undefined rules

  const user = ctx.userId
    ? await prisma.user.findUnique({ where: { id: userIdIfAuthed } })
    : null

  const questions = await prisma.question.findMany({
    skip: skip,
    take: limit + 1,
    orderBy: input.extraFilters?.resolvingSoon
      ? {
          resolveBy: "asc",
        }
      : input.extraFilters?.filterTournamentId
        ? {
            createdAt: "asc",
          }
        : {
            createdAt: "desc",
          },
    where: {
      AND: [
        input.extraFilters?.showAllPublic
          ? {
              AND: [{ sharedPublicly: true }, { unlisted: false }],
            }
          : input.extraFilters?.theirUserId ||
              input.extraFilters?.filterTournamentId
            ? {
                // show public, not unlisted questions by the user, and questions they've shared with me
                userId: input.extraFilters.theirUserId,
                tournaments: input.extraFilters.filterTournamentId
                  ? {
                      some: {
                        id: input.extraFilters.filterTournamentId,
                      },
                    }
                  : undefined,
                OR: [
                  {
                    sharedPublicly: true,
                    unlisted: input.extraFilters?.filterTournamentId
                      ? undefined
                      : false,
                  },
                  { sharedWith: { some: { id: userIdIfAuthed } } },
                  {
                    sharedWithLists: {
                      some: {
                        OR: [
                          { authorId: userIdIfAuthed },
                          { users: { some: { id: userIdIfAuthed } } },
                          matchesAnEmailDomain(user),
                        ],
                      },
                    },
                  },
                  input.extraFilters.filterTournamentId
                    ? { userId: userIdIfAuthed }
                    : {},
                ],
              }
            : input.extraFilters?.filterUserListId
              ? {
                  sharedWithLists: {
                    some: {
                      id: input.extraFilters.filterUserListId,
                      OR: [
                        { authorId: userIdIfAuthed },
                        { users: { some: { id: userIdIfAuthed } } },
                        matchesAnEmailDomain(user),
                      ],
                    },
                  },
                }
              : {
                  // only show questions I've created, forecasted on, or are shared with me
                  OR: [
                    { userId: ctx.userId },
                    {
                      forecasts: {
                        some: {
                          userId: ctx.userId,
                        },
                      },
                    },
                    {
                      sharedWith: {
                        some: {
                          id: ctx.userId,
                        },
                      },
                    },
                    {
                      sharedWithLists: {
                        some: {
                          OR: [
                            { authorId: userIdIfAuthed },
                            { users: { some: { id: userIdIfAuthed } } },
                            matchesAnEmailDomain(user),
                          ],
                        },
                      },
                    },
                  ],
                },
        input.extraFilters?.resolved
          ? {
              resolution: {
                not: null,
              },
            }
          : {},
        input.extraFilters?.readyToResolve
          ? {
              resolution: null,
              resolveBy: {
                lte: new Date(),
              },
            }
          : {},
        input.extraFilters?.resolvingSoon
          ? {
              resolveBy: {
                gte: new Date(),
              },
              resolution: null,
            }
          : {},
        input.extraFilters?.filterTagIds
          ? {
              tags: {
                some: {
                  id: {
                    in: input.extraFilters.filterTagIds,
                  },
                },
              },
            }
          : {},
      ],
    },
    include: questionIncludes(ctx.userId),
  })

  return {
    items: questions
      .map((q) => scrubHiddenForecastsFromQuestion(q, ctx.userId))
      // don't include the extra one - it's just to see if there's another page
      .slice(0, limit),

    nextCursor: questions.length > limit ? skip + limit : undefined,
  }
}

export async function emailNewlySharedWithUsers(
  newlySharedWith: string[],
  question: QuestionWithUserAndSharedWith,
) {
  await Promise.all(
    newlySharedWith.map(async (email) => {
      const author = question.user.name || question.user.email
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        await createNotification({
          userId: user.id,
          title: `${author} shared a prediction with you`,
          content: `${author} shared a prediction with you: **${getMarkdownLinkQuestionTitle(
            question,
          )}**\n\n[See ${author}'s prediction and add your own on Fatebook.](${getQuestionUrl(
            question,
          )})`,
          url: getQuestionUrl(question),
          tags: ["shared_prediction", question.id],
        })
      } else {
        await sendEmailUnbatched({
          to: email,
          subject: `${author} shared a prediction with you`,
          textBody: `"${question.title}"`,
          htmlBody: `<p>${author} shared a prediction with you: <b>${getHtmlLinkQuestionTitle(
            question,
          )}</b></p>
<p><a href=${getQuestionUrl(
            question,
          )}>See ${author}'s prediction and add your own on Fatebook.</a></p>
${fatebookEmailFooter(email)}`,
        })
      }
    }),
  )
}

export async function getQuestionAssertAuthor(
  ctx: { userId: string | undefined },
  questionId: string,
  questionInclude?: Prisma.QuestionInclude,
) {
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: questionInclude,
  })

  if (!question) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }
  if (question.userId !== ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only the question's author can do that",
    })
  }

  return question
}

export function assertHasAccess(
  ctx: { userId: string | undefined },
  question: QuestionWithForecastsAndSharedWithAndLists | null,
  user: User | null,
) {
  if (question === null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }

  if (
    question.sharedPublicly ||
    question.sharedWith.some((u) => u.id === ctx.userId) ||
    question.sharedWithLists.some(
      (l) =>
        l.users.some((u) => u.id === ctx.userId) ||
        l.authorId === ctx.userId ||
        l.emailDomains.some((ed) => user && user.email.endsWith(ed)),
    ) ||
    question.userId === ctx.userId ||
    question.forecasts.some((f) => f.userId === ctx.userId) // for slack questions
  ) {
    return question as QuestionWithForecasts
  } else {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You don't have access to that question",
    })
  }
}

export function scrubHiddenForecastsFromQuestion<
  QuestionX extends QuestionWithForecasts,
>(question: QuestionX, userId: string | undefined) {
  question = scrubApiKeyPropertyRecursive(question)

  if (!forecastsAreHidden(question)) {
    return question
  }

  return {
    ...question,
    forecasts: question.forecasts.map((f) => {
      const hideForecast = f.userId !== userId && userId
      return {
        ...f,
        ...(hideForecast
          ? {
              forecast: null,
              userId: null,
              user: null,
              profileId: null,
              profile: null,
            }
          : {}),
      }
    }),
  }
}

export function scrubApiKeyPropertyRecursive<T>(
  obj: T,
  otherKeysToScrub?: string[],
) {
  // warning - this mutates the object
  for (const key in obj) {
    if (key === "apiKey" || otherKeysToScrub?.includes(key)) {
      ;(obj as any)[key] = "scrubbed"
    } else if (typeof obj[key] === "object") {
      obj[key] = scrubApiKeyPropertyRecursive(obj[key])
    }
  }
  return obj
}
