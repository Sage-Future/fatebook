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

export function extractQuestionId(input: string): string {
  // allow an optional ignored slug text before `--` character
  const parts = input.match(/(.*)--(.*)/)
  return parts ? parts[2] : input
}

export function useQuestionId() {
  const router = useRouter()
  const id = router.query.id as string
  return id ? extractQuestionId(id) : ""
}

export function getQuestionIdFromUrl(url: string) {
  const lastSegment = url.substring(url.lastIndexOf("/") + 1)
  return extractQuestionId(lastSegment)
}
