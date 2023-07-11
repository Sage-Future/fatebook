import { Fragment, ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { displayForecast, forecastsAreHidden, getDateYYYYMMDD } from "../lib/_utils_common"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"
import { CommentBox, DeleteCommentOverflow } from './CommentBox'
import { FormattedDate } from "./FormattedDate"
import { Username } from "./Username"

export function QuestionDetails({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {

  return (
    <div className="bg-neutral-100 border-[1px] px-8 py-4 text-sm flex flex-col gap rounded-b-md shadow-sm group-hover:shadow-md" onClick={(e) => e.stopPropagation()}>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <CommentBox question={question} />
        {forecastsAreHidden(question) && question.hideForecastsUntil && <div className="mt-2 mb-6 text-sm text-slate-400 italic">
          {`Other users' forecasts are hidden until ${getDateYYYYMMDD(question.hideForecastsUntil)} to prevent anchoring.`}
        </div>}
        <EventsLog question={question} />
      </ErrorBoundary>
    </div>
  )
}

function EventsLog({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {
  let events: { timestamp: Date, el: ReactNode }[] = [
    question.forecasts.map(f =>({
      timestamp: f.createdAt,
      el: <Fragment key={f.id}>
        <Username user={f.user} className='font-semibold' />
        <span className="font-bold text-lg text-indigo-800">{displayForecast(f, 2)}</span>
        <div className="text-slate-400"><FormattedDate date={f.createdAt} /></div>
      </Fragment>
    })
    ),
    question.comments && question.comments.map(c => ({
      timestamp: c.createdAt,
      el: <Fragment key={c.id}>
        <span><Username user={c.user} className="font-semibold" /></span>
        <span/>
        <span className="text-slate-400 inline-flex justify-between w-full">
          <FormattedDate date={c.createdAt} className='my-auto' />
          <DeleteCommentOverflow question={question} comment={c} />
        </span>
        <span className="md:pl-7 col-span-3 -mt-1">
          {c.comment}
        </span>
      </Fragment>
    })),
    [
      ...(question.notes ? [{
        timestamp: question.createdAt,
        el: <Fragment key={`${question.id} note`}>
          <span><Username user={question.user} className="font-semibold" /></span>
          <span/>
          <span className="text-slate-400"><FormattedDate date={question.createdAt} /></span>
          <span className="md:pl-7 col-span-3 -mt-1">
            {question.notes}
          </span>
        </Fragment>
      }] : []),
    ],
    [
      ...(question.resolvedAt ? [{
        timestamp: question.resolvedAt,
        el: <Fragment key={`${question.id} resolution`}>
          <Username user={question.user} className='font-semibold' />
          <span className="italic text-indigo-800">Resolved {question.resolution}</span>
          <span className="text-slate-400"><FormattedDate date={question.resolvedAt} /></span>
        </Fragment>
      }] : []),
    ],
  ].flat()
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="grid grid-cols-[minmax(80px,_auto)_auto_auto] gap-2 items-center">
        {events.length ?
          events.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime() // reverse chronological
          ).map((event) => event?.el)
          :
          <span className="text-sm text-slate-400 italic">No forecasts yet</span>}
      </div>
    </ErrorBoundary>
  )
}
