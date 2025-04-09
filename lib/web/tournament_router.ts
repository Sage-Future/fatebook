import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { forecastsAreHidden } from "../_utils_common"
import { syncToSlackIfNeeded } from "../interactive_handlers/postFromWeb"
import prisma from "../prisma"
import { jsonToCsv } from "./export"
import { scrubApiKeyPropertyRecursive } from "./question_router"
import { publicProcedure, router } from "./trpc_base"
import { matchesAnEmailDomain } from "./utils"

export const tournamentRouter = router({
  create: publicProcedure
    .input(
      z
        .object({
          id: z.string(),
          name: z.string(),
          predictYourYear: z.number().optional(),
        })
        .optional(),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a tournament",
        })
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
          currentQuestions: z.array(z.string()),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update a tournament",
        })
      }

      return await prisma.$transaction(async (tx) => {
        const oldTournament = await tx.tournament.findUnique({
          where: {
            id: input.tournament.id,
          },
          include: {
            userList: {
              include: {
                users: true,
              },
            },
            questions: {
              include: {
                tournaments: true,
                sharedWithLists: true,
              },
            },
          },
        })

        if (!oldTournament) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tournament not found",
          })
        }

        const currentQuestionIds = oldTournament.questions
          .map((q) => q.id)
          .sort()
        const clientQuestionIds = input.tournament.currentQuestions.sort()

        if (
          JSON.stringify(currentQuestionIds) !==
          JSON.stringify(clientQuestionIds)
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Tournament questions have been modified. Please refresh and try again.",
          })
        }

        if (
          oldTournament.authorId !== ctx.userId &&
          !(
            oldTournament.anyoneInListCanEdit &&
            oldTournament.userList?.users.find((u) => u.id === ctx.userId)
          )
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to edit this tournament",
          })
        }

        const updatedTournament = await tx.tournament.update({
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
            questions: input.tournament.questions
              ? {
                  set: input.tournament.questions.map((q) => ({ id: q })),
                }
              : undefined,
          },
          include: {
            questions: {
              include: {
                tournaments: true,
                sharedWithLists: true,
              },
            },
          },
        })

        if (input.tournament.questions !== undefined) {
          await Promise.all([
            ...updatedTournament.questions.map((q) =>
              syncToSlackIfNeeded(q, ctx.userId),
            ),
            ...oldTournament.questions.map((q) =>
              syncToSlackIfNeeded(q, ctx.userId, [oldTournament]),
            ),
          ])
        }

        return updatedTournament
      })
    }),

  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
        createIfNotExists: z
          .object({
            name: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId || "NO MATCH" },
      })

      const includes = {
        author: true,
        questions: {
          where: {
            OR: [
              { sharedPublicly: true },
              { userId: ctx.userId || "NO MATCH" },
              { sharedWith: { some: { id: ctx.userId || "NO MATCH" } } },
              {
                sharedWithLists: {
                  some: {
                    OR: [
                      { authorId: ctx.userId || "NO MATCH" },
                      { users: { some: { id: ctx.userId || "NO MATCH" } } },
                      matchesAnEmailDomain(user),
                    ],
                  },
                },
              },
            ],
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
              },
            },
            sharedWithLists: true,
          },
        },
        userList: {
          include: {
            users: true,
          },
        },
      }
      let tournament = await prisma.tournament.findUnique({
        where: {
          id: input.id,
        },
        include: includes,
      })
      if (!tournament && input.createIfNotExists) {
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to create a tournament",
          })
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        })
      }
      if (
        !tournament.sharedPublicly &&
        (!ctx.userId ||
          (ctx.userId !== tournament.authorId &&
            !tournament.userList?.users.find((u) => u.id === ctx.userId)))
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have access to this tournament",
        })
      }
      return scrubApiKeyPropertyRecursive(tournament)
    }),

  getAll: publicProcedure
    .input(
      z
        .object({
          includePublic: z.boolean().optional(),
          predictYourYear: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !input?.predictYourYear) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view tournaments",
        })
      }
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId || "NO MATCH" },
      })
      const tournaments = await prisma.tournament.findMany({
        where: {
          AND: [
            input?.includePublic
              ? { sharedPublicly: true, unlisted: false }
              : {
                  OR: [
                    { authorId: ctx.userId },
                    {
                      userList: {
                        OR: [
                          { users: { some: { id: ctx.userId } } },
                          { ...matchesAnEmailDomain(user) },
                          { authorId: ctx.userId },
                        ],
                      },
                    },
                  ],
                },
            input?.predictYourYear
              ? {
                  predictYourYear: {
                    equals: input.predictYourYear,
                  },
                }
              : {},
          ],
        },
        include: {
          author: true,
          questions: {
            select: {
              _count: {
                select: {
                  forecasts: true,
                },
              },
            },
          },
        },
      })
      return tournaments
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete a tournament",
        })
      }
      const tournament = await prisma.tournament.findUnique({
        where: {
          id: input.id,
        },
      })
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        })
      }
      if (tournament.authorId !== ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the author of this tournament",
        })
      }

      await prisma.tournament.delete({
        where: {
          id: input.id,
        },
      })
    }),

  exportToCsv: publicProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to export tournament data",
        })
      }

      const tournament = await prisma.tournament.findUnique({
        where: {
          id: input.tournamentId,
        },
        include: {
          questions: {
            include: {
              forecasts: {
                include: {
                  user: true,
                },
              },
              user: true,
              options: true,
            },
          },
          userList: {
            include: {
              users: true,
            },
          },
        },
      })

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        })
      }

      // Check if user is admin
      if (
        tournament.authorId !== ctx.userId &&
        !(
          tournament.anyoneInListCanEdit &&
          tournament.userList?.users.find((u) => u.id === ctx.userId)
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to export this tournament",
        })
      }

      // Get all forecasts from all questions in the tournament
      const forecasts = tournament.questions.flatMap((q) => {
        // Filter out forecasts from questions where forecasts are hidden
        if (forecastsAreHidden(q, ctx.userId)) {
          return []
        }
        return q.forecasts
      })

      if (!forecasts || forecasts.length === 0) return ""

      const csv = jsonToCsv(
        forecasts.map((f) => {
          const question = tournament.questions.find(
            (q) => q.id === f.questionId,
          )
          const mcqOption = question?.options?.find((o) => o.id === f.optionId)

          return {
            "Tournament name": tournament.name,
            "Question title": question?.title,
            "Multiple choice option": mcqOption?.text,
            "Forecast created by": f.user?.name,
            "Forecast (scale = 0-1)": f.forecast,
            "Forecast created at": f.createdAt,
            "Question created by": question?.user?.name,
            "Question created at": question?.createdAt,
            "Question resolve by": question?.resolveBy,
            Resolution: mcqOption?.resolution || question?.resolution,
            "Resolved at": mcqOption?.resolvedAt || question?.resolvedAt,
            "Question notes": question?.notes,
          }
        }),
      )

      return csv
    }),
})
