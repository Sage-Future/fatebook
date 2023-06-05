import { api } from "../lib/web/trpc"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js"
import { Line } from "react-chartjs-2"
import { getChartJsParams } from "../lib/web/utils"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

export function CalibrationChart() {
  const bucketedForecastsQ = api.question.getBucketedForecasts.useQuery()

  if (!bucketedForecastsQ.data) return <></>

  const { buckets, bucketedForecasts } = bucketedForecastsQ.data
  const params = getChartJsParams(buckets, bucketedForecasts)

  return (
    <div>
      <Line data={params.data} width={500} height={500} options={{responsive: true}} />
    </div>
  )
}