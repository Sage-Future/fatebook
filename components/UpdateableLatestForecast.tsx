import clsx from "clsx"
import { useRef, useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import {
  displayForecast,
  getMostRecentForecastForUser,
} from "../lib/_utils_common"
import { sendToHost } from "../lib/web/embed"
import { api } from "../lib/web/trpc"
import { invalidateQuestion, useUserId } from "../lib/web/utils"
import { QuestionWithStandardIncludes } from "../prisma/additional"
import { Forecast, QuestionOption } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

function closeLinkPopup() {
  sendToHost("close_link_popup")
}

function elicitSuccess() {
  sendToHost("prediction_elicit_success")
}

export function UpdateableLatestForecast({
  question,
  autoFocus,
  embedded,
  option,
  cumulativeForecast,
}: {
  question: QuestionWithStandardIncludes
  autoFocus?: boolean
  embedded?: boolean
  option?: QuestionOption & { forecasts: Forecast[] } // TODO: fix this type
  cumulativeForecast?: number
}) {
  const userId = useUserId()

  let latestForecast: {
    forecast: Decimal
    createdAt: Date
    userId: string
  } | null

  if (userId) {
    latestForecast = getMostRecentForecastForUser(
      option ? option : question,
      userId,
    )
  } else {
    latestForecast = null
  }

  const defaultVal = latestForecast?.forecast
    ? displayForecast(latestForecast, 10, false)
    : ""
  const [localForecast, setLocalForecast] = useState<string>(defaultVal)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const utils = api.useContext()
  const addForecast = api.question.addForecast.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
      await utils.question.getForecastCountByDate.invalidate()
    },
  })

  const inputRef = useRef(null)

  function updateForecast(newForecastInput: string) {
    closeLinkPopup() // closes the gdoc popover if embedded

    const newForecast = parseFloat(newForecastInput) / 100
    if (isNaN(newForecast) || newForecast <= 0 || newForecast > 1) {
      setErrorMessage("Please enter a valid probability between 0 and 100.")
      return
    }

    if (question.exclusiveAnswers && cumulativeForecast !== undefined) {
      const currentForecast = latestForecast
        ? Number(latestForecast.forecast)
        : 0
      const newCumulativeForecast =
        cumulativeForecast - currentForecast + newForecast
      if (newCumulativeForecast > 1) {
        setErrorMessage(
          "The sum of probabilities for exclusive answers cannot exceed 100%.",
        )
        return
      }
    }

    setErrorMessage(null)

    if (
      !latestForecast?.forecast ||
      newForecast !== (latestForecast.forecast as unknown as number)
    ) {
      if (embedded) {
        elicitSuccess()
      }

      addForecast.mutate({
        questionId: question.id,
        forecast: newForecast,
        optionId: option?.id ?? undefined,
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
    <>
      <span
        className={clsx(
          "mr-1.5 font-bold text-2xl h-min focus-within:ring-indigo-800 ring-neutral-300 px-1 py-0.5 rounded-md shrink-0 relative flex",
          addForecast.isLoading && "opacity-50",
          question.resolution === null
            ? "text-indigo-800 ring-2"
            : "text-neutral-600 ring-0",
        )}
        onClick={(e) => {
          ;(inputRef.current as any)?.focus()
          if (question.resolution === null || addForecast.isLoading) {
            e.stopPropagation()
          }
        }}
      >
        {(question.resolution === null || latestForecast) && (
          <>
            <div
              className={clsx(
                "h-full bg-indigo-700 absolute rounded-l pointer-events-none opacity-20 bg-gradient-to-br transition-all -mx-1 -my-0.5",
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
              className={
                "pl-1 w-16 text-right rounded-md focus:outline-none bg-transparent"
              }
              value={localForecast}
              placeholder="__"
              onChange={(e) => {
                setLocalForecast(e.target.value)
                setErrorMessage(null)

                // for iOS users - update forecast when they stop typing, e.g. if they pressed "done"
                if (
                  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                  !(window as any).MSStream
                ) {
                  updateOrResetDebounced(e.target.value)
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
              }} // prevent focus being lost by parent span onClick
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateForecast(e.currentTarget.value)
                }
              }}
              onBlur={(e) => updateOrReset(e.currentTarget.value)}
              disabled={
                question.resolution !== null || addForecast.isLoading || !userId
              }
            />
            <span className={"text-left"}>{"%"}</span>
          </>
        )}
      </span>
      {errorMessage && (
        <div className="absolute left-0 mt-1 text-red-500 text-sm">
          {errorMessage}
        </div>
      )}
    </>
  )
}
