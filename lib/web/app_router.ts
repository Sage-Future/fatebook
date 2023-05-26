import { z } from 'zod'
import { sendEmailReadyToResolveNotification } from '../../pages/api/check_for_message_updates'
import prisma from '../_utils'
import { questionRouter } from './question_router'
import { publicProcedure, router } from './trpc_base'


export const appRouter = router({
  question: questionRouter,
  sendEmail: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("select")
      const question = await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          user: true,
        },
      })
      if (!question) {
        throw new Error('question not found')
      }
      console.log("send")
      await sendEmailReadyToResolveNotification(question)
      console.log("sent")
    }),
})

export type AppRouter = typeof appRouter;