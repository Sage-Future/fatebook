import clsx from "clsx"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { api } from "../lib/web/trpc"
import { FormattedDate } from "./FormattedDate"
import { Username } from "./Username"
import { getQuestionUrl } from "../pages/q/[id]"
import { ResolveButton } from "./ResolveButton"

export function Questions() {
  const session = useSession()

  const questions = api.question.getQuestionsUserCreatedOrForecastedOn.useQuery({
    userId: session.data?.user.id
  }, {
    queryKey: ["question.getQuestionsUserCreatedOrForecastedOn", {
      userId: session.data?.user.id
    }]
  })

  if (!session.data?.user.id) {
    return <></>
  }

  if (!questions.data) {
    return <></>
  }

  return (
    <div>
      <h3 className="mb-2">Your forecasts</h3>
      <div className="grid gap-4">
        {questions.data.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        ).map((question) => (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-1" key={question.id}>
            <span className="col-span-2 xl:col-span-1 font-semibold" key={`${question.id}title`}>
              <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
                {question.title}
              </Link>
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
              <ResolveButton question={question} />
            </div>
          </div>

        ))}
      </div>
    </div>
  )
}