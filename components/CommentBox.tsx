import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { api } from '../lib/web/trpc'
import { invalidateQuestion, useUserId } from '../lib/web/utils'
import { CommentWithUser, QuestionWithStandardIncludes } from "../prisma/additional"
import { useIsEmbedded } from '../lib/web/embed'

export function CommentBox({
  question
}: {
  question: QuestionWithStandardIncludes;
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
  const embedded = useIsEmbedded()

  const submitComment = function(value: string) {
    if (addComment.isLoading) {
      return
    }

    addComment.mutate({
      questionId: question.id,
      comment: value,
    })
  }

  return <div className=''>
    <form
      className='relative'
      onSubmit={(e) => {
        e.preventDefault()
        submitComment(e.currentTarget.value)
      }}
    >
      <TextareaAutosize
        className={clsx(
          "shadow-sm py-2 px-4 focus:border-indigo-500 outline-none block w-full border-2 border-neutral-300 rounded-md p-4 resize-none disabled:opacity-25 disabled:bg-neutral-100 pr-11 placeholder:text-neutral-400",
          !embedded && "max-sm:text-lg",
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
          'btn btn-xs absolute right-3 bottom-2 hover:opacity-100 min-h-[25px]',
          !embedded && "max-sm:bottom-3",
        )}
        disabled={addComment.isLoading || !userId || localComment.trim() === ""}
        onClick={(e) => {
          e.preventDefault()
          submitComment(localComment)
        }}
      >
        <PaperAirplaneIcon height={14} width={14} />
      </button>}
    </form>
  </div>
}


export function DeleteCommentOverflow({
  question, comment
}: {
  question: QuestionWithStandardIncludes
  comment: CommentWithUser
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
