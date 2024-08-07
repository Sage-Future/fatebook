import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid"
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js"
import clsx from "clsx"
import { useRef, useState } from "react"
import { Line, getElementAtEvent } from "react-chartjs-2"
import { api } from "../lib/web/trpc"
import { getChartJsParams, useUserId } from "../lib/web/utils"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
)

export function CalibrationChart({
  tags,
  userId,
}: {
  tags: string[]
  userId: string
}) {
  const thisUserId = useUserId()

  const bucketedForecastsQ = api.question.getBucketedForecasts.useQuery({
    userId: userId,
    tags: tags,
  })
  const [hovered, setHovered] = useState(false)
  const chartRef = useRef()

  if (!bucketedForecastsQ.data) return <div className="min-h-[331px]"></div>

  const { buckets, bucketedForecasts } = bucketedForecastsQ.data
  const params = getChartJsParams(
    buckets,
    bucketedForecasts,
    true,
    !(
      // don't hide the titles on touchscreens, which have no hover
      // `'ontouchstart' in document.documentElement` can have false positives,
      // but that's OK in this case
      hovered || 'ontouchstart' in document.documentElement
    ),
    thisUserId === userId,
  )

  return (
    <div
      className="mr-4 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Line
        data={params.data}
        width={450}
        height={490}
        // @ts-ignore
        options={{ responsive: true, animation: false, ...params.options }}
        plugins={[
          {
            id: "addPaddingBelowLegend",
            beforeInit(chart: any) {
              const originalFit = chart.legend.fit

              chart.legend.fit = function fit() {
                originalFit.bind(chart.legend)()
                this.height += 10 // px padding
              }
            },
          },
        ]}
        ref={chartRef}
        onClick={(event) => {
          chartRef.current &&
            getElementAtEvent(chartRef.current, event)?.forEach((element) => {
              const midpoint = element.index * 10 // e.g. "70"
              const range = [
                Math.max(0, midpoint - 5),
                Math.min(100, midpoint + 5),
              ]
              const searchString = `${range[0]}-${range[1]}%`
              window.dispatchEvent(
                new CustomEvent("setSearchString", { detail: searchString }),
              )
              console.log({ searchString })
            })
        }}
      />
      <button
        className={"btn btn-ghost btn-xs absolute bottom-4 left-2"}
        onClick={() => setHovered(!hovered)}
      >
        <QuestionMarkCircleIcon
          height={20}
          className={clsx("text-neutral-400", hovered && "fill-indigo-700")}
        />
      </button>
    </div>
  )
}
