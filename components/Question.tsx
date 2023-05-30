import { Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/20/solid"
import { User } from "@prisma/client"
import clsx from "clsx"
import Link from "next/link"
import { Fragment, ReactNode, useState } from 'react'
import { displayForecast } from "../lib/web/utils"
import { getQuestionUrl } from "../pages/q/[id]"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { ResolveButton } from "./ResolveButton"
import { SharePopover } from "./SharePopover"
import { UpdateableLatestForecast } from "./UpdateableLatestForecast"
import { Username } from "./Username"

export function Question({
  question,
  expand,
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
  expand?: boolean
}) {
  const [manuallyExpanded, setManuallyExpanded] = useState<boolean>(false)

  return (
    <div className="bg-white rounded-md group">
      <div className="grid grid-cols-1 p-4 gap-1 relative" key={question.id}>
        <span className="col-span-2 flex gap-4 justify-between">
          <span className="font-semibold" key={`${question.id}title`}>
            <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
              {question.title}
            </Link>
          </span>
          <UpdateableLatestForecast question={question} autoFocus={expand} />
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
                <span>Resolves</span> <FormattedDate date={question.resolveBy} />
              </span>
            )
          }
          <ResolveButton question={question} />
        </div>
        {!expand && <div
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
        show={expand || manuallyExpanded}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-98 translate-y-[-0.5rem]"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100 translate-y-0 "
        leaveTo="transform opacity-0 scale-98 translate-y-[-0.5rem]"
      >
        <ExpandedQuestion question={question} />
      </Transition>
    </div>
  )
}

function ExpandedQuestion({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  let events: {id: number, user: User, eventEl: ReactNode, timestamp: Date}[] = question.forecasts.map(f =>
    ({
      id: f.id,
      user: f.user,
      eventEl: <span className="font-bold text-lg text-indigo-800">{displayForecast(f, 2)}</span>,
      timestamp: f.createdAt,
    })
  )
  // events.push({
  //   user: question.user,
  //   eventEl: <span className="italic">Asked</span>,
  //   timestamp: question.createdAt,
  // })

  return (
    <div className="bg-white px-8 py-4">
      <div className="grid grid-cols-[auto_auto_auto] gap-2">
        {
          events.length ?
            events.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime() // reverse chronological
            ).map((event) => {
              return (
                <Fragment key={event.id}>
                  <Username user={event.user} />
                  <span>{event.eventEl}</span>
                  <div className="text-gray-400"><FormattedDate date={event.timestamp} /></div>
                </Fragment>
              )
            })
            :
            <span className="text-sm text-gray-400 italic">No forecasts yet</span>
        }
      </div>
    </div>
  )
}