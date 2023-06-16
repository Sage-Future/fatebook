import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid"
import { ArcElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from "chart.js"
import clsx from "clsx"
import { useState } from "react"
import { Line } from "react-chartjs-2"
import { api } from "../lib/web/trpc"
import { getChartJsParams } from "../lib/web/utils"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

export function CalibrationChart() {
  const bucketedForecastsQ = api.question.getBucketedForecasts.useQuery()
  const [hovered, setHovered] = useState(false)

  if (!bucketedForecastsQ.data) return <></>

  const { buckets, bucketedForecasts } = bucketedForecastsQ.data
  const params = getChartJsParams(buckets, bucketedForecasts, true, !hovered)

  return (
    <div className="mr-4 relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Line data={params.data} width={450} height={450}
        // @ts-ignore
        options={{responsive: true, animation: false, ...params.options }}
      />
      <button
        className={"btn btn-ghost btn-xs absolute bottom-4 left-2"}
        onClick={() => setHovered(!hovered)}>
        <QuestionMarkCircleIcon height={20} className={clsx(hovered && "fill-indigo-700")} />
      </button>
    </div>
  )
}