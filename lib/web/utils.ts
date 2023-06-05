import { useSession } from "next-auth/react"

export function useUserId() {
  const session = useSession()
  return session.data?.user.id
}

export function getChartJsParams(buckets: number[], bucketedForecasts: { bucket: number; mean: number; count: number }[]) {
  return {
    type: "line",
    data: {
      labels: buckets.map(b => (b * 100).toFixed(0) + "%"),
      datasets: [
        {
          backgroundColor: "#4e46e59c",
          borderColor: "#4e46e5e6",
          data: bucketedForecasts.map(f => f.mean * 100),
          label: "Your calibration",
          fill: false,
          showLine: false,
        },
        {
          backgroundColor: "#04785794",
          borderColor: "#047857e5",
          data: buckets.map(b => b * 100),
          label: "Perfect calibration",
          fill: false,
          pointRadius: 0,
          borderWidth: 1,
        }
      ]
    },
    options: {
      maintainAspectRatio: true,
      spanGaps: false,
      elements: {
        line: {
          tension: 0.000001
        }
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Your forecast (bucketed by nearest 10%)'
          },
          gridLines: {
            color: "#1e1e1e",
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: '% of questions that resolved Yes'
          },
          gridLines: {
            color: "#1e1e1e",
          }
        }]
      }
    },
  }
}