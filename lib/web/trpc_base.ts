import { inferAsyncReturnType, initTRPC } from "@trpc/server"
import { CreateNextContextOptions } from "@trpc/server/adapters/next"
import { getServerSession } from "next-auth"
import superjson from "superjson"
import { authOptions } from "../../pages/api/auth/[...nextauth]"


export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions)

  console.log("session", {session})

  return {
    session,
    userId: session?.user?.id,
  }
}

type Context = inferAsyncReturnType<typeof createContext>
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure