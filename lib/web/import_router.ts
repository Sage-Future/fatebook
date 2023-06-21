import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import prisma from '../_utils_server'
import { importFromPredictionBook } from './predictionbook'
import { publicProcedure, router } from './trpc_base'
import { getPredictionBookIdPrefix } from './utils'

export const importRouter = router({
  importFromPredictionBook: publicProcedure
    .input(
      z.object({
        predictionBookApiToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      await importFromPredictionBook(input.predictionBookApiToken, ctx.userId)
    }),

  deleteAllPredictionBookQuestions: publicProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const r = await prisma.question.deleteMany({
        where: {
          userId: ctx.userId,
          id: {
            startsWith: getPredictionBookIdPrefix(),
          }
        },
      })

      console.log(`Deleted ${r.count} questions`)
    }),
})