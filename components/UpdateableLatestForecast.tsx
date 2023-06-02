import clsx from "clsx"
import { useRef, useState } from 'react'
import { useUserId } from "../lib/web/utils"
import { api } from "../lib/web/trpc"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../prisma/additional"

export function UpdateableLatestForecast({
  question,
  autoFocus,
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
  autoFocus?: boolean
}) {
  const userId = useUserId()
  const latestForecast = question.forecasts.filter(f => f.userId === userId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )?.[0]

  const defaultVal = latestForecast?.forecast ? (latestForecast.forecast.times(100).toString()).toString() : ""
  const [localForecast, setLocalForecast] = useState<string>(defaultVal)

  const utils = api.useContext()
  const addForecast = api.question.addForecast.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOn.invalidate()
      await utils.question.getQuestion.invalidate({ questionId: question.id })
    }
  })

  const inputRef = useRef(null)

  function updateForecast(newForecastInput: string) {
    const newForecast = parseFloat(newForecastInput) / 100
    if (!isNaN(newForecast) && newForecast > 0 && newForecast < 1
      && (!latestForecast?.forecast || newForecast !== (latestForecast.forecast as unknown as number))) {
      addForecast.mutate({
        questionId: question.id,
        forecast: newForecast,
      })
    }
  }

  if (question.resolution !== null && !latestForecast) return <span></span>

  return (
    <span
      className={clsx("mr-1.5 font-bold text-2xl h-min focus-within:ring-indigo-800 ring-gray-300 px-1 py-0.5 rounded-md shrink-0",
                      addForecast.isLoading && "opacity-50",
                      question.resolution === null ? "text-indigo-800 ring-2" : "text-gray-600 ring-0")}
      onClick={() => { (inputRef.current as any)?.focus() }}
    >
      {(question.resolution === null || latestForecast) && <>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          className={"pl-1 w-16 text-right rounded-md focus:outline-none bg-transparent"}
          value={localForecast}
          placeholder="__"
          onChange={(e) => {
            setLocalForecast(e.target.value)
          }}
          onClick={(e) => { e.stopPropagation() }} // prevent focus being lost by parent span onClick
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateForecast(e.currentTarget.value)
            }
          }}
          onBlur={(e) => {
            (defaultVal !== e.currentTarget.value) && updateForecast(e.currentTarget.value)
          }}
          disabled={question.resolution !== null || addForecast.isLoading} />
        <span className={"text-left"}>{"%"}</span>
      </>}
    </span>
  )
}
