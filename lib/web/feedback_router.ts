import SlackNotify from "slack-notify"
import { z } from "zod"
import prisma from "../prisma"
import { publicProcedure, router } from "./trpc_base"

export const feedbackRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        type: z.string(),
        message: z.string(),
        email: z.string().email().optional(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { type, message, email } = input

      let user = null
      if (ctx.userId) {
        user = await prisma.user.findUnique({
          where: { id: ctx.userId },
        })
      }

      await prisma.feedback.create({
        data: {
          type,
          message,
          email: user ? user.email : email,
          userId: user ? user.id : null,
        },
      })

      if (!process.env.SAGE_SLACK_WEBHOOK_URL) {
        console.error("Set SAGE_SLACK_WEBHOOK_URL")
        return
      }
      await SlackNotify(process.env.SAGE_SLACK_WEBHOOK_URL).send({
        text: `*${type}*\n${message}\n${(user ? user.email : email) || ""}`,
        unfurl_links: 0,
      })
    }),
})
