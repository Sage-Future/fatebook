import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { getDateYYYYMMDD } from "../lib/_utils_common"
import { api } from '../lib/web/trpc'
import { invalidateQuestion, signInToFatebook, useUserId } from '../lib/web/utils'
import { CommentWithUser, QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"

export function CommentBox({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const addComment = api.question.addComment.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
      setLocalComment("")
    }
  })
  const [localComment, setLocalComment] = useState<string>("")

  const deleteQuestion = api.question.deleteQuestion.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      await utils.question.getForecastCountByDate.invalidate()
    }
  })
  const editQuestion = api.question.editQuestion.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    }
  })
  const router = useRouter()

  const submitComment = function(value: string) {
    if (addComment.isLoading) {
      return
    }

    addComment.mutate({
      questionId: question.id,
      comment: value,
    })
  }

  return <div className='pb-4'>
    {!userId && <div className="flex w-full p-4">
      <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
        Sign in to add your own prediction
      </button>
    </div>}
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submitComment(e.currentTarget.value)
      }}
    >
      <div className='grow relative'>
        <TextareaAutosize
          className={clsx(
            "shadow-sm py-2 px-4 focus:border-indigo-500 block w-full border-2 border-slate-300 rounded-md p-4 resize-none disabled:opacity-25 disabled:bg-slate-100",
            "pr-11 max-sm:text-lg"
          )}
          placeholder={`Add a comment...`}
          disabled={addComment.isLoading || !userId}
          value={localComment}
          onChange={(e) => {
            setLocalComment(e.target.value)
          }}
          inputMode='search'
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              if (e.currentTarget.value.trim() !== "") {
                submitComment(e.currentTarget.value)
              }
              e.preventDefault()
            }
          }} />
        {localComment && <button
          className={clsx(
            'btn btn-xs absolute right-3 bottom-2 max-sm:bottom-3 hover:opacity-100 min-h-[25px]'
          )}
          disabled={addComment.isLoading || !userId || localComment.trim() === ""}
          onClick={(e) => {
            e.preventDefault()
            submitComment(localComment)
          }}
        >
          <PaperAirplaneIcon height={14} width={14} />
        </button>}
      </div>
      {userId === question.userId && <div className="dropdown dropdown-end not-prose">
        <label tabIndex={0} className="btn btn-xs btn-ghost"><EllipsisVerticalIcon height={15} /></label>
        <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><a
            onClick={() => {
              const newTitle = prompt("Edit the title of your question:", question.title)
              if (newTitle && newTitle !== question.title) {
                editQuestion.mutate({
                  questionId: question.id,
                  title: newTitle
                })
              }
            }}
          >Edit question</a></li>
          <li><a
            onClick={() => {
              const newDateStr = prompt("Edit the resolution date of your question (YYYY-MM-DD):", getDateYYYYMMDD(question.resolveBy))
              const newDate = newDateStr ? new Date(newDateStr) : undefined
              if (newDate && newDate !== question.resolveBy) {
                editQuestion.mutate({
                  questionId: question.id,
                  resolveBy: newDate,
                })
              }
            }}
          >Edit resolve by date</a></li>
          <li><a
            onClick={() => {
              if (confirm("Are you sure you want to delete this question? This cannot be undone")) {
                deleteQuestion.mutate({
                  questionId: question.id
                })
                if (router.asPath.startsWith("/q/")) {
                  void router.push("/")
                }
              }
            }}
          >Delete question</a></li>
        </ul>
      </div>}
    </form>
  </div>
}


export function DeleteCommentOverflow({
  question, comment
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments;
  comment: CommentWithUser;
}) {
  const userId = useUserId()

  const utils = api.useContext()
  const deleteComment = api.question.deleteComment.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    }
  })

  if (userId !== comment.userId) {
    return <></>
  }

  return (
    <div className="dropdown dropdown-end not-prose max-h-4">
      <label tabIndex={0} className="btn btn-xs btn-ghost pl-2"><EllipsisVerticalIcon height={15} /></label>
      <ul tabIndex={0} className="dropdown-content text-black z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
        <li><a
          onClick={() => {
            deleteComment.mutate({
              commentId: comment.id
            })
          }}
        >Delete comment</a></li>
      </ul>
    </div>
  )
}
