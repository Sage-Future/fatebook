import { z } from 'zod'
import { questionRouter } from './question_router'
import { publicProcedure, router } from './trpc_base'


export const appRouter = router({
  question: questionRouter,
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      }
    }),
})

export type AppRouter = typeof appRouter;