import { QuestionType, Resolution } from "@prisma/client"
import { VercelRequest, VercelResponse } from "@vercel/node"
import ChartJSImage from "chart.js-image"
import prisma from "../../lib/prisma"
import { getChartJsParams } from "../../lib/web/utils"

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!req.query.user) {
    res.send("Missing user in query")
  }

  const userId = req.query.user as string

  const results = await getBucketedForecasts(userId)
  if (!results) {
    res.send("No results")
    return
  }
  const { buckets, bucketedForecasts } = results

  const chartJs = new ChartJSImage()
  const lineChart = chartJs
    //@ts-ignore - the library's type definition is incorrect
    .chart(getChartJsParams(buckets, bucketedForecasts))
    .backgroundColor("#111")
    .width("550")
    .height("500")

  console.log("Generated image")

  // send the image
  res.setHeader("Content-Type", "image/png")
  res.send(await lineChart.toBuffer())
}

export async function getBucketedForecasts(userId: string, tags?: string[]) {
  const questions = await prisma.question.findMany({
    where: {
      AND: [
        {
          resolution: {
            in: [Resolution.YES, Resolution.NO],
          },
        },
        {
          type: {
            in: [QuestionType.BINARY], // TODO: add MCQs to calibration
          },
        },
        {
          forecasts: {
            some: {
              userId: {
                equals: userId,
              },
            },
          },
        },
        tags && tags.length > 0
          ? {
              tags: {
                some: {
                  name: {
                    in: tags,
                  },
                  userId: userId,
                },
              },
            }
          : {},
      ],
    },
    include: {
      forecasts: {
        where: {
          userId: {
            equals: userId,
          },
        },
      },
    },
  })

  if (!questions) {
    return undefined
  }

  const forecasts = questions.flatMap((q) =>
    q.forecasts
      // don't include forecasts made <1 minute before another forecast on same question by same user
      .filter(
        (f) =>
          !q.forecasts.some((f2) => {
            const timeDiff = f2.createdAt.getTime() - f.createdAt.getTime()
            return f !== f2 && timeDiff < 1000 * 60 && timeDiff > 0
          }),
      )
      .map((f) => ({
        forecast: f.forecast.toNumber(),
        resolution: q.resolution,
      })),
  )

  const halfBucketSize = 0.05
  const buckets = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  const bucketedForecasts = buckets.map((bucket) => {
    const forecastsInBucket = forecasts.filter((f) => {
      return (
        f.forecast >= bucket - halfBucketSize &&
        // without this fudge, 0.85 is included in the 0.8 and 0.9 buckets
        f.forecast < bucket + halfBucketSize - 0.00000001
      )
    })

    return {
      bucket: bucket,
      mean:
        forecastsInBucket.reduce(
          (acc, f) => acc + (f.resolution === Resolution.YES ? 1 : 0),
          0,
        ) / forecastsInBucket.length,
      count: forecastsInBucket.length,
    }
  })
  return { buckets, bucketedForecasts }
}
