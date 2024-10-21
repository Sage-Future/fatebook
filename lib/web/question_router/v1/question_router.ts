import { QuestionType, Tag } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { getBucketedForecasts } from "../../../../pages/api/calibration_graph"
import { QuestionWithUserAndSharedWith } from "../../../../prisma/additional"
import {
  displayForecast,
  filterToUniqueIds,
  forecastsAreHidden,
  getDateYYYYMMDD,
} from "../../../_utils_common"
import {
  backendAnalyticsEvent,
  updateForecastQuestionMessages,
} from "../../../_utils_server"
import { deleteQuestion } from "../../../interactive_handlers/edit_question_modal"
import { syncToSlackIfNeeded } from "../../../interactive_handlers/postFromWeb"
import {
  handleQuestionResolution,
  undoQuestionOptionResolution,
  undoQuestionResolution,
} from "../../../interactive_handlers/resolve"
import prisma from "../../../prisma"
import { questionsToCsv } from "../../export"
import { createNotification } from "../../notifications"
import { getQuestionUrl } from "../../question_url"
import { publicProcedure, router } from "../../trpc_base"
import {
  ForecastSchema,
  QuestionSchema,
} from "../../../../prisma/generated/zod"
import { zodExtraFilters } from "../types"
import {
  scrubApiKeyPropertyRecursive,
  scrubHiddenForecastsAndSensitiveDetailsFromQuestion,
} from "../scrub"
import {
  getUserByApiKeyOrThrow,
  getUserFromCtxOrApiKeyOrThrow,
} from "../get_user"
import { emailNewlySharedWithUsers } from "../email_shared"
import { assertHasAccess, getQuestionAssertAuthor } from "../assert"
import { getQuestionsUserCreatedOrForecastedOnOrIsSharedWith } from "../get_questions"

export const questionRouter = router({
  getQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string().optional(),
        apiKey: z.string().optional(),
      }),
    )
    .output(QuestionSchema)
    .meta({
      openapi: {
        method: "GET",
        path: "/v1/getQuestion",
        description: "Get details of a specific question",
        example: {
          request: {
            questionId: "cm05iuuhx00066e7a1hncujn0",
            apiKey: "your_api_key_here",
          },
        },
      },
    })
    .query(async ({ input, ctx }) => {
      if (!input.questionId) {
        return null as any // needed in order to appease type checker
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

      const user = await getUserFromCtxOrApiKeyOrThrow(ctx, input.apiKey)
      assertHasAccess(question, user)
      return (
        question &&
        scrubHiddenForecastsAndSensitiveDetailsFromQuestion(
          question,
          ctx.userId,
        )
      )
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

      return scrubApiKeyPropertyRecursive(
        await getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(input, ctx),
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

  getOnboardingStage: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not logged in",
      })
    }

    const userId = ctx.userId

    const [hasCreatedQuestions, hasForecastsOnOwnQuestions] = await Promise.all(
      [
        prisma.question.findFirst({
          where: { userId },
          select: { id: true },
        }),
        prisma.forecast.findFirst({
          where: {
            userId,
            question: {
              userId,
            },
          },
        }),
      ],
    )

    if (!hasCreatedQuestions) {
      return "NO_QUESTIONS"
    }

    if (!hasForecastsOnOwnQuestions) {
      return "NO_FORECASTS_ON_OWN_QUESTIONS"
    }

    return "COMPLETE"
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
        path: "/v1/getQuestions",
        description:
          "By default, this fetches all questions that you've created, forecasted on, or are shared with you. Alternatively, if you set showAllPublic to true, it fetches all public questions from fatebook.io/public.",
      },
    })
    .output(
      z.object({
        items: z.array(QuestionSchema),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const user = await getUserByApiKeyOrThrow(input.apiKey)

      const result = scrubApiKeyPropertyRecursive(
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

      return {
        items: result.items.map((item) => QuestionSchema.parse(item)),
        nextCursor: result.nextCursor,
      }
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
        apiKey: z.string().optional(),
      }),
    )
    .output(
      z.object({
        url: z.string(),
        title: z.string(),
        prediction: z.number().min(0).max(1).optional(),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/createQuestion",
        description: "Create a new question (binary or multiple choice)",
        example: {
          request: {
            binaryExample: {
              title: "Will it rain tomorrow?",
              resolveBy: "2023-12-31T23:59:59Z",
              prediction: 0.7,
              tags: ["weather"],
              unlisted: false,
              sharedPublicly: true,
              apiKey: "your_api_key_here",
            },
            multichoiceExample: {
              title: "Which team will win the World Cup?",
              resolveBy: "2023-12-31T23:59:59Z",
              options: [
                { text: "Brazil", prediction: 0.3 },
                { text: "Germany", prediction: 0.25 },
                { text: "France", prediction: 0.2 },
                { text: "Other", prediction: 0.25 },
              ],
              tags: ["sports", "football"],
              unlisted: false,
              sharedPublicly: true,
              apiKey: "your_api_key_here",
            },
          },
        },
      },
    })
    .mutation(async ({ input, ctx }) => {
      let userId: string
      if (ctx.userId) {
        userId = ctx.userId
      } else if (input.apiKey) {
        const user = await getUserByApiKeyOrThrow(input.apiKey)
        userId = user.id
      } else {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in or provide a valid API key to create a question",
        })
      }

      let tags: Tag[] = []
      if (input.tags && input.tags.length > 0) {
        tags = await prisma.tag.findMany({
          where: {
            userId: userId,
          },
        })
      }

      const isMultiChoice = input.options && input.options.length > 0

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          user: { connect: { id: userId } },
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
                      userId: userId,
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
          options:
            isMultiChoice && input.options
              ? {
                  // Reverse the options array to work around Prisma bug
                  // https://github.com/prisma/prisma/issues/22090
                  create: [...input.options].reverse().map((option) => ({
                    text: option.text,
                    user: { connect: { id: userId } },
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
                  user: { connect: { id: userId } },
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
            user: { connect: { id: userId } },
            forecast: new Decimal(input.prediction),
          },
        })
      }

      await backendAnalyticsEvent("question_created", {
        platform: "web",
        user: userId,
      })

      // TODO: how do we want to handle analytics for MCQ forecasts?
      if (input.prediction) {
        await backendAnalyticsEvent("forecast_submitted", {
          platform: "web",
          user: userId,
          question: question.id,
          forecast: input.prediction,
        })
      }

      try {
        await syncToSlackIfNeeded(question, userId)
      } catch (error) {
        if (error instanceof Error && error.message.includes("is_archived")) {
          // If the error is due to an archived Slack channel, handle it gracefully
          return {
            url: getQuestionUrl(question),
            ...input,
            slackSyncError: "archived_channel",
          }
        }
        throw error
      }

      return { url: getQuestionUrl(question), ...input }
    }),

  resolveQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        resolution: z.string({
          description:
            "Resolve to YES, NO or AMBIGUOUS if it's a binary question and AMBIGUOUS, OTHER, or $OPTION if it's a multi-choice question. You can only resolve your own questions.",
        }),
        questionType: z.string(),
        apiKey: z.string().optional(),
        optionId: z.string().optional(),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/resolveQuestion",
        description:
          "Resolve to YES, NO or AMBIGUOUS if it's a binary question and AMBIGUOUS, OTHER, or $OPTION if it's a multi-choice question",
        example: {
          request: {
            questionId: "cm05iuuhx00066e7a1hncujn0",
            resolution: "YES",
            questionType: "BINARY",
            apiKey: "your_api_key_here",
          },
        },
      },
    })
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

      await handleQuestionResolution(
        input.questionId,
        input.resolution,
        input.questionType as QuestionType,
        input.optionId,
      )

      await backendAnalyticsEvent("question_resolved", {
        platform: input.apiKey ? "api" : "web",
        resolution: input.resolution.toLowerCase(),
      })

      return {
        message: `Question ${input.questionId} resolved to ${input.resolution}`,
      }
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
        path: "/v1/setSharedPublicly",
        description:
          "Change the visibility of the question. The 'sharedPublicly' parameter sets whether the question is accessible to anyone via a direct link. The 'unlisted' parameter sets whether the question is visible on fatebook.io/public",
      },
    })
    .output(z.object({ message: z.string() }))
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

      return {
        message: `Question ${input.questionId} updated; it is now ${input.sharedPublicly ? "shared publicly" : "not shared publicly"} and ${input.unlisted ? "unlisted" : "listed"}.`,
      }
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
        addEmails: z.array(z.string()),
        removeUsers: z.array(z.string()),
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

      const sharedWith = Array.from(
        new Set(
          [
            ...question.sharedWith.map((u) => u.email),
            ...input.addEmails,
          ].filter(
            (e) =>
              !question.sharedWith.some(
                (user) =>
                  input.removeUsers.includes(user.id) && user.email === e,
              ),
          ),
        ),
      )
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
        optionId: z
          .string()
          .optional()
          .describe(
            "The ID of the selected option for multiple-choice questions. Only required for multiple-choice questions.",
          ),
        apiKey: z.string().optional(),
      }),
    )
    .output(
      z
        .object({
          message: z.string(),
          forecast: ForecastSchema,
        })
        .optional(),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/addForecast",
        description:
          "Add a forecast to the question. Forecasts are between 0 and 1.",
        example: {
          request: {
            questionId: "cm05iuuhx00066e7a1hncujn0",
            forecast: 0.75,
            apiKey: "your_api_key_here",
          },
        },
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

      assertHasAccess(question, user)
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

      if (input.optionId && question.type !== "MULTIPLE_CHOICE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Option ID can only be supplied for multiple choice questions. This question is a ${question.type}`,
        })
      }
      if (!input.optionId && question.type === "MULTIPLE_CHOICE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Option ID must be supplied for multiple choice questions`,
        })
      }

      const lastForecastByUser = question.forecasts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // most recent first
        .find((f) => f.userId === user.id)

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
              id: user.id,
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
      for (const userToNotify of filterToUniqueIds([
        q.user,
        ...q.forecasts.map((f) => f.user),
        ...q.comments.map((c) => c.user),
        ...q.sharedWith,
        ...q.sharedWithLists.flatMap((l) => l.users),
      ]).filter((u) => u && u.id !== submittedForecast.user.id)) {
        const forecastsHidden = forecastsAreHidden(q, userToNotify.id)
        const userPredictedNStr = `${
          (!forecastsHidden && submittedForecast.user.name) || "Someone"
        } predicted${
          forecastsHidden
            ? ""
            : ` ${displayForecast(submittedForecast, 2, true)}`
        }`
        await createNotification({
          userId: userToNotify.id,
          title: `${userPredictedNStr} on "${q.title}"`,
          content: userPredictedNStr,
          tags: ["new_forecast", q.id],
          url: getQuestionUrl(q),
          questionId: q.id,
        })
      }

      await backendAnalyticsEvent("forecast_submitted", {
        platform: input.apiKey ? "api" : "web",
        user: user.id,
        question: question.id,
        forecast: input.forecast,
      })

      return {
        message: `Forecast ${input.forecast} successfully added to "${question.title}"`,
        forecast: {
          questionId: submittedForecast.questionId,
          forecast: submittedForecast.forecast,
          optionId: submittedForecast.optionId,
          id: submittedForecast.id,
          createdAt: submittedForecast.createdAt,
          comment: submittedForecast.comment,
          profileId: submittedForecast.profileId,
          userId: submittedForecast.userId,
        },
      }
    }),

  addComment: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        comment: z.string(),
        apiKey: z.string().optional(),
      }),
    )
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/v1/addComment",
        description: "Add a comment to the question.",
        example: {
          request: {
            questionId: "cm05iuuhx00066e7a1hncujn0",
            comment: "This is an interesting question!",
            apiKey: "your_api_key_here",
          },
        },
      },
    })
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
      assertHasAccess(question, user)
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
              id: user.id,
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
          content: `${newComment.user.name || "Someone"} commented:\n\n${
            newComment.comment
          }`,
          tags: ["new_comment", question.id],
          url: getQuestionUrl(question),
          questionId: question.id,
        })
      }

      await backendAnalyticsEvent("comment_added", {
        platform: input.apiKey ? "api" : "web",
        user: user.id,
      })

      return {
        message: `Comment "${input.comment}" successfully added to "${question.title}"`,
      }
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
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .meta({ openapi: { method: "DELETE", path: "/v1/deleteQuestion" } })
    .mutation(async ({ input, ctx }) => {
      await getQuestionAssertAuthor(ctx, input.questionId, input.apiKey)

      await deleteQuestion(input.questionId)

      await backendAnalyticsEvent("question_deleted", {
        platform: input.apiKey ? "api" : "web",
        user: ctx.userId,
      })

      return {
        message: `Question "${input.questionId}" successfully deleted`,
      }
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
    .output(
      z.object({
        message: z.string(),
        question: QuestionSchema,
      }),
    )
    .meta({ openapi: { method: "PATCH", path: "/v1/editQuestion" } })
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

      return {
        message: `Question "${input.questionId}" successfully edited`,
        question: question,
      }
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
