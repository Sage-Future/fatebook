import { Transition } from '@headlessui/react'
import { ChevronDownIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import Link from "next/link"
import { useState } from 'react'
import { ErrorBoundary } from "react-error-boundary"
import { getQuestionUrl } from "../pages/q/[id]"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { QuestionDetails } from './QuestionDetails'
import { ResolveButton } from "./ResolveButton"
import { SharePopover } from "./SharePopover"
import { UpdateableLatestForecast } from "./UpdateableLatestForecast"
import { Username } from "./Username"


export function Question({
  question,
  alwaysExpand,
  startExpanded,
  zIndex,
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
  alwaysExpand?: boolean
  startExpanded?: boolean
  zIndex?: number
}) {
  const [manuallyExpanded, setManuallyExpanded] = useState<boolean>(!!startExpanded)

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="hover:scale-[1.01] transition-transform group" style={zIndex ? {zIndex} : undefined}>
        <div
          className={clsx("rounded-md shadow-sm group-hover:shadow-md transition-all cursor-pointer z-10 outline-1 outline",
                          (manuallyExpanded || alwaysExpand) && "rounded-b-none",
                          question.resolution ?
                            "bg-neutral-50 outline-[#eceff5] bg-gradient-to-tl via-neutral-50 via-[30%] group-hover:via-[40%]"
                            :
                            "bg-white outline-neutral-200",
                          question.resolution === 'YES' ? "from-green-100" : question.resolution === 'NO' ? "from-red-100" : question.resolution === 'AMBIGUOUS' ? "from-blue-100" : "from-white",)}
          onClick={() => setManuallyExpanded(!manuallyExpanded)}
        >
          <div className="grid grid-cols-1 p-4 gap-1 relative" key={question.id}>
            <span className="col-span-2 flex gap-4 mb-1 justify-between">
              <span className={"font-semibold"} key={`${question.id}title`}>
                <Link
                  href={getQuestionUrl(question)}
                  key={question.id}
                  className={"no-underline hover:underline"}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}>
                  {question.title}
                </Link>
              </span>
              <UpdateableLatestForecast question={question} autoFocus={alwaysExpand} />
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <span className="text-sm my-auto" key={`${question.id}author`}>
                <Username user={question.user} />
              </span>
              <SharePopover question={question} />
              {
                question.resolvedAt ? (
                  <span className="text-sm text-gray-400 my-auto" key={`${question.id}resolve`}>
                    <FormattedDate prefix={"Resolved "} date={question.resolvedAt} />
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "text-sm text-gray-400 my-auto",
                      question.resolveBy < new Date() && "text-indigo-300"
                    )}
                    key={`${question.id}resolve`}>
                    {question.resolveBy < new Date() ?
                      <FormattedDate prefix={<><span>Ready to resolve</span><br/>{"("}</>} date={question.resolveBy} postfix=")" />
                      :
                      <FormattedDate prefix={"Resolves "} date={question.resolveBy} />
                    }
                  </span>
                )
              }
              <ResolveButton question={question} />
              <ActivityNumbers
                question={question}
                alwaysExpand={alwaysExpand}
                manuallyExpanded={manuallyExpanded}
                setManuallyExpanded={setManuallyExpanded}
              />
            </div>
          </div>
        </div>
        <Transition
          show={alwaysExpand || manuallyExpanded}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-98 translate-y-[-0.5rem]"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100 translate-y-0 "
          leaveTo="transform opacity-0 scale-98 translate-y-[-0.5rem]"
        >
          <QuestionDetails question={question} />
        </Transition>
      </div>
    </ErrorBoundary>
  )
}

export function ActivityNumbers({
  question,
  alwaysExpand,
  manuallyExpanded,
  setManuallyExpanded,
} : {
    question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
    alwaysExpand: boolean | undefined
    manuallyExpanded: boolean
    setManuallyExpanded: (expanded: boolean) => void
  }) {
  return (
    <div
      className="col-span-full flex flex-row gap-2 text-sm text-gray-400 justify-end hover:underline items-center"
      onClick={() => setManuallyExpanded(!manuallyExpanded)}
    >
      <span>{question.forecasts?.length ?? 0} forecasts</span>
      <span>{new Set(question.forecasts.map(f => f.userId)).size} forecasters</span>
      <span>{(question.comments?.length ?? 0) + (question.notes ? 1 : 0)} comments</span>
      {!alwaysExpand && <button
        className="button p-0"
      >
        <ChevronDownIcon
          className={clsx("h-5 w-5 transition-transform",
                          !manuallyExpanded && "transform rotate-90")}
          aria-hidden="true"
        />
      </button>}
    </div>
  )
}