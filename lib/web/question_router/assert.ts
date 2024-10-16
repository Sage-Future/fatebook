import { Prisma, User } from "@prisma/client"
import prisma from "../../prisma"
import { TRPCError } from "@trpc/server"
import {
  QuestionWithForecasts,
  QuestionWithForecastsAndSharedWithAndLists,
} from "../../../prisma/additional"
import { getUserByApiKeyOrThrow } from "./get_user"

export async function getQuestionAssertAuthor(
  ctx: { userId: string | undefined },
  questionId: string,
  apiKey?: string,
  questionInclude?: Prisma.QuestionInclude,
) {
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: questionInclude,
  })

  const userId = ctx?.userId || (await getUserByApiKeyOrThrow(apiKey || "")).id

  if (!question) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }
  if (question.userId !== userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only the question's author can do that",
    })
  }

  return question
}

export function assertHasAccess(
  question: QuestionWithForecastsAndSharedWithAndLists | null,
  user: User | null,
) {
  if (question === null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" })
  }

  const userId = user?.id || "NO MATCH"

  if (
    question.sharedPublicly ||
    question.sharedWith.some((u) => u.id === userId) ||
    question.sharedWithLists.some(
      (l) =>
        l.users.some((u) => u.id === userId) ||
        l.authorId === userId ||
        l.emailDomains.some((ed) => user && user.email.endsWith(ed)),
    ) ||
    question.userId === userId ||
    question.forecasts.some((f) => f.userId === userId) // for slack questions
  ) {
    return question as QuestionWithForecasts
  } else {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You don't have access to that question",
    })
  }
}
