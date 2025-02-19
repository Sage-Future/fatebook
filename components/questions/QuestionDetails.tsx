import {
  EllipsisVerticalIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid"
import { Forecast, Resolution } from "@prisma/client"
import { useRouter } from "next/router"
import { Fragment, LegacyRef, ReactNode, forwardRef, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { toast } from "react-hot-toast"
import {
  displayForecast,
  forecastHiddenReasonText,
  forecastsAreHidden,
  formatDecimalNicely,
  getCommunityForecast,
  getDateYYYYMMDD,
} from "../../lib/_utils_common"
import { api } from "../../lib/web/trpc"
import {
  invalidateQuestion,
  signInToFatebook,
  useUserId,
} from "../../lib/web/utils"
import { QuestionWithStandardIncludes } from "../../prisma/additional"
import { FormattedDate } from "../ui/FormattedDate"
import { InfoButton } from "../ui/InfoButton"
import { PromptDialog } from "../ui/PromptDialog"
import { Username } from "../ui/Username"
import { CommentBox, DeleteCommentOverflow } from "./CommentBox"
import { TagsSelect } from "./TagsSelect"

interface QuestionDetailsProps {
  question: QuestionWithStandardIncludes
  hideOthersForecastsIfSharedWithUser?: boolean
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export const QuestionDetails = forwardRef(function QuestionDetails(
  { question, hideOthersForecastsIfSharedWithUser }: QuestionDetailsProps,
  ref: LegacyRef<HTMLDivElement>,
) {
  const userId = useUserId()
  const hideOthersForecasts =
    hideOthersForecastsIfSharedWithUser &&
    question.userId !== userId &&
    !question.resolution &&
    (question.forecasts.filter((f) => f.userId !== userId).length > 0 ||
      question.comments.filter((c) => c.userId !== userId).length > 0) &&
    !forecastsAreHidden(question, userId)
  const [showEvents, setShowEvents] = useState<boolean>(!hideOthersForecasts)

  const utils = api.useContext()
  const setTags = api.tags.setQuestionTags.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
      await utils.tags.getAll.invalidate()
    },
  })

  return (
    <div
      className="bg-neutral-100 border-[1px] px-8 py-4 text-sm flex flex-col gap-4 rounded-b-md shadow-sm group-hover:shadow-md"
      onClick={(e) => e.stopPropagation()}
      ref={ref}
    >
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        {!userId && (
          <div className="flex w-full p-4">
            <button
              className="button primary mx-auto"
              onClick={() => void signInToFatebook()}
            >
              Sign in to add your own prediction
            </button>
          </div>
        )}

        {userId && (
          <div className="flex gap-2">
            <div className="grow">
              <TagsSelect
                disabled={!userId}
                tags={question.tags.map((t) => t.name)}
                setTags={(tags) => {
                  setTags.mutate({
                    questionId: question.id,
                    tags,
                  })
                }}
              />
            </div>
            {userId && userId === question.userId && (
              <EditQuestionOverflow question={question} />
            )}
          </div>
        )}
        {forecastsAreHidden(question, userId) && (
          <div className="mt-2 mb-2 text-sm text-neutral-600 font-semibold flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-md border border-indigo-100">
            <InformationCircleIcon className="w-6 h-6 text-indigo-600" />
            {`Other users' forecasts are hidden ${forecastHiddenReasonText(
              question,
            )} to reduce anchoring.`}
          </div>
        )}
        {showEvents ? (
          <EventsLog question={question} />
        ) : (
          <button className="btn mx-auto" onClick={() => setShowEvents(true)}>
            See forecasts and comments
          </button>
        )}
        <CommentBox question={question} />
      </ErrorBoundary>
    </div>
  )
})

function EventsLog({ question }: { question: QuestionWithStandardIncludes }) {
  const userId = useUserId()

  function getExclusiveMcqResolutionString(
    question: QuestionWithStandardIncludes,
  ) {
    if (question.resolution === Resolution.NO) {
      return '"Other"'
    }
    const option = question.options?.find((opt) => opt.resolution === "YES")
    return option ? `"${option.text}"` : question.resolution
  }

  function forecastElement(forecast: Forecast) {
    if (forecastsAreHidden(question, userId)) {
      return (
        <InfoButton
          tooltip={`This forecast is hidden ${forecastHiddenReasonText(question)}`}
          showInfoButton={false}
        >
          <span className="font-bold text-lg text-indigo-800 opacity-70">
            {displayForecast(forecast, 2)}
          </span>
        </InfoButton>
      )
    } else {
      return (
        <span className="font-bold text-lg text-indigo-800">
          {displayForecast(forecast, 2)}
        </span>
      )
    }
  }

  const forecastEvents: { timestamp: Date; el: ReactNode }[] =
    question.type === "MULTIPLE_CHOICE"
      ? question
          .options!.map((o) =>
            o.forecasts.map((f) => ({
              timestamp: f.createdAt || new Date(),
              el: (
                <Fragment key={f.id}>
                  <Username user={f.user} className="font-semibold" />
                  <span className="font-bold overflow-x-auto">{o.text}</span>
                  {forecastElement(f)}
                  <div className="text-neutral-400">
                    <FormattedDate date={f.createdAt || new Date()} />
                  </div>
                </Fragment>
              ),
            })),
          )
          .flat()
      : question.forecasts.map((f) => ({
          timestamp: f.createdAt,
          el: (
            <Fragment key={f.id}>
              <Username
                user={f.user}
                className="font-semibold"
                unknownUserReason={
                  forecastsAreHidden(question, userId)
                    ? `This forecast is hidden ${forecastHiddenReasonText(question)}`
                    : undefined
                }
              />
              <span />
              {forecastElement(f)}
              <div className="text-neutral-400">
                <FormattedDate date={f.createdAt} />
              </div>
            </Fragment>
          ),
        }))

  let events: { timestamp: Date; el: ReactNode }[] = [
    forecastEvents,
    question.comments &&
      question.comments.map((c) => ({
        timestamp: c.createdAt,
        el: (
          <Fragment key={c.id}>
            <span>
              <Username user={c.user} className="font-semibold" />
            </span>
            <span />
            <span />
            <span className="text-neutral-400 inline-flex justify-between w-full">
              <FormattedDate date={c.createdAt} className="my-auto" />
              <DeleteCommentOverflow question={question} comment={c} />
            </span>
            <span className="md:pl-7 col-span-4 -mt-1 min-w-0 whitespace-pre-line">
              {c.comment}
            </span>
          </Fragment>
        ),
      })),
    [
      ...(question.notes
        ? [
            {
              timestamp: question.createdAt,
              el: (
                <Fragment key={`${question.id} note`}>
                  <span>
                    <Username user={question.user} className="font-semibold" />
                  </span>
                  <span />
                  <span />

                  <span className="text-neutral-400">
                    <FormattedDate date={question.createdAt} />
                  </span>
                  <span className="md:pl-7 col-span-4 -mt-1">
                    {question.notes}
                  </span>
                </Fragment>
              ),
            },
          ]
        : []),
    ],
    [
      ...(question.resolvedAt &&
      (question.type === "BINARY" ||
        (question.type === "MULTIPLE_CHOICE" &&
          question.exclusiveAnswers &&
          question.options))
        ? [
            {
              timestamp: question.resolvedAt,
              el: (
                <Fragment key={`${question.id} resolution`}>
                  <Username user={question.user} className="font-semibold" />
                  <span />
                  <span className="italic text-indigo-800 overflow-x-auto">
                    Resolved{" "}
                    {question.type === "MULTIPLE_CHOICE" && question.options
                      ? getExclusiveMcqResolutionString(question)
                      : question.resolution}
                  </span>
                  <span className="text-neutral-400">
                    <FormattedDate date={question.resolvedAt} />
                  </span>
                </Fragment>
              ),
            },
          ]
        : []),
    ],
    ...(question.options &&
    question.type === "MULTIPLE_CHOICE" &&
    !question.exclusiveAnswers
      ? question.options
          .filter((option) => option.resolvedAt)
          .map((option) => ({
            timestamp: option.resolvedAt!,
            el: (
              <Fragment key={`${question.id}-${option.id}-resolution`}>
                <span>
                  <Username user={question.user} className="font-semibold" />
                </span>
                <span />
                <span className="italic text-indigo-800 overflow-x-auto">
                  Resolved &ldquo;{option.text}&rdquo;{" "}
                  {option.resolution ? option.resolution : "unknown"}
                </span>
                <span className="text-neutral-400">
                  <FormattedDate date={option.resolvedAt!} />
                </span>
              </Fragment>
            ),
          }))
      : []),
  ].flat()

  const numForecasters = new Set(question.forecasts.map((f) => f.userId)).size
  const communityAverage =
    question.type === "BINARY" &&
    !forecastsAreHidden(question, userId) &&
    numForecasters > 1 &&
    getCommunityForecast(question, new Date())

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="grid grid-cols-[minmax(80px,_auto)_minmax(0,_300px)_auto_auto] gap-2 items-center max-h-[48vh] overflow-y-auto showScrollbar">
        {events.length ? (
          events
            .sort(
              (a, b) => a.timestamp.getTime() - b.timestamp.getTime(), // chronological
            )
            .map((event) => event?.el)
        ) : (
          <span className="text-sm text-neutral-400 italic select-none md:ml-4">
            No forecasts yet
          </span>
        )}
      </div>
      {communityAverage !== false && (
        <div className="mx-auto flex gap-2 items-center">
          <span className="font-semibold">Community:</span>
          <span className="font-bold text-xl text-indigo-800">
            {formatDecimalNicely(communityAverage * 100, 1)}%
          </span>
          <InfoButton tooltip="The geometric mean of odds of all forecasters' latest predictions" />
        </div>
      )}
    </ErrorBoundary>
  )
}

function EditQuestionOverflow({
  question,
}: {
  question: QuestionWithStandardIncludes
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [editTitleDialogOpen, setEditTitleDialogOpen] = useState(false)
  const [editDateDialogOpen, setEditDateDialogOpen] = useState(false)
  const utils = api.useContext()
  const router = useRouter()

  const deleteQuestion = api.question.deleteQuestion.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      await utils.question.getForecastCountByDate.invalidate()
    },
  })
  const editQuestion = api.question.editQuestion.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    },
  })

  return (
    <>
      <div className="dropdown dropdown-end not-prose">
        <label
          tabIndex={0}
          className="btn btn-xs btn-ghost"
          onClick={() => setIsVisible(!isVisible)}
        >
          <EllipsisVerticalIcon height={15} />
        </label>
        {isVisible && (
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a onClick={() => setEditTitleDialogOpen(true)}>Edit question</a>
            </li>
            <li>
              <a onClick={() => setEditDateDialogOpen(true)}>
                Edit resolve by date
              </a>
            </li>
            <li>
              <a
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete this question? This cannot be undone",
                    )
                  ) {
                    deleteQuestion.mutate({
                      questionId: question.id,
                    })
                    if (router.asPath.startsWith("/q/")) {
                      void router.push("/")
                    }
                  }
                }}
              >
                Delete question
              </a>
            </li>
          </ul>
        )}
      </div>

      <PromptDialog
        isOpen={editTitleDialogOpen}
        onClose={() => setEditTitleDialogOpen(false)}
        title="Edit question"
        description="Update the title of your question"
        defaultValue={question.title}
        submitLabel="Save"
        onSubmit={(newTitle) => {
          if (newTitle && newTitle !== question.title) {
            editQuestion.mutate({
              questionId: question.id,
              title: newTitle,
            })
          }
        }}
      />

      <PromptDialog
        isOpen={editDateDialogOpen}
        onClose={() => setEditDateDialogOpen(false)}
        title="Edit resolution date"
        description="When should I remind you to resolve this question?"
        defaultValue={getDateYYYYMMDD(question.resolveBy)}
        type="date"
        submitLabel="Save"
        onSubmit={(newDateStr) => {
          const newDate = newDateStr ? new Date(newDateStr) : undefined
          if (newDate && !isNaN(newDate.getTime())) {
            editQuestion.mutate({
              questionId: question.id,
              resolveBy: newDate,
            })
          } else {
            const year = new Date(
              Date.now() + 1000 * 60 * 60 * 24 * 90,
            ).getFullYear() // 90 days from now
            toast.error(
              `The date you entered looks invalid. Please use YYYY-MM-DD format.\nE.g. ${year}-09-30`,
              {
                duration: 8000,
              },
            )
          }
        }}
      />
    </>
  )
}
