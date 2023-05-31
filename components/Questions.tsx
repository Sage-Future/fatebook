import { useSession } from "next-auth/react"
import { api } from "../lib/web/trpc"
import { Question } from "./Question"

export function Questions() {
  const session = useSession()

  const questions = api.question.getQuestionsUserCreatedOrForecastedOn.useQuery(undefined, {
    queryKey: ["question.getQuestionsUserCreatedOrForecastedOn", undefined]
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
      <div className="grid gap-6">
        {questions.data.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        ).map((question, index) => (
          <Question question={question} key={question.id} startExpanded={index === 0} />
        ))}
      </div>
    </div>
  )
}