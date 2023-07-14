import { Question } from "@prisma/client"
import { useSession } from "next-auth/react"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { Question as QuestionComp } from "../../components/Question"
import { api, getClientBaseUrl } from "../../lib/web/trpc"
import { signInToFatebook, truncateString } from '../../lib/web/utils'

function createQuestionSlug(question: Partial<Question>) {
  return question.title ?
    encodeURIComponent(truncateString(question.title, 40, false).replace(/[^a-z0-9]+/gi, "-").toLowerCase())
    :
    ""
}

export function getQuestionUrl(question: Partial<Question>, useRelativePath?: boolean) {
  return `${getClientBaseUrl(useRelativePath)}/q/${createQuestionSlug(question)}--${question.id}`
}

export default function QuestionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  // allow an optional ignored slug text before `--` character
  const parts = router.query.id && (router.query.id as string).match(/(.*)--(.*)/)
  const id = parts ? parts[2] : (router.query.id as string) || ""
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
      {question && <NextSeo title={truncateString(question?.title, 60)} />}
      <div className="prose mx-auto">
        {
          (qQuery.status === "error" || (qQuery.status === "success" &&  !question)) && (!session?.user.id ?
            <h3 className="text-neutral-600"><a className="font-bold" href="#" onClick={() => void signInToFatebook()}>Sign in</a> to view this question</h3>
            :
            <h3 className="text-neutral-600">{`This question doesn't exist or your account (${session.user.email}) doesn't have access`}</h3>
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