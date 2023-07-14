import { CheckCircleIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"
import { useSession } from "next-auth/react"
import { useState } from 'react'
import { LoaderIcon } from "react-hot-toast"
import { InView } from "react-intersection-observer"
import { ExtraFilters } from "../lib/web/question_router"
import { api } from "../lib/web/trpc"
import { ifEmpty } from "../lib/web/utils"
import { Question } from "./Question"

export function Questions({
  title,
  filterClientSide,
  noQuestionsText = "Make your first forecast to see it here.",
}: {
  title?: string,
  filterClientSide?: (question: any) => boolean
  noQuestionsText?: string,
}) {
  const session = useSession()

  const [extraFilters, setExtraFilters] = useState<ExtraFilters>({
    resolved: false,
    readyToResolve: false,
    resolvingSoon: false,
  })
  const filtersApplied = Object.values(extraFilters).some(f => f)

  const questionsQ = api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useInfiniteQuery(
    {
      limit: 10,
      extraFilters,
    },
    {
      initialCursor: 0, // NB: "cursor" language comes from TRPC, but we use take/skip method in Prisma
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      keepPreviousData: true,
    }
  )

  if (
    (!session.data?.user.id || !questionsQ.data || questionsQ.data.pages.length === 0)
    && !filtersApplied // don't hide everything if user applied a filter
  ) {
    return <></>
  }

  const questionsUnfiltered = questionsQ.data?.pages.flatMap(p => p?.items).filter(q => !!q) || []
  // some edge cases cause duplicates, e.g. when a filter is applied and a question stops matching the filter
  // then the question cursor logic will cause it to be duplicated in the next page
  const questionsNoDuplicates = questionsUnfiltered.filter((question, index) => {
    const questionIds = questionsUnfiltered.map(q => q!.id)
    return questionIds.indexOf(question!.id) === index
  })
  const questions = questionsNoDuplicates
    .filter(question => (!filterClientSide || filterClientSide(question)) && question)

  return (
    <div>
      <div className="flex max-sm:flex-col justify-between pt-6 pb-4">
        <h3 className="select-none flex gap-4 my-auto">
          {title || "Your forecasts"}
          {(questionsQ.isLoading) && <div className="mt-2.5"><LoaderIcon /></div>}
        </h3>
        {(questions?.length > 0 || filtersApplied) && <FilterControls
          extraFilters={extraFilters}
          setExtraFilters={setExtraFilters}
        />}
      </div>
      <div className="grid gap-6">
        {ifEmpty(
          questions
            .map((question, index) => (
              question ?
                <Question
                  question={question}
                  key={question.id}
                  startExpanded={(index === 0 && question.userId === session.data?.user.id)}
                  zIndex={questions?.length ? (questions?.length - index) : undefined}
                />
                :
                <></>
            )),
          <div className="italic text-neutral-500 text-sm">
            {filtersApplied ?
              "No questions match your filters."
              :
              noQuestionsText
            }
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

function FilterControls({
  extraFilters,
  setExtraFilters,
}: {
  extraFilters: ExtraFilters,
  setExtraFilters: (extraFilters: ExtraFilters) => void,
}) {
  return (
    <div className="flex flex-row flex-wrap gap-2" id="filters">
      <button
        onClick={() => setExtraFilters({
          ...extraFilters,
          resolved: false,
          readyToResolve: false,
          resolvingSoon: !extraFilters.resolvingSoon,
        })}
        className={clsx(
          "btn",
          extraFilters.resolvingSoon ? "btn-primary" : "text-neutral-500",
        )}
      >
        {extraFilters.resolvingSoon && <CheckCircleIcon height={16} />}
        Resolving soon
      </button>

      <button
        onClick={() => setExtraFilters({
          ...extraFilters,
          resolved: false,
          resolvingSoon: false,
          readyToResolve: !extraFilters.readyToResolve,
        })}
        className={clsx(
          "btn",
          extraFilters.readyToResolve ? "btn-primary" : "text-neutral-500",
        )}
      >
        {extraFilters.readyToResolve && <CheckCircleIcon height={16} />}
        Ready to resolve
      </button>

      <button
        onClick={() => setExtraFilters({
          ...extraFilters,
          readyToResolve: false,
          resolvingSoon: false,
          resolved: !extraFilters.resolved,
        })}
        className={clsx(
          "btn",
          extraFilters.resolved ? "btn-primary" : "text-neutral-500",
        )}
      >
        {extraFilters.resolved && <CheckCircleIcon height={16} />}
        Resolved
      </button>
    </div>
  )
}