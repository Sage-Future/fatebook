import { useSession } from "next-auth/react"
import { api } from "../lib/web/trpc"
import { Question } from "./Question"

export function Questions() {
  const session = useSession()

  const questions = api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery(undefined, {
    queryKey: ["question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith", undefined]
  })

  if (!session.data?.user.id) {
    return <></>
  }

  // if (questions.isLoading) {
  //   return (
  //     <div role="status" className="prose p-4 border border-gray-200 rounded shadow animate-pulse md:p-6">
  //       <div className="h-2.5 bg-gray-200 rounded-full w-48 mb-4"></div>
  //       <div className="h-2 bg-gray-200 rounded-full mb-2.5"></div>
  //       <div className="h-2 bg-gray-200 rounded-full mb-2.5"></div>
  //       <div className="h-2 bg-gray-200 rounded-full"></div>
  //       <div className="flex items-center mt-4 space-x-3">
  //         <svg className="text-gray-200 w-14 h-14" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path></svg>
  //         <div>
  //           <div className="h-2.5 bg-gray-200 rounded-full w-32 mb-2"></div>
  //           <div className="w-48 h-2 bg-gray-200 rounded-full"></div>
  //         </div>
  //       </div>
  //       <span className="sr-only">Loading...</span>
  //     </div>
  //   )
  // }

  if (!questions.data || questions.data.length === 0) {
    return <></>
  }

  return (
    <div>
      <h3 className="mb-2 select-none">Your forecasts</h3>
      <div className="grid gap-6">
        {questions.data.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        ).map((question, index) => (
          <Question question={question}
            key={question.id}
            startExpanded={index === 0}
            zIndex={questions.data?.length ? (questions.data?.length - index) : undefined}
          />
        ))}
      </div>
    </div>
  )
}