import { z } from "zod"
import prisma, { backendAnalyticsEvent } from "../_utils"
import { publicProcedure, router } from "./trpc_base"
import { handleQuestionResolution, undoQuestionResolution } from "../interactive_handlers/resolve"
import { Resolution } from "@prisma/client"

const HARDCODED_ADAM_PROFILE_ID = 12

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
      // todo check authorId = current user

      const question = await prisma.question.create({
        data: {
          title: input.title,
          resolveBy: input.resolveBy,
          userId: input.authorId,
          profileId: HARDCODED_ADAM_PROFILE_ID, // TODO REMOVE
          forecasts: input.prediction ? {
            create: {
              userId: input.authorId, // TODO REMOVE HARDCODE
              profileId: HARDCODED_ADAM_PROFILE_ID, // TODO REMOVE
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
    .query(async ({input}) => {
      if (!input.questionId) {
        return null
      }

      return await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          forecasts: {
            include: {
              profile: {
                include: {
                  user: true
                }
              }
            }
          },
          profile: {
            include: {
              user: true
            }
          }
        }
      })
    }),

  getQuestionsUserCreatedOrForecastedOn: publicProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(async ({input}) => {
      if (!input.userId) {
        return null
      }

      return await prisma.question.findMany({
        where: {
          OR: [
            {userId: input.userId},
            {forecasts: {
              some: {
                userId: input.userId,
              }
            }}
          ]
        },
        include: {
          forecasts: {
            include: {
              profile: {
                include: {
                  user: true
                }
              }
            }
          },
          user: true,
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
    .mutation(async ({input}) => {
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        }
      })

      if (!question) {
        throw new Error('question not found')
      }
      // TODO CHECK IF USER ID MATCHES AUTHOR ID

      await handleQuestionResolution(question.id, input.resolution as Resolution)

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
    .mutation(async ({input}) => {
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        }
      })

      if (!question) {
        throw new Error('question not found')
      }
      // TODO CHECK IF USER ID MATCHES AUTHOR ID

      await undoQuestionResolution(question.id)
    }),
})