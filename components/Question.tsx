import { Transition } from "@headlessui/react"
import {
  ChatBubbleOvalLeftIcon,
  ChevronDownIcon,
  PencilIcon,
  ReceiptPercentIcon,
  UserIcon,
} from "@heroicons/react/20/solid"
import clsx from "clsx"
import { motion } from "framer-motion"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { QuestionWithStandardIncludes } from "../prisma/additional"
import { QuestionDetails } from "./questions/QuestionDetails"
import { ResolveButton } from "./ResolveButton"
import { SharePopover } from "./SharePopover"
import { UpdateableLatestForecast } from "./UpdateableLatestForecast"
import { FormattedDate } from "./ui/FormattedDate"
import { Username } from "./ui/Username"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid"
import toast from "react-hot-toast"
import { getDateYYYYMMDD } from "../lib/_utils_common"
import { getQuestionUrl } from "../lib/web/question_url"
import { api } from "../lib/web/trpc"
import { invalidateQuestion, useUserId } from "../lib/web/utils"
import { InfoButton } from "./ui/InfoButton"
import { QuestionDetailsOption } from "./questions/QuestionDetailsOptions"

export function Question({
  question,
  alwaysExpand,
  startExpanded,
  zIndex,
  embedded,
  className,
}: {
  question: QuestionWithStandardIncludes
  alwaysExpand?: boolean
  startExpanded?: boolean
  zIndex?: number
  embedded?: boolean
  className?: string
}) {
  const [manuallyExpanded, setManuallyExpanded] =
    useState<boolean>(!!startExpanded)

  const utils = api.useContext()
  const editQuestion = api.question.editQuestion.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    },
  })
  const userId = useUserId()
  const editable = question.userId === userId

  let cumulativeForecast = undefined
  if (question.type === "MULTIPLE_CHOICE") {
    cumulativeForecast =
      question.options?.reduce((acc, option) => {
        const latestForecast = option.forecasts.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0]

        if (latestForecast && latestForecast.forecast) {
          return acc + latestForecast.forecast.toNumber()
        }

        return acc // If there's no forecast or it's undefined, just return the accumulator
      }, 0) ?? 0 // Use nullish coalescing operator to default to 0 if reduce returns undefined
  }

  const sortedOptions = useMemo(() => {
    if (question.type !== "MULTIPLE_CHOICE") {
      return []
    }
    return [...question.options!].sort((a, b) => {
      const aForecast = a.forecasts.find((f) => f.userId === userId)
      const bForecast = b.forecasts.find((f) => f.userId === userId)

      const aValue = aForecast ? aForecast.forecast.toNumber() : 0
      const bValue = bForecast ? bForecast.forecast.toNumber() : 0

      return bValue - aValue
    })
  }, [question.options, userId])

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={clsx(
          "transition-transform group",
          !embedded && "hover:scale-[1.01]",
          className,
        )}
        style={zIndex ? { zIndex } : undefined}
      >
        <div
          className={clsx(
            !embedded &&
              "outline-1 outline cursor-pointer rounded-md shadow-sm group-hover:shadow-md transition-all z-10",

            (manuallyExpanded || alwaysExpand) && "rounded-b-none",

            question.resolution
              ? "bg-neutral-50 outline-[#eceff5] bg-gradient-to-tl via-neutral-50 via-[30%] group-hover:via-[40%]"
              : "bg-white outline-neutral-200",

            question.resolution === "YES"
              ? "from-green-100"
              : question.resolution === "NO"
                ? "from-red-100"
                : question.resolution === "AMBIGUOUS"
                  ? "from-blue-100"
                  : "from-white",
          )}
          onClick={() => {
            if (!embedded) {
              setManuallyExpanded(!manuallyExpanded)
            }
          }}
        >
          <div
            className="grid grid-cols-[1fr_min-content_min-content] p-4 gap-2 relative"
            key={question.id}
          >
            <span className="col-span-3 flex gap-4 mb-1 justify-between">
              <span
                className={"font-semibold overflow-auto break-words"}
                key={`${question.id}title`}
              >
                <Link
                  href={getQuestionUrl(question)}
                  key={question.id}
                  target={embedded ? "_blank" : ""}
                  className={"no-underline hover:underline inline items-center"}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {question.title}
                  {embedded && (
                    <ArrowTopRightOnSquareIcon className="inline ml-2 h-3 w-3 text-neutral-600" />
                  )}
                </Link>
              </span>
              {question.type === "BINARY" && (
                <UpdateableLatestForecast
                  question={question}
                  autoFocus={alwaysExpand}
                  embedded={embedded}
                />
              )}
            </span>
            {question.type === "MULTIPLE_CHOICE" && (
              <div className="contents">
                {sortedOptions.map((option, index) => (
                  <QuestionDetailsOption
                    key={index}
                    option={option}
                    question={question}
                    autoFocus={alwaysExpand}
                    embedded={embedded}
                    cumulativeForecast={cumulativeForecast}
                  />
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 col-span-3">
              <span className="text-sm my-auto" key={`${question.id}author`}>
                <Username user={question.user} />
              </span>
              <SharePopover question={question} />
              {question.resolvedAt ? (
                <span
                  className="text-sm text-neutral-400 my-auto text-center max-sm:text-left [text-wrap:balanced]"
                  key={`${question.id}resolve`}
                >
                  <FormattedDate
                    prefix={
                      <span>
                        Resolved <br />
                      </span>
                    }
                    date={question.resolvedAt}
                  />
                </span>
              ) : (
                <button
                  className={clsx(
                    "rounded-md font-normal text-sm my-auto relative px-0.5 max-sm:text-left [text-wrap:balanced]",
                    editable &&
                      "hover:bg-neutral-100 transition-colors group/resolveBy",
                    question.resolveBy < new Date()
                      ? "text-indigo-300"
                      : "text-neutral-400",
                  )}
                  disabled={!editable}
                  onClick={(e) => {
                    e.stopPropagation()
                    const newDateStr = prompt(
                      "Edit the resolution date of your question (YYYY-MM-DD):",
                      getDateYYYYMMDD(question.resolveBy),
                    )
                    if (!newDateStr) return
                    const newDate = newDateStr
                      ? new Date(newDateStr)
                      : undefined
                    if (newDate && !isNaN(newDate.getTime())) {
                      editQuestion.mutate({
                        questionId: question.id,
                        resolveBy: newDate,
                      })
                    } else {
                      toast.error(
                        "The date you entered looks invalid. Please use YYYY-MM-DD format.\nE.g. 2024-09-30",
                        {
                          duration: 8000,
                        },
                      )
                    }
                  }}
                  key={`${question.id}resolve`}
                >
                  {question.resolveBy < new Date() ? (
                    <FormattedDate
                      className="[text-wrap:balanced]"
                      prefix={
                        <span className="font-semibold">
                          Ready to resolve
                          <br />
                        </span>
                      }
                      date={question.resolveBy}
                      postfix=""
                      currentDateShowToday={true}
                      includeTime={false}
                      capitalise={true}
                    />
                  ) : (
                    <span>
                      <span>
                        Resolves <br />
                      </span>
                      <FormattedDate
                        className="[text-wrap:balanced]"
                        date={question.resolveBy}
                        includeTime={false}
                      />
                    </span>
                  )}
                  <PencilIcon className="hidden group-hover/resolveBy:block absolute top-1/2 -translate-y-1/2 right-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                </button>
              )}
              {question.exclusiveAnswers && (
                <ResolveButton question={question} />
              )}
              <ActivityNumbers
                question={question}
                alwaysExpand={alwaysExpand}
                manuallyExpanded={manuallyExpanded}
                setManuallyExpanded={setManuallyExpanded}
              />
            </div>
          </div>
        </div>

        <Transition
          show={alwaysExpand || manuallyExpanded}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-98 translate-y-[-0.5rem]"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100 translate-y-0 "
          leaveTo="transform opacity-0 scale-98 translate-y-[-0.5rem]"
        >
          <QuestionDetails
            question={question}
            hideOthersForecastsIfSharedWithUser={alwaysExpand}
          />
        </Transition>
      </motion.div>
    </ErrorBoundary>
  )
}

export function ActivityNumbers({
  question,
  alwaysExpand,
  manuallyExpanded,
  setManuallyExpanded,
}: {
  question: QuestionWithStandardIncludes
  alwaysExpand: boolean | undefined
  manuallyExpanded: boolean
  setManuallyExpanded: (expanded: boolean) => void
}) {
  const forecasters = new Set(question.forecasts.map((f) => f.userId)).size
  const forecasts = question.forecasts?.length ?? 0
  const numComments =
    (question.comments?.length ?? 0) + (question.notes ? 1 : 0)

  return (
    <div
      className={`${question.exclusiveAnswers ? "col-span-full" : ""} flex flex-row gap-2 text-sm text-neutral-400 justify-end hover:md:underline items-center`}
      onClick={() => setManuallyExpanded(!manuallyExpanded)}
    >
      <InfoButton
        tooltip={`${forecasts} forecast${
          forecasts !== 1 ? "s" : ""
        }, ${forecasters} forecaster${
          forecasters !== 1 ? "s" : ""
        }, ${numComments} comment${numComments !== 1 ? "s" : ""}`}
        showInfoButton={false}
        className="flex gap-2"
      >
        <span>
          {forecasts} <ReceiptPercentIcon className="w-4 h-4 shrink-0 inline" />
        </span>
        <span>
          {forecasters} <UserIcon className="w-4 h-4 shrink-0 inline" />
        </span>
        <span>
          {numComments}{" "}
          <ChatBubbleOvalLeftIcon className="w-4 h-4 shrink-0 inline" />
        </span>
      </InfoButton>
      {!alwaysExpand && (
        <button className="button p-0">
          <ChevronDownIcon
            className={clsx(
              "h-5 w-5 transition-transform",
              !manuallyExpanded && "transform rotate-90",
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  )
}
