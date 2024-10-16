import prisma from "../../prisma"
import { Context } from "../trpc_base"
import { TRPCError } from "@trpc/server"

export async function getUserByApiKeyOrThrow(apiKey: string) {
  const user = await prisma.user.findFirst({
    where: {
      apiKey,
    },
  })
  if (user) {
    return user
  }
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message:
      "Could not find a user with that API key. See fatebook.io/api-setup",
  })
}

export async function getUserFromCtxOrApiKeyOrThrow(
  ctx: Context,
  apiKey: string | undefined,
) {
  if (ctx.userId) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId || "NO MATCH" },
    })
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Could not find a user with that ID",
      })
    }
    return user
  }

  if (!apiKey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must provide an API key. See fatebook.io/api-setup",
    })
  }

  return await getUserByApiKeyOrThrow(apiKey)
}
