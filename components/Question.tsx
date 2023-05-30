import clsx from "clsx"
import Link from "next/link"
import { useRef, useState } from "react"
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { getQuestionUrl } from "../pages/q/[id]"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { ResolveButton } from "./ResolveButton"
import { SharePopover } from "./SharePopover"
import { Username } from "./Username"

export function Question({
  question
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  return (
    <div className="grid grid-cols-1 gap-1 bg-white p-4 rounded-md" key={question.id}>
      <span className="col-span-2 flex gap-4 justify-between">
        <span className="font-semibold" key={`${question.id}title`}>
          <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
            {question.title}
          </Link>
        </span>
        <UpdateableLatestForecastDisplay question={question} />
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
    </div>
  )
}

function UpdateableLatestForecastDisplay({
  question,
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  const userId = useUserId()
  const latestForecast = question.forecasts.filter(f => f.userId === userId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )?.[0]

  const defaultVal = latestForecast?.forecast ? ((latestForecast.forecast as unknown as number) * 100).toString() : ""
  const [localForecast, setLocalForecast] = useState<string>(defaultVal)

  const utils = api.useContext()
  const addForecast = api.question.addForecast.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOn.invalidate()
      await utils.question.getQuestion.invalidate({questionId: question.id})
    }
  })

  const inputRef = useRef(null)

  function updateForecast(newForecastInput: string) {
    const newForecast = parseFloat(newForecastInput) / 100
    if (!isNaN(newForecast) && newForecast > 0 && newForecast < 1
      && (!latestForecast?.forecast || newForecast !== (latestForecast.forecast as unknown as number))
    ) {
      addForecast.mutate({
        questionId: question.id,
        forecast: newForecast,
      })
    }
  }

  return (
    <span
      className={clsx("font-bold text-2xl text-indigo-800 focus-within:ring-2 ring-indigo-800 ring-opacity-60 ring-offset-1 rounded-md",
                      addForecast.isLoading && "opacity-50")}
      onClick={() => {(inputRef.current as any)?.focus()}}
    >
      <input
        ref={inputRef}
        type="text"
        className={"pl-1 w-24 text-right rounded-md focus:outline-none bg-transparent"}
        value={localForecast}
        onChange={(e) => {
          setLocalForecast(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateForecast(e.currentTarget.value)
          }
        }}
        disabled={question.resolution !== null || addForecast.isLoading}
      />
      <span className="text-left">{"%"}</span>
    </span>
  )
}