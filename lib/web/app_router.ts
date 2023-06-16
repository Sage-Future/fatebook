import { z } from 'zod'
import { sendEmailReadyToResolveNotification } from '../../pages/api/check_for_message_updates'
import prisma, { getSlackPermalinkFromChannelAndTS } from '../_utils_server'
import { questionRouter } from './question_router'
import { publicProcedure, router } from './trpc_base'
import { userListRouter } from './userList_router'


export const appRouter = router({
  question: questionRouter,

  userList: userListRouter,

  sendEmail: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
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
      await sendEmailReadyToResolveNotification(question)
    }),

  getSlackPermalink: publicProcedure
    .input(
      z.object({
        teamId: z.string(),
        channel: z.string(),
        ts: z.string(),
      }).optional(),
    )
    .query(async ({ input }) => {
      if (!input) { return null }
      return await getSlackPermalinkFromChannelAndTS(input.teamId, input.channel, input.ts)
    }),
})

export type AppRouter = typeof appRouter