import { useSession } from "next-auth/react"
import { api } from "../lib/web/trpc"
import { Question } from "./Question"
import { ifEmpty } from "../lib/web/utils"
import { InView } from "react-intersection-observer"

export function Questions({
  title,
  filter
}: {
  title?: string,
  filter?: (question: any) => boolean
}) {
  const session = useSession()

  const questionsQ = api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage, pages) => pages.flatMap(p => p).length,
    }
  )

  if (!session.data?.user.id || !questionsQ.data || questionsQ.data.pages.length === 0) {
    return <></>
  }

  const questionsUnfiltered = questionsQ.data.pages.flatMap(p => p)
  const questions = questionsUnfiltered.filter(question => (!filter || filter(question)) && question)

  return (
    <div>
      <h3 className="mb-2 select-none">{title || "Your forecasts"}</h3>
      <div className="grid gap-6">
        {ifEmpty(
          questions
            .map((question, index) => (
              question ?
                <Question question={question}
                  key={question.id}
                  startExpanded={index === 0}
                  zIndex={questions?.length ? (questions?.length - index) : undefined}
                />
                :
                <></>
            )),
          <div className="italic">
            No questions yet
          </div>
        )}
        <InView>
          {({ inView, ref }) => {
            if (inView) {
              void questionsQ.fetchNextPage()
            }
            return (
              <div ref={ref} />
            )
          }}
        </InView>
      </div>
    </div>
  )
}