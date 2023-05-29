import { Prisma, Resolution } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import prisma, { backendAnalyticsEvent } from "../_utils"
import { handleQuestionResolution, undoQuestionResolution } from "../interactive_handlers/resolve"
import { publicProcedure, router } from "./trpc_base"

export const questionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        resolveBy: z.date(),
        prediction: z.number().max(1).min(0).optional(),
        authorId: z.number(),
      })
    )
    .mutation(async ({input}) => {

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          userId: input.authorId,
          forecasts: input.prediction ? {
            create: {
              userId: input.authorId,
              forecast: input.prediction,
            }
          } : undefined,
        },
      })

      console.log("questioncreated", {question})
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

      if (!question) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
      }

      if (
        question?.sharedPublicly
        || question?.userId === ctx.userId
        || question?.forecasts.some(f => f.userId === ctx.userId)
      ) {
        return question
      } else {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You don't have access to that question" })
      }
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