import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { sendEmailReadyToResolveNotification } from '../../pages/api/check_for_message_updates'
import prisma, { backendAnalyticsEvent, getSlackPermalinkFromChannelAndTS } from '../_utils_server'
import { importRouter } from './import_router'
import { questionRouter } from './question_router'
import { tagsRouter } from './tags_router'
import { publicProcedure, router } from './trpc_base'
import { userListRouter } from './userList_router'
import { tournamentRouter } from './tournament_router'


export const appRouter = router({
  question: questionRouter,
  userList: userListRouter,
  tags: tagsRouter,
  import: importRouter,
  tournament: tournamentRouter,

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

  unsubscribe: publicProcedure
    .input(
      z.object({
        userEmail: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: {
          email: input.userEmail,
        },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      await prisma.user.update({
        where: {
          email: input.userEmail,
        },
        data: {
          unsubscribedFromEmailsAt: new Date(),
        },
      })

      await backendAnalyticsEvent('email_unsubscribe', {
        platform: 'web',
        email: input.userEmail,
      })
    }),

  editName: publicProcedure
    .input(
      z.object({
        newName: z.string().optional(),
        newImage: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if ((input.newName !== undefined && input.newName.length === 0) || !ctx.userId) {
        return
      }

      await prisma.user.update({
        where: {
          id: ctx.userId,
        },
        data: {
          name: input.newName,
          image: input.newImage,
        },
      })
    }),

  getApiKey: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          id: ctx.userId,
        },
      })

      return user?.apiKey
    }),

  regenerateApiKey: publicProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        return null
      }

      const newApiKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      await prisma.user.update({
        where: {
          id: ctx.userId,
        },
        data: {
          apiKey: newApiKey,
        },
      })

      return newApiKey
    }),

  getUserInfo: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.userId) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
      })

      return user ? {
        name: user.name || undefined,
        image: user.image || undefined,
        id: user.id,
      } :  undefined
    }),
})

export type AppRouter = typeof appRouter