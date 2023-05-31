import Image from "next/image"
import { formatDecimalNicely, populateDetails } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"

export function TrackRecord() {
  const userId = useUserId()
  const allScoresQuery = api.question.getQuestionScores.useQuery()
  const scoreDetails = allScoresQuery?.data && populateDetails(allScoresQuery?.data)

  if (!userId || !scoreDetails) return <></>

  const { overallDetails, recentDetails } = scoreDetails

  return (
    <div className="max-w-xs prose">
      <h2>Your track record</h2>
      <Image src={`/api/calibration_graph?user=${userId}`} width={400} height={400} alt="Your calibration chart" />
      {[
        {details: recentDetails, title: "Last three months"},
        {details: overallDetails, title: "All time score"},
      ].map(({details, title}) => (
        <div key={title} className="prose-sm p-6">
          <h4 className="mb-0">{title}</h4>
          <div className="flex flex-row gap-2 justify-between">
            <p>
              <span className="font-bold pr-1">Brier score</span> {formatDecimalNicely(details.brierScore, 2)}
            </p>
            <p>
              <span className="font-bold pr-1">Relative Brier</span>
              {details.rBrierScore ? formatDecimalNicely(details.rBrierScore, 2) : "..."}
            </p>
          </div>
        </div>
      ))}

    </div>
  )
}