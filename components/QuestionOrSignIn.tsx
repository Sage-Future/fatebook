import { Question } from "@prisma/client"
import { useSession } from "next-auth/react"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { getClientBaseUrl, api } from "../lib/web/trpc"
import { truncateString, signInToFatebook } from "../lib/web/utils"
import { Question as QuestionComp } from "./Question"
import { useQuestionId } from "../lib/web/question_url"

export function QuestionOrSignIn({ embedded, alwaysExpand }: { embedded: boolean, alwaysExpand: boolean }) {
  const { data: session } = useSession()

  const questionId = useQuestionId()

  // allow an optional ignored slug text before `--` character
  const qQuery = api.question.getQuestion.useQuery({ questionId }, { retry: false })
  const question = qQuery.data

  // check signed in
  if (!session?.user.id) {
    return (
      embedded ?
        <div className="flex h-full items-center justify-center">
          <h3 className="text-neutral-600"><a className="font-bold" href="/" target="_blank">Sign in </a>to view this question</h3>
        </div> :
        <h3 className="text-neutral-600"><a className="font-bold" href="#" onClick={() => void signInToFatebook()}>Sign in </a> to view this question</h3>
    )
  }

  // check question came
  if ((qQuery.status === "error" || (qQuery.status === "success" && !question))) {
    return <h3 className="text-neutral-600">{`This question doesn't exist or your account (${session.user.email}) doesn't have access`}</h3>
  } else if (!question) {
    return null
  }

  // we have a user and a question, let's go!
  return (
    <div className="grid grid-cols-1" key={question.id}>
      <NextSeo title={truncateString(question?.title, 60)} />
      <QuestionComp embedded={embedded} question={question} alwaysExpand={alwaysExpand} />
    </div>
  )
}