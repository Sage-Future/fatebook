import { Question } from "@prisma/client"
import { getClientBaseUrl } from "./trpc"
import { useRouter } from "next/router"
import { truncateString } from "./utils"

function createQuestionSlug(question: Partial<Question>) {
  return question.title
    ? encodeURIComponent(
        truncateString(question.title, 40, false)
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase()
      )
    : ""
}

export function getQuestionUrl(
  question: Partial<Question>,
  useRelativePath?: boolean
) {
  return `${getClientBaseUrl(useRelativePath)}/q/${createQuestionSlug(
    question
  )}--${question.id}`
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
