import { Question } from "@prisma/client"
import { useRouter } from "next/router"
import { getClientBaseUrl } from "./trpc"
import { getSlug } from "./utils"

export function getQuestionUrl(
  question: Partial<Question>,
  useRelativePath?: boolean,
) {
  return `${getClientBaseUrl(useRelativePath)}/q/${getSlug(question.title)}--${
    question.id
  }`
}

export function useQuestionId() {
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.id && (router.query.id as string).match(/(.*)--(.*)/)
  return parts ? parts[2] : (router.query.id as string) || ""
}

export function getQuestionIdFromUrl(url: string) {
  const lastSegment = url.substring(url.lastIndexOf("/") + 1)

  // allow an optional ignored slug text before `--` character
  const parts = lastSegment.match(/(.*)--(.*)/)
  return parts ? parts[2] : lastSegment || ""
}
