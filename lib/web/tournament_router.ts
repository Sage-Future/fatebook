import { TRPCError } from "@trpc/server"
import { z } from "zod"
import prisma from "../_utils_server"
import { scrubApiKeyPropertyRecursive } from './question_router'
import { publicProcedure, router } from "./trpc_base"

export const tournamentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }).optional()
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to create a tournament" })
      }
      const newTournament = await prisma.tournament.create({
        data: {
          id: input?.id || undefined,
          name: input?.name || "New tournament",
          authorId: ctx.userId,
        },
      })
      return newTournament
    }),

  update: publicProcedure
    .input(
      z.object({
        tournament: z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional().nullable(),
          sharedPublicly: z.boolean().optional(),
          unlisted: z.boolean().optional(),
          userListId: z.string().optional().nullable(),
          showLeaderboard: z.boolean().optional(),
          questions: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to update a tournament" })
      }
      const tournament = await prisma.tournament.findUnique({
        where: {
          id: input.tournament.id,
        },
      })
      if (!tournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" })
      }
      if (tournament.authorId !== ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not the author of this tournament" })
      }

      const updatedTournament = await prisma.tournament.update({
        where: {
          id: input.tournament.id,
        },
        data: {
          name: input.tournament.name,
          description: input.tournament.description,
          sharedPublicly: input.tournament.sharedPublicly,
          unlisted: input.tournament.unlisted,
          userListId: input.tournament.userListId,
          showLeaderboard: input.tournament.showLeaderboard,
          questions: input.tournament.questions ? {
            set: input.tournament.questions.map(q => ({ id: q }))
          } : undefined,
        },
      })

      return updatedTournament
    }),

  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const tournament = await prisma.tournament.findUnique({
        where: {
          id: input.id,
        },
        include: {
          author: true,
          questions: {
            where: {
              OR: [
                {sharedPublicly: true},
                {userId: ctx.userId || "NO MATCH"},
                {sharedWith: {some: {id: ctx.userId || "NO MATCH"}}},
                {sharedWithLists: {some: {users: {some: {id: ctx.userId || "NO MATCH"}}}}},
              ]
            },
            include: {
              questionScores: {
                include: {
                  user: true,
                },
              },
              forecasts: {
                include: {
                  user: true,
                }
              },
            },
          },
          userList: {
            include: {
              users: true,
            }
          }
        },
      })
      if (!tournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" })
      }
      if (!tournament.sharedPublicly && (
        !ctx.userId || (
          ctx.userId !== tournament.authorId
          && !tournament.userList?.users.find(u => u.id === ctx.userId)
        )
      )) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You don't have access to this tournament" })
      }
      return scrubApiKeyPropertyRecursive(tournament)
    }),

  getAll: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view tournaments" })
      }
      const tournaments = await prisma.tournament.findMany({
        where: {
          OR: [
            {authorId: ctx.userId},
            {userList: {users: {some: {id: ctx.userId}}}}
          ]
        },
      })
      return tournaments
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to delete a tournament" })
      }
      const tournament = await prisma.tournament.findUnique({
        where: {
          id: input.id,
        },
      })
      if (!tournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" })
      }
      if (tournament.authorId !== ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not the author of this tournament" })
      }

      await prisma.tournament.delete({
        where: {
          id: input.id,
        },
      })
    }),
})


