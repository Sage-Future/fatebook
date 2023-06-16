import { Question } from "@prisma/client"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { Question as QuestionComp } from "../../components/Question"
import { api, getClientBaseUrl } from "../../lib/web/trpc"

function createQuestionSlug(question: Partial<Question>) {
  return question.title ?
    encodeURIComponent(question.title?.substring(0, 30).replace(/[^a-z0-9]+/gi, "-").toLowerCase())
    :
    ""
}

export function getQuestionUrl(question: Partial<Question>, useRelativePath?: boolean) {
  return `${getClientBaseUrl(useRelativePath)}/q/${createQuestionSlug(question)}--${question.id}`
}

export default function QuestionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  // allow an optional ignored slug text after `-` character
  const parts = router.query.id && (router.query.id as string).split("--")

  const id = parts && parts[parts.length - 1]
  const qQuery = api.question.getQuestion.useQuery({
    questionId: id
  }, {
    retry(failureCount, error) {
      if (error.data?.httpStatus === 401) {
        return false
      }
      return false
    },
  })

  const question = qQuery.data
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        {
          (qQuery.status === "error") && (!session?.user.id ?
            <h3 className="text-gray-600"><a className="font-bold" href="#" onClick={() => void signIn("google")}>Sign in</a> to view this question</h3>
            :
            <h3 className="text-gray-600">{`This question doesn't exist or your account (${session.user.email}) doesn't have access`}</h3>
          )
        }
        {
          question && <>
            <div className="grid grid-cols-1" key={question.id}>
              <QuestionComp question={question} alwaysExpand={true} />
            </div>
          </>
        }
      </div>
    </div>
  )
}