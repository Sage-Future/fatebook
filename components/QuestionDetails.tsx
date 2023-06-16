import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Fragment, ReactNode, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { displayForecast, forecastsAreHidden, getDateYYYYMMDD } from "../lib/_utils_common"
import { api } from '../lib/web/trpc'
import { useUserId } from '../lib/web/utils'
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { Username } from "./Username"

export function QuestionDetails({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {

  return (
    <div className="bg-slate-100 px-8 py-4 text-sm flex flex-col gap rounded-b-md shadow-sm group-hover:shadow-md" onClick={(e) => e.stopPropagation()}>
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

function CommentBox({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}){
  const userId = useUserId()
  const utils = api.useContext()
  const addComment = api.question.addComment.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      await utils.question.getQuestion.invalidate({ questionId: question.id })
      setLocalComment("")
    }
  })
  const [localComment, setLocalComment] = useState<string>("")

  const deleteQuestion = api.question.deleteQuestion.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })
  const router = useRouter()

  return <div className='pb-4'>
    {!userId && <div className="flex w-full p-4">
      <button className="button primary mx-auto" onClick={() => void signIn("google")}>
        Sign in to add your own prediction
      </button>
    </div>}
    <div className="flex gap-2">
      <ReactTextareaAutosize
        className="shadow-sm py-2 px-4 focus:border-indigo-500 block w-full border-2 border-slate-300 rounded-md p-4 resize-none disabled:opacity-25 disabled:bg-slate-100"
        placeholder={`Add a comment...`}
        disabled={addComment.isLoading || !userId}
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
      {
        userId === question.userId && <div className="dropdown dropdown-end not-prose">
          <label tabIndex={0} className="btn btn-xs btn-ghost"><EllipsisVerticalIcon height={15} /></label>
          <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a onClick={() => {
              if (confirm("Are you sure you want to delete this question? This cannot be undone")) {
                deleteQuestion.mutate({
                  questionId: question.id
                })
                if (router.asPath.startsWith("/q/")) {
                  void router.push("/")
                }
              }
            }}>Delete question</a></li>
          </ul>
        </div>
      }
    </div>
  </div>
}

function DeleteCommentOverflow({
  question,
  comment
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
  comment: { id: number }
}) {
  const userId = useUserId()

  const utils = api.useContext()
  const deleteComment = api.question.deleteComment.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })

  if (userId !== question.userId) {
    return <></>
  }

  return (
    <div className="dropdown dropdown-end not-prose">
      <label tabIndex={0} className="btn btn-xs btn-ghost"><EllipsisVerticalIcon height={15} /></label>
      <ul tabIndex={0} className="dropdown-content text-black z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
        <li><a onClick={() => {
          deleteComment.mutate({
            commentId: comment.id
          })
        }}>Delete comment</a></li>
      </ul>
    </div>
  )
}