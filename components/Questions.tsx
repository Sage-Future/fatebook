import { useSession } from "next-auth/react"
import { api } from "../lib/web/trpc"
import { ifEmpty } from "../lib/web/utils"
import { Question as QuestionComp } from "./Question"

export function Questions({
  title,
  filter
}: {
  title?: string,
  filter?: (question: any) => boolean
}) {
  const session = useSession()

  const questions = api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery(undefined, {
    queryKey: ["question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith", undefined]
  })

  if (!session.data?.user.id) {
    return <></>
  }

  if (!questions.data || questions.data.length === 0) {
    return <></>
  }

  return (
    <div>
      <h3 className="mb-2 select-none">{title || "Your forecasts"}</h3>
      <div className="grid gap-6">
        {ifEmpty(
          questions.data.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )
            .filter(question => !filter || filter(question))
            .map((question, index) => (
              <QuestionComp question={question}
                key={question.id}
                startExpanded={index === 0}
                zIndex={questions.data?.length ? (questions.data?.length - index) : undefined}
              />
            )),
          <div className="italic">
            No questions yet
          </div>
        )}
      </div>
    </div>
  )
}