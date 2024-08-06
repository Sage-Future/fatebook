import { Prisma, QuestionType, Tag, User } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
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
import {
  backendAnalyticsEvent,
  updateForecastQuestionMessages,
} from "../_utils_server"
import { deleteQuestion } from "../interactive_handlers/edit_question_modal"
import { syncToSlackIfNeeded } from "../interactive_handlers/postFromWeb"
import {
  handleQuestionResolution,
  undoQuestionOptionResolution,
  undoQuestionResolution,
} from "../interactive_handlers/resolve"
import prisma from "../prisma"
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
  getSearchedPredictionBounds,
  matchesAnEmailDomain,
} from "./utils"

const questionIncludes = (userId: string | undefined) => ({
  forecasts: {
    include: {
      user: true,
    },
  },
  options: {
    include: {
      forecasts: {
        include: {
          user: true,
        },
      },
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

const zodExtraFilters = z.object({
  resolved: z
    .boolean({ description: "Only get resolved questions" })
    .optional(),
  readyToResolve: z
    .boolean({ description: "Only get questions ready to be resolved" })
    .optional(),
  resolvingSoon: z
    .boolean({ description: "Only get questions that are resolving soon" })
    .optional(),
  filterTagIds: z
    .array(
      z.string({ description: "Only get questions with any of these tags" }),
    )
    .optional(),
  showAllPublic: z
    .boolean({
      description:
        "Show all public questions from fatebook.io/public (if false, get only questions you've created, forecasted on, or are shared with you)",
    })
    .optional(),
  searchString: z
    .string({ description: "Only get questions containing this search string" })
    .optional(),
  theirUserId: z
    .string({
      description:
        "Show questions created by this user (instead of your questions)",
    })
    .optional(),
  filterTournamentId: z
    .string({
      description:
        "Show questions in this tournament (instead of your questions)",
    })
    .optional(),
  filterUserListId: z
    .string({
      description: "Show questions in this team (instead of your questions)",
    })
    .optional(),
})
export type ExtraFilters = z.infer<typeof zodExtraFilters>

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
          options: {
            include: {
              forecasts: {
                include: {
                  user: true,
                },
              },
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
        limit: z.number().min(1).nullish(),
        cursor: z.number(),
        extraFilters: zodExtraFilters.optional(),
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

  getQuestionsApiProcedure: publicProcedure
    .input(
      z.object({
        apiKey: z.string({
          description: "Your Fatebook API key. Get it at fatebook.io/api-setup",
        }),
        ...{
          ...zodExtraFilters.shape,
          filterTagIds: z
            .string({
              description:
                "Comma-separated list of tag IDs. Only get questions with at least one of these tags",
            })
            .optional(),
        },
        limit: z
          .number({
            description: "Maximum number of questions to return. Default = 100",
          })
          .optional(),
        cursor: z
          .number({
            description:
              "Used for pagination. 0 = return the first [limit] questions, 100 = skip the first 100 questions and return the next [limit] questions.",
          })
          .optional(),
      }),
    )
    .meta({
      openapi: {
        method: "GET",
        path: "/v0/getQuestions",
        description:
          "By default, this fetches all questions that you've created, forecasted on, or are shared with you. Alternatively, if you set showAllPublic to true, it fetches all public questions from fatebook.io/public.",
      },
    })
    .output(
      z.object({
        items: z.array(z.any()),
      }),
    ) // required for openapi
    .query(async ({ input }) => {
      const user = await getUserByApiKeyOrThrow(input.apiKey)

      return scrubApiKeyPropertyRecursive(
        await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
          {
            cursor: input.cursor || 0,
            limit: input.limit,
            extraFilters: {
              ...input,
              filterTagIds: input.filterTagIds?.split(","),
            },
          },
          {
            userId: user.id,
            session: null,
          },
        ),
        [
          "email",
          "discordUserId",
          "apiKey",
          "unsubscribedFromEmailsAt",
          "emailVerified",
          "staleReminder",
        ],
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
        exclusiveAnswers: z.boolean().optional(),
        options: z
          .array(
            z.object({
              text: z.string(),
              prediction: z.number().min(0).max(1).optional(),
            }),
          )
          .optional(),
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

      const isMultiChoice = input.options && input.options.length > 0

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          user: { connect: { id: ctx.userId } }, // Changed from userId to user connect
          type: isMultiChoice
            ? QuestionType.MULTIPLE_CHOICE
            : QuestionType.BINARY,
          unlisted: input.unlisted,
          sharedPublicly: input.sharedPublicly,
          exclusiveAnswers: input.exclusiveAnswers,
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
          options: isMultiChoice
            ? {
                create: input.options!.map((option) => ({
                  text: option.text,
                  user: { connect: { id: ctx.userId } },
                })),
              }
            : undefined,
        },
        include: {
          tournaments: true,
          sharedWithLists: true,
          options: true,
          tags: true,
        },
      })

      if (isMultiChoice && question.options) {
        await Promise.all(
          input.options!.map((option) => {
            if (option.prediction !== undefined) {
              return prisma.forecast.create({
                data: {
                  question: { connect: { id: question.id } },
                  user: { connect: { id: ctx.userId } },
                  forecast: new Decimal(option.prediction),
                  option: {
                    connect: {
                      id: question.options.find((o) => o.text === option.text)
                        ?.id,
                    },
                  },
                },
              })
            }
          }),
        )
      } else if (!isMultiChoice && input.prediction) {
        // Create forecast for binary question
        await prisma.forecast.create({
          data: {
            question: { connect: { id: question.id } },
            user: { connect: { id: ctx.userId } },
            forecast: new Decimal(input.prediction),
          },
        })
      }

      await backendAnalyticsEvent("question_created", {
        platform: "web",
        user: ctx.userId,
      })

      // TODO: how do we want to handle analytics for MCQ forecasts?
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
        resolution: z.string({
          description:
            "Resolve to YES, NO or AMBIGUOUS if it's a binary question and AMBIGUOUS, OTHER, or $OPTION if it's a multi-choice question",
        }),
        questionType: z.string(),
        apiKey: z.string().optional(),
        optionId: z.string().optional(),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/v0/resolveQuestion",
        description:
          "Resolve to YES, NO or AMBIGUOUS if it's a binary question and AMBIGUOUS, OTHER, or $OPTION if it's a multi-choice question",
      },
    })
    .output(z.undefined())
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

      await handleQuestionResolution(
        input.questionId,
        input.resolution as string,
        input.questionType as QuestionType,
        input.optionId,
      )

      await backendAnalyticsEvent("question_resolved", {
        platform: input.apiKey ? "api" : "web",
        resolution: input.resolution.toLowerCase(),
      })
    }),

  undoResolution: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        optionId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      if (input.optionId) {
        await undoQuestionOptionResolution(input.optionId)
      }
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
        sharedPublicly: z
          .boolean({
            description:
              "Change whether the question is shared with anyone with the link",
          })
          .optional(),
        unlisted: z
          .boolean({
            description:
              "Change whether the question is unlisted (not shown on fatebook.io/public)",
          })
          .optional(),
        apiKey: z.string().optional(),
      }),
    )
    .meta({
      openapi: {
        method: "PATCH",
        path: "/v0/setSharedPublicly",
        description:
          "Change the visibility of the question. The 'sharedPublicly' parameter sets whether the question is accessible to anyone via a direct link. The 'unlisted' parameter sets whether the question is visible on fatebook.io/public",
      },
    })
    .output(z.undefined())
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

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

  setHideForecastsUntilPrediction: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        hideForecastsUntilPrediction: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          hideForecastsUntilPrediction: input.hideForecastsUntilPrediction,
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
      const question = (await getQuestionAssertAuthor(
        ctx,
        input.questionId,
        undefined,
        {
          user: true,
          sharedWith: true,
        },
      )) as QuestionWithUserAndSharedWith

      const sharedWith = Array.from(new Set(input.sharedWith))
      const newlySharedWith = sharedWith.filter(
        (email) => !question.sharedWith.some((u) => u.email === email),
      )

      if (newlySharedWith.length > 0) {
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

      if (newlySharedWith.length > 0) {
        await emailNewlySharedWithUsers(newlySharedWith, question)
      }
    }),

  getShareSuggestions: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    // Users that the current user has shared questions with
    const sharedWithUsers = await prisma.question
      .findMany({
        where: {
          userId: ctx.userId,
        },
        select: {
          sharedWith: true,
        },
      })
      .then((results) => results.flatMap((result) => result.sharedWith))

    // Users that have shared questions with the current user
    const sharedByUsers = await prisma.question
      .findMany({
        where: {
          sharedWith: {
            some: {
              id: ctx.userId,
            },
          },
        },
        select: {
          user: true,
        },
      })
      .then((results) => results.map((result) => result.user))

    // Members and authors of lists containing or authored by the current user
    const userListUsers = await prisma.userList
      .findMany({
        where: {
          OR: [
            { users: { some: { id: ctx.userId } } },
            { authorId: ctx.userId },
          ],
        },
        select: {
          users: true,
          author: true,
        },
      })
      .then((results) =>
        results.flatMap((result) => [...result.users, result.author]),
      )

    // Combine all lists and remove duplicates
    const allUsers = [...sharedWithUsers, ...sharedByUsers, ...userListUsers]
    const uniqueUsers = Array.from(
      new Set(allUsers.map((user) => user.id)),
    ).map((id) => {
      return allUsers.find((user) => user.id === id)
    })

    return uniqueUsers
  }),

  addForecast: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        forecast: z
          .number({
            description: "The forecast to add. Must be between 0 and 1.",
          })
          .max(1)
          .min(0),
        optionId: z.string().optional(),
        apiKey: z.string().optional(),
      }),
    )
    .output(z.undefined())
    .meta({
      openapi: {
        method: "POST",
        path: "/v0/addForecast",
        description:
          "Add a forecast to the question. Forecasts are between 0 and 1.",
      },
    })
    .mutation(async ({ input, ctx }) => {
      const user = await getUserFromCtxOrApiKeyOrThrow(ctx, input.apiKey)

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
          // If an optionId is set, the forecast goes on that option
          // Else it goes on the question itself
          ...(input.optionId
            ? {
                option: { connect: { id: input.optionId } },
                forecast: input.forecast,
              }
            : { forecast: input.forecast }),
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
      for (const user of filterToUniqueIds([
        q.user,
        ...q.forecasts.map((f) => f.user),
        ...q.comments.map((c) => c.user),
        ...q.sharedWith,
        ...q.sharedWithLists.flatMap((l) => l.users),
      ]).filter((u) => u && u.id !== submittedForecast.user.id)) {
        await createNotification({
          userId: user.id,
          title: `${submittedForecast.user.name || "Someone"} predicted on "${
            q.title
          }"`,
          content: `${
            submittedForecast.user.name || "Someone"
          } predicted on ${getMarkdownLinkQuestionTitle(q)}`,
          tags: ["new_forecast", q.id],
          url: getQuestionUrl(q),
        })
      }

      await backendAnalyticsEvent("forecast_submitted", {
        platform: input.apiKey ? "api" : "web",
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
        apiKey: z.string().optional(),
      }),
    )
    .output(z.undefined())
    .meta({ openapi: { method: "POST", path: "/v0/addComment" } })
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

      const user = await getUserFromCtxOrApiKeyOrThrow(ctx, input.apiKey)
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

      await backendAnalyticsEvent("comment_added", {
        platform: input.apiKey ? "api" : "web",
        user: ctx.userId || user.id,
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
        apiKey: z.string().optional(),
      }),
    )
    .output(z.undefined())
    .meta({ openapi: { method: "DELETE", path: "/v0/deleteQuestion" } })
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

      await deleteQuestion(input.questionId)

      await backendAnalyticsEvent("question_deleted", {
        platform: input.apiKey ? "api" : "web",
        user: ctx.userId,
      })
    }),

  editQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        title: z.string().optional(),
        resolveBy: z.date().optional(),
        apiKey: z.string().optional(),
      }),
    )
    .output(z.undefined())
    .meta({ openapi: { method: "PATCH", path: "/v0/editQuestion" } })
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

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
        platform: input.apiKey ? "api" : "web",
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

  const searchedPredictionBounds = getSearchedPredictionBounds(
    input.extraFilters?.searchString,
  )

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
                  OR: [
                    {
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
                    },
                    // if the question is in a tournament shared with the user list, also include it
                    {
                      tournaments: {
                        some: {
                          userList: {
                            id: input.extraFilters?.filterUserListId,
                            OR: [
                              { authorId: userIdIfAuthed },
                              { users: { some: { id: userIdIfAuthed } } },
                              matchesAnEmailDomain(user),
                            ],
                          },
                        },
                      },
                    },
                  ],
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
        searchedPredictionBounds
          ? {
              forecasts: {
                some: {
                  userId: userIdIfAuthed,
                  forecast: {
                    gte: searchedPredictionBounds.lowerBound / 100,
                    lte: searchedPredictionBounds.upperBound / 100,
                  },
                },
              },
            }
          : input.extraFilters?.searchString
            ? {
                OR: [
                  {
                    title: {
                      contains: input.extraFilters.searchString,
                      mode: "insensitive",
                    },
                  },
                  {
                    comments: {
                      some: {
                        comment: {
                          contains: input.extraFilters.searchString,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                ],
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
  apiKey?: string,
  questionInclude?: Prisma.QuestionInclude,
) {
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: questionInclude,
  })

  const userId = ctx?.userId || (await getUserByApiKeyOrThrow(apiKey || "")).id

  if (!question) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }
  if (question.userId !== userId) {
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

  if (!forecastsAreHidden(question, userId)) {
    return question
  }

  return {
    ...question,
    forecasts: question.forecasts.map((f) => {
      const hideForecast = f.userId !== userId || !userId
      return {
        ...f,
        ...(hideForecast
          ? {
              forecast: null,
              userId: null,
              user: null,
              profileId: null,
              profile: null,
              options: null,
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
      ;(obj as any)[key] = undefined
    } else if (typeof obj[key] === "object") {
      obj[key] = scrubApiKeyPropertyRecursive(obj[key], otherKeysToScrub)
    }
  }
  return obj
}

async function getUserByApiKeyOrThrow(apiKey: string) {
  const user = await prisma.user.findFirst({
    where: {
      apiKey,
    },
  })
  if (user) {
    return user
  }
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message:
      "Could not find a user with that API key. See fatebook.io/api-setup",
  })
}

async function getUserFromCtxOrApiKeyOrThrow(
  ctx: Context,
  apiKey: string | undefined,
) {
  if (ctx.userId) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId || "NO MATCH" },
    })
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Could not find a user with that ID",
      })
    }
    return user
  }

  if (!apiKey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must provide an API key. See fatebook.io/api-setup",
    })
  }

  return await getUserByApiKeyOrThrow(apiKey)
}
