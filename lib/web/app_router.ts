import { TRPCError } from "@trpc/server"
import { generateOpenApiDocument } from "trpc-openapi"
import { z } from "zod"
import { sendEmailReadyToResolveNotification } from "../../pages/api/check_for_message_updates"
import {
  backendAnalyticsEvent,
  getSlackPermalinkFromChannelAndTS,
} from "../_utils_server"
import prisma from "../prisma"
import { feedbackRouter } from "./feedback_router"
import { importRouter } from "./import_router"
import { questionRouter } from "./question_router"
import { tagsRouter } from "./tags_router"
import { tournamentRouter } from "./tournament_router"
import { getClientBaseUrl } from "./trpc"
import { publicProcedure, router } from "./trpc_base"
import { userListRouter } from "./userList_router"

export const appRouter = router({
  question: questionRouter,
  userList: userListRouter,
  tags: tagsRouter,
  import: importRouter,
  tournament: tournamentRouter,
  feedback: feedbackRouter,

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
        throw new Error("question not found")
      }
      await sendEmailReadyToResolveNotification(question)
    }),

  getSlackPermalink: publicProcedure
    .input(
      z
        .object({
          teamId: z.string(),
          channel: z.string(),
          ts: z.string(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (!input) {
        return null
      }
      return await getSlackPermalinkFromChannelAndTS(
        input.teamId,
        input.channel,
        input.ts,
      )
    }),

  unsubscribe: publicProcedure
    .input(
      z.object({
        userEmail: z.string(),
        setUnsubscribed: z.boolean(),
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
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      await prisma.user.update({
        where: {
          email: input.userEmail,
        },
        data: {
          unsubscribedFromEmailsAt: input.setUnsubscribed ? new Date() : null,
        },
      })

      await backendAnalyticsEvent(
        input.setUnsubscribed ? "email_unsubscribe" : "email_resubscribe",
        {
          platform: "web",
          email: input.userEmail,
        },
      )
    }),

  editName: publicProcedure
    .input(
      z.object({
        newName: z.string().optional(),
        newImage: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (
        (input.newName !== undefined && input.newName.length === 0) ||
        !ctx.userId
      ) {
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

  getApiKey: publicProcedure.query(async ({ ctx }) => {
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

  regenerateApiKey: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId) {
      return null
    }

    const newApiKey =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
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
        include: {
          notifications: true,
        },
      })

      return user
        ? {
            name: user.name || undefined,
            image: user.image || undefined,
            id: user.id,
          }
        : undefined
    }),

  getUserNotifications: publicProcedure
    .input(
      z.object({
        cursor: z.number(),
        limit: z.number().min(1).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        return null
      }

      const skip = input.cursor
      const limit = input.limit ?? 20
      const notifications = await prisma.notification.findMany({
        where: {
          userId: ctx.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1, // fetch an extra item to check for next page
        skip: skip,
        include: {
          question: {
            select: {
              title: true,
            },
          },
        },
      })

      return {
        items: notifications,
        nextCursor: notifications.length > limit ? skip + limit : undefined,
      }
    }),

  markNotificationRead: publicProcedure
    .input(
      z.object({
        notificationId: z.string().optional(),
        allNotifications: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        return
      }

      if (input.allNotifications) {
        await prisma.notification.updateMany({
          where: {
            userId: ctx.userId,
            read: false,
          },
          data: {
            read: true,
          },
        })
      } else if (input.notificationId) {
        await prisma.notification.update({
          where: {
            id: input.notificationId,
            userId: ctx.userId,
          },
          data: {
            read: true,
          },
        })
      }
    }),
})

export type AppRouter = typeof appRouter

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Fatebook OpenAPI",
  version: "1.0.0",
  baseUrl: getClientBaseUrl(false) + "/api",
})
