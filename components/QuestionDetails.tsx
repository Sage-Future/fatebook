import { Fragment, ReactNode, useState } from 'react'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { displayForecast } from "../lib/_utils_common"
import { api } from '../lib/web/trpc'
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { Username } from "./Username"

export function QuestionDetails({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {

  return (
    <div className="bg-slate-100 px-8 py-4 text-sm flex flex-col gap rounded-b-md shadow-sm" onClick={(e) => e.stopPropagation()}>
      <CommentBox question={question} />
      <EventsLog question={question} />
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
        <span className="text-slate-400"><FormattedDate date={c.createdAt} /></span>
        <span className="md:pl-7 col-span-3 pb-2 -mt-1.5">{c.comment}</span>
      </Fragment>
    })),
    [
      ...(question.notes ? [{
        timestamp: question.createdAt,
        el: <Fragment key={`${question.id} note`}>
          <span><Username user={question.user} className="font-semibold" /></span>
          <span/>
          <span className="text-slate-400"><FormattedDate date={question.createdAt} /></span>
          <span className="md:pl-7 col-span-3 pb-2 -mt-1.5">{question.notes}</span>
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
    <div className="grid grid-cols-[minmax(80px,_auto)_auto_auto] gap-2">
      {events.length ?
        events.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime() // reverse chronological
        ).map((event) => event?.el)
        :
        <span className="text-sm text-slate-400 italic">No forecasts yet</span>}
    </div>
  )
}

function CommentBox({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}){
  const utils = api.useContext()
  const addComment = api.question.addComment.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOn.invalidate()
      await utils.question.getQuestion.invalidate({ questionId: question.id })
      setLocalComment("")
    }
  })
  const [localComment, setLocalComment] = useState<string>("")

  return <div className='pb-4'>
    <ReactTextareaAutosize
      className="shadow-sm py-2 px-4 focus:border-indigo-500 block w-full border-2 border-slate-300 rounded-md p-4 resize-none disabled:opacity-25 disabled:bg-slate-100"
      placeholder={`Add a note...`}
      disabled={addComment.isLoading}
      value={localComment}
      onChange={(e) => {
        setLocalComment(e.target.value)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && e.currentTarget.value.trim() !== "") {
          addComment.mutate({
            questionId: question.id,
            comment: e.currentTarget.value,
          })
          e.preventDefault()
        }
      }}
    />
  </div>
}