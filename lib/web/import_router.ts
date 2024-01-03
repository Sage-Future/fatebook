import { Resolution } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { getDateTimeYYYYMMDDHHMMSS } from "../_utils_common"
import prisma, { backendAnalyticsEvent } from "../_utils_server"
import { importFromPredictionBook } from "./predictionbook"
import { publicProcedure, router } from "./trpc_base"
import { getCsvIdPrefix, getPredictionBookIdPrefix, hashString } from "./utils"

export const importRouter = router({
  importFromPredictionBook: publicProcedure
    .input(
      z.object({
        predictionBookApiToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      await importFromPredictionBook(input.predictionBookApiToken, ctx.userId)

      await backendAnalyticsEvent("import_from_prediction_book", {
        user: ctx.userId,
        platform: "web",
      })
    }),

  deleteAllPredictionBookQuestions: publicProcedure.mutation(
    async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      const r = await prisma.question.deleteMany({
        where: {
          userId: ctx.userId,
          id: {
            startsWith: getPredictionBookIdPrefix(),
          },
        },
      })

      console.log(`Deleted ${r.count} questions`)

      await backendAnalyticsEvent("delete_prediction_book_imports", {
        user: ctx.userId,
        platform: "web",
      })
    },
  ),

  importFromCsv: publicProcedure
    .input(
      z.array(
        z.object({
          questionTitle: z.string(),
          forecast: z.string(),
          qCreatedAt: z.string(),
          resolution: z.string(),
          resolvedAt: z.string().optional(),
          resolveBy: z.string().optional(),
          fCreatedAt: z.string().optional(),
          tags: z.string().optional(),
          notes: z.string().optional(),
          notesExtra: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const rows = input
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      let errs = [] as { error: any; row: any }[]

      for (const row of rows) {
        try {
          const creationDatePlus24h = new Date(
            new Date(row.qCreatedAt).getTime() + 24 * 60 * 60 * 1000,
          )

          const parts = {
            id: `${getCsvIdPrefix()}_${ctx.userId}_${hashString(
              row.questionTitle + row.qCreatedAt.toString(),
            ).toString()}`,
            title: row.questionTitle,
            createdAt: new Date(row.qCreatedAt),
            resolved: row.resolution !== null,
            resolution: row.resolution
              ? row.resolution.toLowerCase().trim() === "yes"
                ? Resolution.YES
                : row.resolution.toLowerCase().trim() === "no"
                  ? Resolution.NO
                  : Resolution.AMBIGUOUS
              : null,
            resolveBy: row.resolveBy
              ? new Date(row.resolveBy)
              : creationDatePlus24h,
            resolvedAt: row.resolution
              ? row.resolvedAt?.trim()
                ? new Date(row.resolvedAt)
                : creationDatePlus24h
              : null,
            notes: `${row.notes || ""}${
              row.notesExtra || ""
            } Imported from your spreadsheet on ${getDateTimeYYYYMMDDHHMMSS(
              new Date(),
            )}.`,
          }
          const forecastParts = {
            forecast: parseFloat(row.forecast.replace("%", "").trim()) / 100,
            createdAt: new Date(row.fCreatedAt || row.qCreatedAt),
            userId: ctx.userId,
          }
          const tagParts = row.tags
            ?.split(",")
            .filter((tag) => !!tag && tag.trim().length > 0)
            .map((name) => ({
              where: {
                name_userId: {
                  name: name.trim(),
                  userId: ctx.userId || "",
                },
              },
              create: {
                name: name.trim(),
                user: {
                  connect: {
                    id: ctx.userId,
                  },
                },
              },
            }))
          await prisma.question.upsert({
            where: {
              id: parts.id,
            },
            create: {
              ...parts,
              user: {
                connect: {
                  id: ctx.userId,
                },
              },
              forecasts: {
                create: forecastParts,
              },
              tags: {
                connectOrCreate: tagParts,
              },
            },
            update: {
              ...parts,
              forecasts: {
                create: forecastParts,
              },
              tags: {
                connectOrCreate: tagParts,
              },
            },
          })
        } catch (e) {
          errs.push({ error: e, row })
        }
      }

      if (errs.length > 0) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message:
            `We couldn't import ${errs.length} of your rows.\n` +
            errs
              .map(
                (err) =>
                  `Row with title ${err.row.questionTitle}\n${
                    err.error
                  }\n${JSON.stringify(err.row, null, 2)}`,
              )
              .join("\n\n"),
        })
      }

      await backendAnalyticsEvent("import_from_csv", {
        user: ctx.userId,
        platform: "web",
      })
    }),

  deleteAllCsvQuestions: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    const r = await prisma.question.deleteMany({
      where: {
        userId: ctx.userId,
        id: {
          startsWith: getCsvIdPrefix(),
        },
      },
    })

    console.log(`Deleted ${r.count} questions`)

    await backendAnalyticsEvent("delete_csv_imports", {
      user: ctx.userId,
      platform: "web",
    })
  }),
})
