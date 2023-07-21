import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import prisma, { backendAnalyticsEvent } from '../_utils_server'
import { publicProcedure, router } from './trpc_base'

export const tagsRouter = router({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        return null
      }

      return await prisma.tag.findMany({
        where: {
          userId: ctx.userId,
        },
      })
    }),

  getByName: publicProcedure
    .input(
      z.object({
        tagName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        return null
      }

      const tags = await prisma.tag.findMany({
        where: {
          name: input.tagName,
          userId: ctx.userId,
        },
      })

      if (tags.length === 0) {
        return null
      }

      return tags[0]
    }),

  setQuestionTags: publicProcedure
    .input(
      z.object({
        tags: z.string().array(),
        questionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to add a tag" })
      }

      await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          tags: {
            set: [],
            connectOrCreate: input.tags.map((name) => ({
              where: {
                name,
              },
              create: {
                name,
                user: {
                  connect: {
                    id: ctx.userId,
                  },
                },
              },
            })),
          },
        }
      })

      // delete any now unused tags
      await prisma.tag.deleteMany({
        where: {
          userId: ctx.userId,
          questions: {
            none: {},
          },
        },
      })

      await backendAnalyticsEvent("set_tags", {
        user: ctx.userId,
        platform: "web",
      })
    }),
})