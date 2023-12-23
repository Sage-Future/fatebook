import { TRPCError } from "@trpc/server"
import { z } from "zod"
import prisma from "../_utils_server"
import { syncToSlackIfNeeded } from "../interactive_handlers/postFromWeb"
import { scrubApiKeyPropertyRecursive } from './question_router'
import { publicProcedure, router } from "./trpc_base"
import { matchesAnEmailDomain } from "./utils"

export const tournamentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        predictYourYear: z.number().optional(),
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
          predictYourYear: input?.predictYourYear || undefined,
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
          anyoneInListCanEdit: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to update a tournament" })
      }
      const oldTournament = await prisma.tournament.findUnique({
        where: {
          id: input.tournament.id,
        },
        include: {
          userList: {
            include: {
              users: true,
            }
          },
          questions: {
            include: {
              tournaments: true,
              sharedWithLists: true,
            }
          },
        }
      })
      if (!oldTournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" })
      }
      if (
        oldTournament.authorId !== ctx.userId
        && !(oldTournament.anyoneInListCanEdit && oldTournament.userList?.users.find(u => u.id === ctx.userId))
      ) {
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
          anyoneInListCanEdit: input.tournament.anyoneInListCanEdit,
          questions: input.tournament.questions ? {
            set: input.tournament.questions.map(q => ({ id: q }))
          } : undefined,
        },
        include: {
          questions: {
            include: {
              tournaments: true,
              sharedWithLists: true,
            }
          },
        }
      })

      if (input.tournament.questions !== undefined) {
        for (const question of updatedTournament.questions) {
          await syncToSlackIfNeeded(question, ctx.userId)
        }
        for (const question of oldTournament.questions) {
          await syncToSlackIfNeeded(question, ctx.userId, [oldTournament])
        }
      }


      return updatedTournament
    }),

  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
        createIfNotExists: z.object({
          name: z.string().optional(),
        }).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.userId || "NO MATCH" } })

      const includes = {
        author: true,
        questions: {
          where: {
            OR: [
              {sharedPublicly: true},
              {userId: ctx.userId || "NO MATCH"},
              {sharedWith: {some: {id: ctx.userId || "NO MATCH"}}},
              { sharedWithLists: { some: { OR: [
                { authorId: ctx.userId || "NO MATCH" },
                { users: { some: { id: ctx.userId || "NO MATCH" } } },
                matchesAnEmailDomain(user),
              ], } } },
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
            sharedWithLists: true,
          },
        },
        userList: {
          include: {
            users: true,
          }
        }
      }
      let tournament = await prisma.tournament.findUnique({
        where: {
          id: input.id,
        },
        include: includes,
      })
      if (!tournament && input.createIfNotExists) {
        if (!ctx.userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to create a tournament" })
        }
        tournament = await prisma.tournament.create({
          data: {
            id: input?.id || undefined,
            name: input?.createIfNotExists.name || "New tournament",
            authorId: ctx.userId,
          },
          include: includes,
        })
      }
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
    .input(
      z.object({
        includePublic: z.boolean().optional(),
        onlyIncludePredictYourYear: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !input?.onlyIncludePredictYourYear) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view tournaments" })
      }
      const user = await prisma.user.findUnique({ where: { id: ctx.userId || "NO MATCH" } })
      const tournaments = await prisma.tournament.findMany({
        where: {
          AND: [
            {OR: [
              {authorId: ctx.userId},
              {userList: {OR: [
                {users: {some: {id: ctx.userId}}},
                {...matchesAnEmailDomain(user)},
                {authorId: ctx.userId},
              ]}},
            ]},
              (input?.includePublic ? { sharedPublicly: true, unlisted: false } : {}),
              (input?.onlyIncludePredictYourYear ? { predictYourYear: { gt: 0 } } : {}),
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


