import { useRouter } from "next/router"
import { trpc } from "../../lib/web/trpc"
import clsx from "clsx"
import Link from "next/link"
import { FormattedDate } from "../../components/FormattedDate"
import { Username } from "../../components/Username"

export default function QuestionPage() {
  const router = useRouter()
  // allow an optional ignored slug text after `-` character
  const id = router.query.id && parseInt((router.query.id as string).split("-")[0])
  const qQuery = trpc.question.getQuestion.useQuery({
    questionId: (typeof id === "number" && !isNaN(id)) ? id : undefined
  })

  if (!qQuery.data) {
    return <></>
  }

  const question = qQuery.data
  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-1" key={question.id}>
        <span className="col-span-2 xl:col-span-1 font-semibold" key={`${question.id}title`}>
          <Link href={`q/${question.id}`}>{question.title}</Link>
        </span>
        <div className="grid grid-cols-3">
          <span className="text-sm" key={`${question.id}author`}>
            <Username user={question.profile.user} />
          </span>
          {
            question.resolvedAt ? (
              <span className="text-sm text-gray-400" key={`${question.id}resolve`}>
                <span>Resolved</span> <FormattedDate date={question.resolvedAt} />
              </span>
            ) : (
              <span className={clsx(
                "text-sm text-gray-400",
                question.resolveBy < new Date() && "text-indigo-300"
              )} key={`${question.id}resolve`}>
                <span>Resolves</span> <FormattedDate date={question.resolveBy} />
              </span>
            )
          }
          <span className="text-sm" key={`${question.id}resolution`}>
            {question.resolution}
          </span>
        </div>
      </div>
    </div>
  )
}