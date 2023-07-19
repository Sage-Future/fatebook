import clsx from "clsx"
import { useRef, useState } from 'react'
import { useDebouncedCallback } from "use-debounce"
import { api } from "../lib/web/trpc"
import { invalidateQuestion, useUserId } from '../lib/web/utils'
import { QuestionWithStandardIncludes } from "../prisma/additional"

export function UpdateableLatestForecast({
  question,
  autoFocus,
}: {
  question: QuestionWithStandardIncludes
  autoFocus?: boolean
}) {
  const userId = useUserId()

  const forecasts = question.forecasts.filter(f => f.userId === userId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
  const latestForecast = (forecasts && forecasts.length > 0) ? forecasts?.[0] : null

  const defaultVal = latestForecast?.forecast ? (latestForecast.forecast.times(100).toString()).toString() : ""
  const [localForecast, setLocalForecast] = useState<string>(defaultVal)

  const utils = api.useContext()
  const addForecast = api.question.addForecast.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
      await utils.question.getForecastCountByDate.invalidate()
    }
  })

  const inputRef = useRef(null)

  function updateForecast(newForecastInput: string) {
    const newForecast = parseFloat(newForecastInput) / 100
    if (!isNaN(newForecast) && newForecast > 0 && newForecast <= 1
      && (!latestForecast?.forecast || newForecast !== (latestForecast.forecast as unknown as number))) {
      addForecast.mutate({
        questionId: question.id,
        forecast: newForecast,
      })
    }
  }

  const updateOrReset = (value: string) => {
    if (defaultVal !== value && value !== "") {
      updateForecast(value)
    } else if (value === "" || !value) {
      setLocalForecast(defaultVal)
    }
  }
  const updateOrResetDebounced = useDebouncedCallback(updateOrReset, 5000)

  if (question.resolution !== null && !latestForecast) return <span></span>

  const localForecastFloat = parseFloat(localForecast)

  return (
    <span
      className={clsx("mr-1.5 font-bold text-2xl h-min focus-within:ring-indigo-800 ring-neutral-300 px-1 py-0.5 rounded-md shrink-0 relative",
                      addForecast.isLoading && "opacity-50",
                      question.resolution === null ? "text-indigo-800 ring-2" : "text-neutral-600 ring-0")}
      onClick={(e) => {
        (inputRef.current as any)?.focus()
        if (question.resolution === null || addForecast.isLoading) {
          e.stopPropagation()
        }
      }}
    >
      {(question.resolution === null || latestForecast) && <>
        <div
          className={clsx(
            'h-full bg-indigo-700 absolute rounded-l pointer-events-none opacity-20 bg-gradient-to-br transition-all -mx-1 -my-0.5',
            localForecastFloat >= 100 && "rounded-r",
            question.resolution === null && "from-indigo-400 to-indigo-600",
            question.resolution !== null && "hidden",
          )}
          style={{
            width: `${Math.min(Math.max(localForecastFloat || 0, 0), 100)}%`,
          }}
        />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          autoComplete="off"
          inputMode="decimal"
          enterKeyHint="go"
          pattern="[0-9]*"
          className={"pl-1 w-16 text-right rounded-md focus:outline-none bg-transparent"}
          value={localForecast}
          placeholder="__"
          onChange={(e) => {
            setLocalForecast(e.target.value)

            // for mobile users - update forecast when they stop typing, e.g. if they pressed "done"
            updateOrResetDebounced(e.target.value)
          }}
          onClick={(e) => { e.stopPropagation() }} // prevent focus being lost by parent span onClick
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateForecast(e.currentTarget.value)
            }
          }}
          onBlur={(e) => updateOrReset(e.currentTarget.value)}
          disabled={question.resolution !== null || addForecast.isLoading || !userId} />
        <span className={"text-left"}>{"%"}</span>
      </>}
    </span>
  )
}
