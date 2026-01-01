import { Forecast, QuestionType, Resolution } from "@prisma/client"
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
  const { bucketedForecasts } = results

  const chartJs = new ChartJSImage()
  const lineChart = chartJs
    //@ts-ignore - the library's type definition is incorrect
    .chart(getChartJsParams(bucketedForecasts))
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
          OR: [
            // For binary questions
            {
              type: QuestionType.BINARY,
              resolution: {
                in: [Resolution.YES, Resolution.NO],
              },
            },
            // For multiple choice questions
            {
              type: QuestionType.MULTIPLE_CHOICE,
              options: {
                some: {
                  resolution: {
                    in: [Resolution.YES, Resolution.NO],
                  },
                },
              },
            },
          ],
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
      options: {
        where: {
          resolution: {
            in: [Resolution.YES, Resolution.NO],
          },
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
      },
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

  function excludeForecastsCreatedInLastMinuteBySameUser(
    f: Forecast,
    forecasts: Forecast[],
  ) {
    return !forecasts.some((f2) => {
      const timeDiff = f2.createdAt.getTime() - f.createdAt.getTime()
      return f !== f2 && timeDiff < 1000 * 60 && timeDiff > 0
    })
  }

  const forecasts = questions
    .filter((q) => q.type === QuestionType.BINARY)
    .flatMap((q) =>
      q.forecasts
        .filter((f) =>
          excludeForecastsCreatedInLastMinuteBySameUser(f, q.forecasts),
        )
        .map((f) => ({
          forecast: f.forecast.toNumber(),
          resolution: q.resolution,
        })),
    )

  const mcqForecasts = questions
    .filter(
      (q) =>
        q.type === QuestionType.MULTIPLE_CHOICE &&
        (!q.resolution || q.resolution != Resolution.AMBIGUOUS), // Exclude ambiguous questions
    )
    .flatMap((q) =>
      q.options
        // Only include options that have resolutions
        .filter((option) => option.resolvedAt)
        .flatMap((option) =>
          option.forecasts
            .filter((f) =>
              excludeForecastsCreatedInLastMinuteBySameUser(
                f,
                option.forecasts,
              ),
            )
            .map((f) => ({
              forecast: f.forecast.toNumber(),
              resolution: option.resolution,
            })),
        ),
    )

  forecasts.push(...mcqForecasts)

  // Create 10 equal-width bins: [0-10%), [10-20%), ..., [90-100%]
  const NUM_BINS = 10
  const BIN_WIDTH = 1.0 / NUM_BINS

  // Guarantees each forecast goes to exactly one bin
  function getBinIndex(value: number): number {
    if (value >= 1.0) return NUM_BINS - 1
    return Math.floor(value * NUM_BINS)
  }

  const bins: typeof forecasts[] = Array.from({ length: NUM_BINS }, () => [])
  forecasts.forEach((f) => {
    bins[getBinIndex(f.forecast)].push(f)
  })

  const bucketedForecasts = bins.map((forecastsInBin, i) => {
    const binStart = i * BIN_WIDTH
    const binEnd = (i + 1) * BIN_WIDTH
    const binCenter = (binStart + binEnd) / 2

    const count = forecastsInBin.length
    const meanPrediction =
      count > 0
        ? forecastsInBin.reduce((sum, f) => sum + f.forecast, 0) / count
        : binCenter

    const meanOutcome =
      count > 0
        ? forecastsInBin.filter((f) => f.resolution === Resolution.YES).length /
          count
        : NaN

    return {
      binCenter,
      meanPrediction,
      meanOutcome,
      count,
    }
  })

  return { bucketedForecasts }
}
