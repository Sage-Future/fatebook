import { Forecast, QuestionOption } from "@prisma/client"
import clsx from "clsx"
import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  displayForecast,
  formatDecimalNicely,
  getMostRecentForecastForUser,
} from "../../lib/_utils_common"
import { sendToHost } from "../../lib/web/embed"
import { api } from "../../lib/web/trpc"
import { invalidateQuestion, useUserId } from "../../lib/web/utils"
import { QuestionWithStandardIncludes } from "../../prisma/additional"
import { useDebouncedCallback } from "use-debounce"

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
  small,
  showErrorMessage = false,
}: {
  question: QuestionWithStandardIncludes
  autoFocus?: boolean
  embedded?: boolean
  option?: QuestionOption & { forecasts: Forecast[] } // TODO: fix this type
  cumulativeForecast?: number
  small?: boolean
  showErrorMessage?: boolean
}) {
  const userId = useUserId()
  const hasResolution =
    (option && option.resolution !== null) || question.resolution !== null

  const latestForecast = userId
    ? getMostRecentForecastForUser(option ? option : question, userId)
    : null

  const defaultVal = latestForecast?.forecast
    ? displayForecast(latestForecast, 10, false)
    : ""
  const [localForecast, setLocalForecast] = useState<string>(defaultVal)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const lastUpdateTime = useRef(0)

  const utils = api.useContext()
  const addForecast = api.question.addForecast.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
      await utils.question.getForecastCountByDate.invalidate()
    },
  })

  const inputRef = useRef(null)

  const checkForErrors = useCallback(
    (newForecast: number) => {
      if (isNaN(newForecast) || newForecast < 0 || newForecast > 1) {
        setErrorMessage("Must be 0-100%")
        return true
      }

      if (question.exclusiveAnswers && cumulativeForecast !== undefined) {
        const currentForecast = latestForecast
          ? Number(latestForecast.forecast)
          : 0
        const newCumulativeForecast =
          cumulativeForecast - currentForecast + newForecast
        if (newCumulativeForecast > 1) {
          setErrorMessage(
            `Sum must be ≤100% (currently ${formatDecimalNicely(
              newCumulativeForecast * 100,
              0,
            )}%)`,
          )
          return true
        }
      }

      setErrorMessage(null)
      return false
    },
    [cumulativeForecast, latestForecast, question.exclusiveAnswers],
  )

  const updateForecast = useCallback(
    (newForecastInput: string) => {
      closeLinkPopup() // closes the gdoc popover if embedded

      const newForecast = parseFloat(newForecastInput) / 100
      if (checkForErrors(newForecast)) {
        return
      }

      setErrorMessage(null)

      if (
        !latestForecast?.forecast ||
        newForecast !== latestForecast.forecast.toNumber()
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
    },
    [
      checkForErrors,
      latestForecast,
      embedded,
      addForecast,
      question.id,
      option?.id,
    ],
  )

  const updateOrReset = useCallback((value: string) => {
    const now = Date.now()
    if (now - lastUpdateTime.current < 2000) return
    lastUpdateTime.current = now

    if (defaultVal !== value && value !== "") {
      updateForecast(value)
    } else if (value === "" || !value) {
      setLocalForecast(defaultVal)
    }
  }, [defaultVal, updateForecast])

  const updateOrResetDebounced = useDebouncedCallback(updateOrReset, 5000)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
  }, [])

  useEffect(() => {
    if (
      document.activeElement?.tagName !== "INPUT" &&
      errorMessage?.toLowerCase().includes("sum must be") &&
      cumulativeForecast !== undefined
    ) {
      const newForecast = parseFloat(localForecast) / 100
      if (!checkForErrors(newForecast)) {
        updateForecast(localForecast)
      }
    }
  }, [
    checkForErrors,
    cumulativeForecast,
    errorMessage,
    localForecast,
    updateForecast,
  ])

  if (hasResolution && !latestForecast) return <span></span>

  const localForecastFloat = parseFloat(localForecast)

  return (
    <>
      <span
        className={clsx(
          "mr-0.5 font-bold h-min hover:ring-neutral-400 focus-within:ring-indigo-800 hover:focus-within:ring-indigo-800 ring-neutral-300 px-1 py-0.5 rounded-md shrink-0 relative flex transition-all",
          addForecast.isLoading && "opacity-50",
          hasResolution ? "text-neutral-600 ring-0" : "text-indigo-800 ring-2",
          errorMessage &&
            "ring-red-500 focus-within:ring-red-500 hover:ring-red-500 hover:focus-within:ring-red-500",
          small ? "text-xl" : "text-2xl",
        )}
        onClick={(e) => {
          ;(inputRef.current as any)?.focus()
          if (question.resolution === null || addForecast.isLoading) {
            e.stopPropagation()
          }
        }}
      >
        {(!hasResolution || latestForecast) && (
          <>
            <div
              className={clsx(
                "h-full bg-indigo-700 absolute rounded-l pointer-events-none opacity-20 bg-gradient-to-br transition-all -mx-1 -my-0.5",
                localForecastFloat >= 100 && "rounded-r",
                !hasResolution && "from-indigo-400 to-indigo-600",
                hasResolution && "hidden",
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
                "pl-1 w-16 text-right focus:outline-none bg-transparent"
              }
              value={localForecast}
              placeholder="__"
              onChange={(e) => {
                setLocalForecast(e.target.value)
                setErrorMessage(null)
                e.target.value &&
                  checkForErrors(parseFloat(e.target.value) / 100)
                
                if (isIOS) {
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
                if (e.key === "Escape") {
                  setLocalForecast(defaultVal)
                  checkForErrors(parseFloat(defaultVal) / 100)
                }
              }}
              onBlur={(e) => {
                if (!isIOS) {
                  updateOrReset(e.currentTarget.value)
                }
              }}
              disabled={hasResolution || addForecast.isLoading || !userId}
            />
            <span className={"text-left"}>{"%"}</span>
          </>
        )}
      </span>
      {errorMessage && showErrorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute right-2 mt-1 text-red-500 text-xs"
        >
          {errorMessage}
        </motion.div>
      )}
    </>
  )
}
