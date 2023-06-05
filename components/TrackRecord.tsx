import { ErrorBoundary } from 'react-error-boundary'
import { formatDecimalNicely, populateDetails } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { CalibrationChart } from "./CalibrationChart"

export function TrackRecord() {
  const userId = useUserId()
  const allScoresQuery = api.question.getQuestionScores.useQuery()
  const scoreDetails = allScoresQuery?.data && populateDetails(allScoresQuery?.data)

  if (!userId) return <></>

  return (
    <div className="max-w-xs prose flex flex-col">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <h2 className="select-none">Your track record</h2>
        <CalibrationChart />
        <div className="flex flex-col gap-4 pt-6">
          {[
            {details: scoreDetails?.recentDetails, title: "Last 3 months"},
            {details: scoreDetails?.overallDetails, title: "All time"},
          ].map(({details, title}) => (
            <div key={title} className="stats shadow">
              <div className="stat">
                <div className="stat-title">Brier score</div>
                <div className="stat-value">{
                  details?.brierScore ? formatDecimalNicely(details.brierScore, 2) : "..."
                }</div>
                <div className="stat-desc">{title}</div>
              </div>

              {<div className="stat">
                <div className="stat-title">Relative Brier</div>
                <div className="stat-value">{
                  details?.rBrierScore ? formatDecimalNicely(details.rBrierScore, 2) : "..."
                }</div>
                <div className="stat-desc">{title}</div>
              </div>}
            </div>
          ))}
        </div>
      </ErrorBoundary>

    </div>
  )
}