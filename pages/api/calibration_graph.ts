import { Resolution } from '@prisma/client'
import { VercelRequest, VercelResponse } from '@vercel/node'
import ChartJSImage from 'chart.js-image'
import prisma from '../../lib/_utils'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!req.query.user) {
    res.send("Missing user in query")
  }

  const userId = parseInt(req.query.user as string)

  const questions = await prisma.question.findMany({
    where: {
      resolution: {
        in: [Resolution.YES, Resolution.NO]
      },
      forecasts: {
        some: {
          profile: {
            userId: {
              equals: userId,
            }
          },
        }
      }
    },
    include: {
      forecasts: {
        where: {
          profile: {
            userId: {
              equals: userId,
            }
          }
        }
      },
    }
  })

  if (!questions) {
    res.send("No forecasts found")
  }

  const avgForecastPerQuestion = questions.map(q => {
    return {
      forecast: q.forecasts.reduce((acc, f) => acc + f.forecast.toNumber(), 0) / q.forecasts.length,
      resolution: q.resolution,
    }
  })

  const bucketSize = 0.1
  const buckets = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  const bucketedForecasts = buckets.map(
    bucket => {
      const forecastsInBucket = avgForecastPerQuestion.filter(f =>
        f.forecast >= bucket - (bucketSize / 2) &&
        f.forecast <  bucket + (bucketSize / 2)
      )

      return {
        bucket: bucket,
        mean: forecastsInBucket.reduce((acc, f) => acc + (f.resolution === Resolution.YES ? 1 : 0), 0) / forecastsInBucket.length,
        count: forecastsInBucket.length,
      }
    }
  )

  const chartJs = new ChartJSImage()
  //@ts-ignore - the library's type definition is incorrect
  const lineChart = chartJs.chart({
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
          pointRadius: false,
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
        xAxes: [ {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Your forecast (bucketed by nearest 10%)'
          },
          gridLines: {
            color: "#1e1e1e",
          }
        } ],
        yAxes: [ {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '% of questions that resolved Yes'
          },
          gridLines: {
            color: "#1e1e1e",
          }
        } ]
      }
    },
  })
    .backgroundColor("#111")
    .width("550")
    .height("500")


  console.log("Generated image")

  // send the image
  res.setHeader('Content-Type', 'image/png')
  res.send(await lineChart.toBuffer())
}