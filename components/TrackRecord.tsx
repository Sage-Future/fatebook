import {
  ChevronDownIcon,
  ChevronLeftIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid"
import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import GitHubCalendar from "react-github-contribution-calendar"
import {
  getDateYYYYMMDD,
  joinWithOr,
  populateDetails,
  showSignificantFigures,
} from "../lib/_utils_common"
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { CalibrationChart } from "./CalibrationChart"
import { TagsSelect } from "./questions/TagsSelect"
import { InfoButton } from "./ui/InfoButton"

export function TrackRecord({
  trackRecordUserId,
  className,
}: {
  trackRecordUserId: string
  className?: string
}) {
  const thisUserId = useUserId()

  const isThisUser = trackRecordUserId === thisUserId
  const router = useRouter()
  const showCollapseButton = router.pathname === "/"
  const [isCollapsed, setIsCollapsed] = useState(
    typeof window !== "undefined" && isThisUser
      ? JSON.parse(localStorage.getItem("isCollapsed") || "false")
      : false,
  )

  const userName = api.getUserInfo.useQuery(
    {
      userId: trackRecordUserId,
    },
    {
      enabled: !isThisUser,
    },
  )

  const [tags, setTags] = useState<string[]>([])
  const allScoresQuery = api.question.getQuestionScores.useQuery({
    userId: trackRecordUserId,
    tags: tags,
  })
  const scoreDetails =
    allScoresQuery?.data && populateDetails(allScoresQuery?.data)

  const percentileQ = api.question.getBrierScorePercentile.useQuery({
    userId: trackRecordUserId,
  })

  if (!trackRecordUserId) return <></>

  return (
    <div className={clsx("prose flex flex-col mx-auto w-full", className)}>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <h2 className="flex flex-row gap-2 justify-between select-none relative mb-4 w-full">
          <span>
            {isThisUser
              ? "Your track record"
              : userName.data?.name
                ? `${userName.data?.name}'s track record`
                : " "}
          </span>
          {showCollapseButton && (
            <button
              className="btn btn-ghost mr-4 text-neutral-400 hover:text-neutral-800"
              onClick={() => {
                setIsCollapsed(!isCollapsed)
                localStorage.setItem(
                  "isCollapsed",
                  JSON.stringify(!isCollapsed),
                )
              }}
            >
              {isCollapsed ? (
                <ChevronLeftIcon width={16} height={16} />
              ) : (
                <ChevronDownIcon width={16} height={16} />
              )}
            </button>
          )}
        </h2>
        {!isCollapsed && (
          <>
            <div className="text-sm pb-4 px-2">
              <TagsSelect
                tags={tags}
                setTags={(tags) => setTags(tags)}
                placeholder="Filter by tags..."
                allowCreation={false}
              />
            </div>
            <CalibrationChart tags={tags} userId={trackRecordUserId} />

            {isThisUser && (
              <div className="text-sm flex gap-2 text-neutral-500 text-center mx-auto">
                <Link
                  href="https://quantifiedintuitions.org/calibration"
                  target="_blank"
                >
                  <button className="btn">
                    <TrophyIcon
                      width={16}
                      height={16}
                      className="text-indigo-600"
                    />
                    Train your calibration skills
                  </button>
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-6">
              {[
                {
                  details: scoreDetails?.recentDetails,
                  title: "Last 3 months",
                },
                { details: scoreDetails?.overallDetails, title: "All time" },
              ].map(({ details, title }) => (
                <div key={title} className="stats shadow overflow-x-clip">
                  <div className="stat">
                    <div className="stat-title flex flex-row gap-0.5 md:gap-1">
                      Brier score
                      <InfoButton
                        tooltip="Lower is better! Calculated as 2x the average squared difference between your forecast and the outcome."
                        className="tooltip-bottom"
                      />
                    </div>
                    <div
                      className={clsx(
                        "stat-value",
                        !details?.brierScore && "text-neutral-500",
                      )}
                    >
                      {details?.brierScore
                        ? showSignificantFigures(details.brierScore, 2)
                        : "..."}
                    </div>
                    <div className="stat-desc">
                      {title}
                      {title === "All time" &&
                        percentileQ.data &&
                        percentileQ.data.absoluteScorePercentile !== null && (
                          <div className="ml-1 badge badge-sm badge-ghost bg-green-100 border-none">
                            {`Top ${Math.round(
                              (percentileQ.data.absoluteScorePercentile ||
                                0.01) * 100,
                            )}%`}
                          </div>
                        )}
                    </div>
                  </div>

                  {
                    <div className="stat">
                      <div className="stat-title flex flex-row gap-0.5 md:gap-1">
                        Relative Brier
                        <InfoButton
                          tooltip="Relative to the median of other forecasters' Brier scores on each question"
                          className="tooltip-left"
                        />
                      </div>
                      <div
                        className={clsx(
                          "stat-value",
                          !details?.rBrierScore && "text-neutral-500",
                        )}
                      >
                        {details?.rBrierScore
                          ? showSignificantFigures(details.rBrierScore, 2)
                          : "..."}
                      </div>
                      <div className="stat-desc">
                        {title}
                        {title === "All time" &&
                          percentileQ.data &&
                          percentileQ.data.relativeScorePercentile && (
                            <div className="ml-1 badge badge-sm badge-ghost bg-green-100 border-none">
                              {`Top ${Math.round(
                                percentileQ.data.relativeScorePercentile * 100,
                              )}%`}
                            </div>
                          )}
                      </div>
                    </div>
                  }
                </div>
              ))}
            </div>
            <ForecastsCalendarHeatmap tags={tags} userId={trackRecordUserId} />
          </>
        )}
      </ErrorBoundary>
    </div>
  )
}

export function ForecastsCalendarHeatmap({
  tags,
  userId,
}: {
  tags: string[]
  userId: string
}) {
  const forecasts = api.question.getForecastCountByDate.useQuery({
    tags: tags,
    userId,
  })
  const thisUserId = useUserId()

  return (
    <div className="pt-12">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <GitHubCalendar
          values={forecasts.data?.dateCounts || {}}
          panelColors={[
            "#f0f0f0", // background
            "#86efac", // count=1
            "#4ade80", // count=2
            "#22c55e", // count=3+
          ]}
          until={getDateYYYYMMDD(new Date())}
          monthLabelAttributes={{}}
          panelAttributes={{}}
          weekLabelAttributes={{}}
        />
        <div className="ml-3">
          {userId === thisUserId ? "You" : "They"}
          {"'ve made "}
          <span className="font-semibold">{forecasts.data?.total}</span>
          {" forecasts"}
          {tags.length > 0 &&
            ` tagged ${joinWithOr(tags.map((tag) => `"${tag}"`))}`}
        </div>
      </ErrorBoundary>
    </div>
  )
}
