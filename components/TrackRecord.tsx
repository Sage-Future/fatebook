import clsx from 'clsx'
import { ErrorBoundary } from 'react-error-boundary'
import GitHubCalendar from 'react-github-contribution-calendar'
import { getDateYYYYMMDD, populateDetails, showSignificantFigures } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { CalibrationChart } from "./CalibrationChart"
import { InfoButton } from './InfoButton'

// import 'react-github-contribution-calendar/default.css'

export function TrackRecord() {
  const userId = useUserId()
  const allScoresQuery = api.question.getQuestionScores.useQuery()
  const scoreDetails = allScoresQuery?.data && populateDetails(allScoresQuery?.data)

  if (!userId) return <></>

  return (
    <div className="max-w-xs prose flex flex-col mx-auto">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <h2 className="select-none">Your track record</h2>
        <CalibrationChart />
        <div className="flex flex-col gap-4 pt-6">
          {[
            {details: scoreDetails?.recentDetails, title: "Last 3 months"},
            {details: scoreDetails?.overallDetails, title: "All time"},
          ].map(({details, title}) => (
            <div key={title} className="stats shadow overflow-x-clip">
              <div className="stat">
                <div className="stat-title flex flex-row gap-0.5 md:gap-1">
                  Brier score
                  <InfoButton tooltip="Lower is better!" className='tooltip-bottom' />
                </div>
                <div
                  className={clsx(
                    "stat-value",
                    !details?.brierScore && "text-neutral-500"
                  )}>{
                    details?.brierScore ? showSignificantFigures(details.brierScore, 2) : "..."
                  }</div>
                <div className="stat-desc">{title}</div>
              </div>

              {<div className="stat">
                <div className="stat-title flex flex-row gap-0.5 md:gap-1">
                  Relative Brier
                  <InfoButton tooltip="Relative to the median on each question" className='tooltip-left' />
                </div>
                <div
                  className={clsx(
                    "stat-value",
                    !details?.rBrierScore && "text-neutral-500"
                  )}>{
                    details?.rBrierScore ? showSignificantFigures(details.rBrierScore, 2) : "..."
                  }</div>
                <div className="stat-desc">{title}</div>
              </div>}

            </div>
          ))}
        </div>
        <ForecastsCalendarHeatmap />
      </ErrorBoundary>

    </div>
  )
}

export function ForecastsCalendarHeatmap() {
  const forecasts = api.question.getForecastCountByDate.useQuery(undefined)

  return (
    <div className="pt-12">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <GitHubCalendar
          values={forecasts.data?.dateCounts || {}}
          panelColors={[
            '#f0f0f0', // background
            '#86efac', // count=1
            '#4ade80', // count=2
            '#22c55e'  // count=3+
          ]}
          until={getDateYYYYMMDD(new Date())}
          monthLabelAttributes={{}}
          panelAttributes={{}}
          weekLabelAttributes={{}}
        />
        <span className='ml-3'>{"You've made"} <span className='font-semibold'>{forecasts.data?.total}</span> forecasts</span>
      </ErrorBoundary>
    </div>
  )
}