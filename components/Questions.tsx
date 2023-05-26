import { useSession } from "next-auth/react"
import { api } from "../lib/web/trpc"
import { Question } from "./Question"

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
          <Question question={question} key={question.id} />
        ))}
      </div>
    </div>
  )
}