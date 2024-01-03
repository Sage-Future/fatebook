import { inferAsyncReturnType, initTRPC } from "@trpc/server"
import { CreateNextContextOptions } from "@trpc/server/adapters/next"
import { getServerSession } from "next-auth"
import transformer from "trpc-transformer"
import { authOptions } from "../../pages/api/auth/[...nextauth]"

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions)

  return {
    session,
    userId: session?.user?.id,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
const t = initTRPC.context<Context>().create({
  transformer,
})

export const router = t.router
export const publicProcedure = t.procedure
