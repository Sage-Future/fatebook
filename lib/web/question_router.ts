import { Prisma, Resolution } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { QuestionWithForecasts } from "../../prisma/additional"
import prisma, { backendAnalyticsEvent, updateForecastQuestionMessages } from "../_utils"
import { handleQuestionResolution, undoQuestionResolution } from "../interactive_handlers/resolve"
import { publicProcedure, router } from "./trpc_base"

export const questionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        resolveBy: z.date(),
        prediction: z.number().max(1).min(0).optional(),
      })
    )
    .mutation(async ({input, ctx}) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to create a question" })
      }

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          userId: ctx.userId,
          forecasts: input.prediction ? {
            create: {
              userId: ctx.userId,
              forecast: input.prediction,
            }
          } : undefined,
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

      return question
    }),

  getQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.number().optional(),
      })
    )
    .query(async ({input, ctx}) => {
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
            }
          },
          user: true,
          sharedWith: true,
          questionMessages: true,
        }
      })
      assertHasAccess(ctx, question)
      return question
    }),

  getQuestionsUserCreatedOrForecastedOn: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        console.log({ctx})
        return null
      }

      return await prisma.question.findMany({
        where: {
          OR: [
            {userId: ctx.userId},
            {forecasts: {
              some: {
                userId: ctx.userId,
              }
            }}
          ]
        },
        include: {
          forecasts: {
            include: {
              user: true,
            }
          },
          user: true,
          sharedWith: true,
          questionMessages: true,
        }
      })
    }),

  resolveQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        resolution: z.string(),
      })
    )
    .mutation(async ({input, ctx}) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await handleQuestionResolution(input.questionId, input.resolution as Resolution)

      await backendAnalyticsEvent("question_resolved", {
        platform: "web",
        resolution: input.resolution.toLowerCase(),
      })
    }),

  undoResolution: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
      })
    )
    .mutation(async ({input, ctx}) => {
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
        questionId: z.number(),
        sharedPublicly: z.boolean(),
      })
    )
    .mutation(async ({input, ctx}) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          sharedPublicly: input.sharedPublicly,
        }
      })
    }),

  addForecast: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        forecast: z.number().max(1).min(0),
      })
    )
    .mutation(async ({input, ctx}) => {
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          forecasts: true
        }
      })

      assertHasAccess(ctx, question)
      if (question === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
      }

      if (question.resolution) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Question has already been resolved" })
      }

      const submittedForecast = await prisma.forecast.create({
        data: {
          user: {
            connect: {
              id: question.userId
            }
          },
          question: {
            connect: {
              id: input.questionId
            }
          },
          forecast: input.forecast,
        },
        include: {
          question: {
            include: {
              forecasts: {
                include: {
                  user: {
                    include: {
                      profiles: true
                    }
                  },
                }
              },
              questionMessages: {
                include: {
                  message: true
                }
              },
              user: {
                include: {
                  profiles: true
                }
              }
            }
          }
        }
      })

      await updateForecastQuestionMessages(submittedForecast.question, "New forecast")

      await backendAnalyticsEvent("forecast_submitted", {
        platform: "web",
        user: ctx.userId,
        question: question.id,
        forecast: input.forecast,
      })
    }),
})

async function getQuestionAssertAuthor(ctx: {userId: number | undefined}, questionId: number, questionInclude?: Prisma.QuestionInclude) {
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: questionInclude
  })

  if (!question) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }
  if (question.userId !== ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only the question's author can do that" })
  }

  return question
}

function assertHasAccess(ctx: {userId: number | undefined}, question: QuestionWithForecasts | null) {
  if (question === null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }
  if (
    question?.sharedPublicly
    || question?.userId === ctx.userId
    || question?.forecasts.some(f => f.userId === ctx.userId) // for slack questions
  ) {
    return question as QuestionWithForecasts
  } else {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You don't have access to that question" })
  }
}