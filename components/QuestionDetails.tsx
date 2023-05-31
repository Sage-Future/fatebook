import { Fragment, ReactNode, useState } from 'react'
import { displayForecast } from "../lib/web/utils"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { Username } from "./Username"
import ReactTextareaAutosize from 'react-textarea-autosize'
import { api } from '../lib/web/trpc'

export function QuestionDetails({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {

  return (
    <div className="bg-white px-8 py-4 text-sm flex flex-col gap" onClick={(e) => e.stopPropagation()}>
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
        <div className="text-gray-400"><FormattedDate date={f.createdAt} /></div>
      </Fragment>
    })
    ),
    question.comments && question.comments.map(c => ({
      timestamp: c.createdAt,
      el: <Fragment key={c.id}>
        <span><Username user={c.user} className="font-semibold" /></span>
        <span/>
        <span className="text-gray-400"><FormattedDate date={c.createdAt} /></span>
        <span className="md:pl-7 col-span-3 pb-2 -mt-1.5">{c.comment}</span>
      </Fragment>
    })),
  ].flat()
  // events.push({
  //   user: question.user,
  //   eventEl: <span className="italic">Asked</span>,
  //   timestamp: question.createdAt,
  // })
  return (
    <div className="grid grid-cols-[minmax(80px,_auto)_auto_auto] gap-2">
      {events.length ?
        events.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime() // reverse chronological
        ).map((event) => event?.el)
        :
        <span className="text-sm text-gray-400 italic">No forecasts yet</span>}
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
      className="shadow-sm py-4 px-4 focus:border-indigo-500 block w-full border-2 border-gray-300 rounded-md p-4 resize-none disabled:opacity-25 disabled:bg-gray-100"
      placeholder={`I predicted X% because...`}
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