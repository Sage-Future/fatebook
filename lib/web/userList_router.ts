import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import prisma from '../_utils_server'
import { emailNewlySharedWithUsers, getQuestionAssertAuthor } from './question_router'
import { publicProcedure, router } from './trpc_base'

export const userListRouter = router({
  getUserLists: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        return null
      }

      return await prisma.userList.findMany({
        where: {
          OR: [
            {authorId: ctx.userId},
            {users: {
              some: {
                id: ctx.userId,
              }
            }}
          ]
        },
        include: {
          author: true,
          users: true,
        }
      })
    }),

  createList: publicProcedure
    .input(
      z.object({
        name: z.string(),
        userEmails: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({input, ctx}) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to create a list" })
      }

      const userList = await prisma.userList.create({
        data: {
          name: input.name,
          author: {
            connect: {
              id: ctx.userId
            }
          },
          users: {
            connect: input.userEmails?.map(email => ({ email }))
          }
        },
        include: {
          users: true,
        }
      })

      return userList
    }),

  updateList: publicProcedure
    .input(
      z.object({
        listId: z.string(),
        name: z.string().optional(),
        userEmails: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({input, ctx}) => {
      const oldList = await prisma.userList.findUnique({
        where: {
          id: input.listId,
        }
      })
      if (!oldList || !ctx.userId || oldList.authorId !== ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "" })
      }

      await prisma.userList.update({
        where: {
          id: input.listId,
        },
        data: {
          name: input?.name,
          users: {
            set: input.userEmails?.map(email => ({ email }))
          }
        }
      })
    }),

  deleteList: publicProcedure
    .input(
      z.object({
        listId: z.string(),
      })
    )
    .mutation(async ({input, ctx}) => {
      const oldList = await prisma.userList.findUnique({
        where: {
          id: input.listId,
        }
      })
      if (!oldList || !ctx.userId || oldList.authorId !== ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "" })
      }

      await prisma.userList.delete({
        where: {
          id: input.listId,
        },
      })
    }),

  setQuestionLists: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        listIds: z.array(z.string()),
      })
    )
    .mutation(async ({input, ctx}) => {
      await getQuestionAssertAuthor(ctx, input.questionId)

      const oldLists = (await prisma.question.findUnique({
        where: {
          id: input.questionId,
        },
        include: {
          sharedWithLists: true,
        }
      }))?.sharedWithLists

      const question = await prisma.question.update({
        where: {
          id: input.questionId,
        },
        data: {
          sharedWithLists: {
            set: input.listIds.map(id => ({ id }))
          },
        },
        include: {
          user: {
            include: {
              profiles: true,
            }
          },
          sharedWithLists: {
            include: {
              users: true,
            }
          },
          sharedWith: true,
        }
      })

      // email only people newly shared with
      // todo - could track everyone we've emailed and only email new people
      const newListIds = input.listIds.filter(id => !(oldLists?.map(l => l.id) || []).includes(id))
      const newUsersSharedWith = Array.from(new Set(question.sharedWithLists
        .filter(l => newListIds.includes(l.id))
        .flatMap(l => l.users)
        .filter(u => u.id !== ctx.userId
          && !(question.sharedWith?.map(u => u.id) || []).includes(u.id)
        )
        .map(u => u.email)
      ))

      await emailNewlySharedWithUsers(newUsersSharedWith, question)
    }),
})