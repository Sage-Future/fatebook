import { Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import Link from "next/link"
import { useState } from 'react'
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
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
  alwaysExpand?: boolean
  startExpanded?: boolean
}) {
  const [manuallyExpanded, setManuallyExpanded] = useState<boolean>(!!startExpanded)

  return (
    <div className="bg-white rounded-md group" onClick={() => setManuallyExpanded(!manuallyExpanded)}>
      <div className="grid grid-cols-1 p-4 gap-1 relative" key={question.id}>
        <span className="col-span-2 flex gap-4 justify-between">
          <span className="font-semibold" key={`${question.id}title`}>
            <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
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
                <span>Resolved</span> <FormattedDate date={question.resolvedAt} />
              </span>
            ) : (
              <span className={clsx(
                "text-sm text-gray-400 my-auto",
                question.resolveBy < new Date() && "text-indigo-300"
              )} key={`${question.id}resolve`}>
                {question.resolveBy < new Date() ?
                  <><span>Ready to resolve</span><br/> {"("}<FormattedDate date={question.resolveBy} />{")"}</>
                  :
                  <><span>Resolves</span> <FormattedDate date={question.resolveBy} /></>
                }
              </span>
            )
          }
          <ResolveButton question={question} />
        </div>
        {!alwaysExpand && <div
          className="absolute right-0 bottom-0 p-0.5"
          onClick={() => setManuallyExpanded(!manuallyExpanded)}
        >
          {manuallyExpanded ? <ChevronDownIcon
            className="h-5 w-5 text-gray-200 hidden group-hover:block hover:text-gray-400"
            aria-hidden="true"
          /> : <ChevronLeftIcon
            className="h-5 w-5 text-gray-200  hidden group-hover:block hover:text-gray-400"
            aria-hidden="true"
          />
          }
        </div>}
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
  )
}
