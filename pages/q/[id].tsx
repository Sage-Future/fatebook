import { Question } from "@prisma/client"
import Link from "next/link"
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
  return `${getClientBaseUrl(useRelativePath)}/q/${question.id}--${createQuestionSlug(question)}`
}

export default function QuestionPage() {
  const router = useRouter()
  // allow an optional ignored slug text after `-` character
  const id = router.query.id && parseInt((router.query.id as string).split("-")[0])
  const qQuery = api.question.getQuestion.useQuery({
    questionId: (typeof id === "number" && !isNaN(id)) ? id : undefined
  })

  const sendEmail = api.sendEmail.useMutation()

  const question = qQuery.data
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        <h2 className="text-3xl mb-4">
          <Link href="/" className="no-underline font-extrabold text-gray-900">
              Fatebook
          </Link>
        </h2>
        {
          (!question && !qQuery.isLoading) && <>
            <h3 className="text-gray-600">That question does not exist, or the author has not shared it with you.</h3>
          </>
        }
        {
          question && <>
            <div className="grid grid-cols-1" key={question.id}>
              <QuestionComp question={question} alwaysExpand={true} />
            </div>
            <button onClick={() => sendEmail.mutate({questionId: question.id })}>Send email</button>
          </>
        }
      </div>
    </div>
  )
}