import { useSession } from "next-auth/react"
import { LoaderIcon } from "react-hot-toast"
import { InView } from "react-intersection-observer"
import { api } from "../lib/web/trpc"
import { ifEmpty } from "../lib/web/utils"
import { Question } from "./Question"

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
      initialCursor: 0, // NB: "cursor" language comes from TRPC, but we use take/skip method in Prisma
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    }
  )

  if (!session.data?.user.id || !questionsQ.data || questionsQ.data.pages.length === 0) {
    return <></>
  }

  const questionsUnfiltered = questionsQ.data.pages.flatMap(p => p?.items)
  const questions = questionsUnfiltered.filter(question => (!filter || filter(question)) && question)

  return (
    <div>
      <h3 className="select-none flex gap-4 mb-2">
        {title || "Your forecasts"}
        {(questionsQ.isLoading) && <div className="mt-2.5"><LoaderIcon /></div>}
      </h3>
      <div className="grid gap-6">
        {ifEmpty(
          questions
            .map((question, index) => (
              question ?
                <Question
                  question={question}
                  key={question.id}
                  startExpanded={index === 0}
                  zIndex={questions?.length ? (questions?.length - index) : undefined}
                />
                :
                <></>
            )),
          <div className="italic text-gray-500 text-sm">
            Make your first forecast to see it here.
          </div>
        )}
        <InView>
          {({ inView, ref }) => {
            if (inView && questionsQ.hasNextPage) {
              void questionsQ.fetchNextPage()
            }
            return (
              <div ref={ref} />
            )
          }}
        </InView>
        {(questionsQ.isFetchingNextPage || questionsQ.isRefetching) && <LoaderIcon className="mx-auto" />}
      </div>
    </div>
  )
}