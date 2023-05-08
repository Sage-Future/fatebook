import { z } from "zod"
import prisma from "../_utils"
import { publicProcedure, router } from "./trpc_base"

export const questionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        resolveBy: z.date(),
        prediction: z.number().max(1).min(0),
        authorId: z.number(),
      })
    )
    .mutation(async ({input}) => {
      // todo check authorId = current user

      const HARDCODED_ADAM_PROFILE_ID = 12

      const question = await prisma.question.create({
        data: {
          ...input,
          authorId: HARDCODED_ADAM_PROFILE_ID, // TODO REMOVE HARDCODE
          forecasts: {
            create: {
              authorId: HARDCODED_ADAM_PROFILE_ID, // TODO REMOVE HARDCODE
              forecast: 0.5,
            }
          }
        },
      })
      return question
    }),
})