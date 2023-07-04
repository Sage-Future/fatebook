import { Question } from "@prisma/client"
import { useSession } from "next-auth/react"
import { getQuestionUrl } from "../../pages/q/[id]"

export function useUserId() {
  const session = useSession()
  return session.data?.user.id
}

export function getChartJsParams(buckets: number[], bucketedForecasts: { bucket: number; mean: number; count: number }[], interactive = false, hideTitles=false) {
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
          data: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
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
      plugins: interactive ? {
        legend: {
          maxWidth: 100,
          onClick: () => {} // overwrite default behaviour of hiding points
        }
      } : {},
      scales: interactive ? {
        y: {
          title: {
            display: true,
            text: '% of questions that resolved Yes',
            color: hideTitles ? "transparent" : "gray"
          },
          ticks: {
            // Include a dollar sign in the ticks
            callback: (value: any) =>  value + "%"
          }
        },
        x: {
          title: {
            display: true,
            text: 'Your forecast (bucketed by nearest 10%)',
            color: hideTitles ? "transparent" : "gray",
          },
        }
      } : {
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
        }],
      }
    },
  }
}

export function getHtmlLinkQuestionTitle(question: Question) {
  return `<a href="${getQuestionUrl(question, false)}">${question.title}</a>`
}

export const webFeedbackUrl = "https://forms.gle/mfyCqLG4pLoEqYfy9"