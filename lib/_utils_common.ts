import { Forecast, QuestionScore, Resolution } from "@prisma/client"
import type { Decimal } from "@prisma/client/runtime/library"
import {
  QuestionWithForecasts,
  QuestionWithStandardIncludes,
} from "../prisma/additional"
import {
  maxDecimalPlacesScoreForecastListing,
  maxScoreDecimalPlacesListing,
  numberOfDaysInRecentPeriod,
  scorePrepad,
} from "./_constants"

export function forecastsAreHidden(
  question: QuestionWithForecasts,
  userId: string | undefined,
) {
  if (question.resolved) {
    return false
  }

  if (
    question.hideForecastsUntil &&
    question.hideForecastsUntil.getTime() > Date.now()
  ) {
    return true
  }

  if (question.hideForecastsUntilPrediction) {
    if (!userId || !question.forecasts.some((f) => f.userId === userId)) {
      return true
    }
  }

  // No hiding conditions met
  return false
}

export function forecastHiddenReasonText(
  question: QuestionWithStandardIncludes,
) {
  if (question.hideForecastsUntilPrediction && question.hideForecastsUntil) {
    return `until you make a prediction and the date is at least ${getDateYYYYMMDD(question.hideForecastsUntil)}`
  }
  if (question.hideForecastsUntil) {
    return `until ${getDateYYYYMMDD(question.hideForecastsUntil)}`
  }
  if (question.hideForecastsUntilPrediction) {
    return "until you make a prediction"
  }
  return ""
}

export function getMostRecentForecastPerUser(
  forecasts: Forecast[],
  date: Date,
): [string, Forecast][] {
  const forecastsPerUser = new Map<string, Forecast>()
  for (const forecast of forecasts) {
    const authorId = forecast.userId
    if (forecastsPerUser.has(authorId) && forecast.createdAt < date) {
      const existingForecast = forecastsPerUser.get(authorId)
      if (existingForecast!.createdAt < forecast.createdAt) {
        forecastsPerUser.set(authorId, forecast)
      }
    } else if (forecast.createdAt < date) {
      forecastsPerUser.set(authorId, forecast)
    }
  }
  return Array.from(forecastsPerUser, ([id, value]) => [id, value])
}

interface HasForecasts {
  forecasts: {
    forecast: Decimal
    createdAt: Date
    userId: string
  }[]
}
export function getMostRecentForecastForUser<T extends HasForecasts>(
  question: T,
  userId: String,
) {
  const forecasts = question.forecasts
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return forecasts && forecasts.length ? forecasts[0] : null
}

export function getGeometricCommunityForecast(
  question: QuestionWithForecasts,
  date: Date,
): number {
  // get all forecasts for this question
  const uptoDateForecasts: number[] = getMostRecentForecastPerUser(
    question.forecasts,
    date,
  ).map(([, forecast]) => nudgeAwayFromZeroOrOne(forecast.forecast.toNumber()))
  // sum each forecast
  const productOfForecasts: number = uptoDateForecasts.reduce(
    (acc, forecast) => acc * (forecast / (1 - forecast)),
    1,
  )
  const geoMeanOfOdds = Math.pow(
    productOfForecasts,
    1 / uptoDateForecasts.length,
  )
  return geoMeanOfOdds / (1 + geoMeanOfOdds)
}

export function getCommunityForecast(
  question: QuestionWithForecasts,
  date: Date,
): number {
  return getGeometricCommunityForecast(question, date)
}

export function getArithmeticCommunityForecast(
  question: QuestionWithForecasts,
  date: Date,
): number {
  // get all forecasts for this question
  const uptoDateForecasts: number[] = getMostRecentForecastPerUser(
    question.forecasts,
    date,
  ).map(([, forecast]) => nudgeAwayFromZeroOrOne(forecast.forecast.toNumber()))
  // sum each forecast
  const summedForecasts: number = uptoDateForecasts.reduce(
    (acc, forecast) => acc + forecast,
    0,
  )
  // divide by number of forecasts
  return summedForecasts / uptoDateForecasts.length
}

export function conciseDateTime(date: Date, includeTime = true) {
  let timeStr = ""
  if (includeTime)
    timeStr = `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())} on `
  return `${timeStr}${getDateYYYYMMDD(date)}`
}

export function nudgeAwayFromZeroOrOne(num: number) {
  if (num === 0) return 0.0001
  if (num === 1) return 0.9999
  return num
}

export function displayForecast(
  forecast: { forecast: Decimal },
  decimalPlaces: number,
  includePercent = true,
): string {
  return `${
    forecast?.forecast
      ? formatDecimalNicely(forecast.forecast.toNumber() * 100, decimalPlaces)
      : "?"
  }${includePercent ? "%" : ""}`
}

export function formatScoreNicely(
  num: number,
  maxDigits: number,
  significantDigits: number,
): string {
  const rounded = +num.toPrecision(significantDigits)
  return formatDecimalNicely(rounded, maxDigits)
}

export function formatDecimalNicely(
  num: number,
  decimalPlaces: number,
): string {
  // for close to 100 or 0, show 3 decimal places
  if (decimalPlaces === 2 && num > 99.99 && num < 100) {
    decimalPlaces = 3
  }
  if (decimalPlaces === 2 && num < 0.01 && num > 0) {
    decimalPlaces = 3
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  })
}

export function showSignificantFigures(
  num: number,
  significantFigures: number,
): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumSignificantDigits: significantFigures,
  })
}

export function getDateYYYYMMDD(date: Date) {
  return `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(
    date.getDate(),
  )}`
}

export function getDateTimeYYYYMMDDHHMMSS(date: Date) {
  return `${getDateYYYYMMDD(date)} ${zeroPad(date.getHours())}:${zeroPad(
    date.getMinutes(),
  )}:${date.getSeconds()}`
}

export function unixTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000)
}

export function zeroPad(num: number) {
  return num.toString().padStart(2, "0")
}

export function round(number: number, places = 2) {
  // @ts-ignore
  return +(Math.round(number + "e+" + places) + "e-" + places)
}

export function resolutionToString(resolution: Resolution) {
  return (
    resolution.toString().charAt(0).toUpperCase() +
    resolution.toString().slice(1).toLowerCase()
  )
}

export function getResolutionEmoji(resolution: Resolution | null) {
  switch (resolution) {
    case Resolution.YES:
      return "✅"
    case Resolution.NO:
      return "❌"
    case Resolution.AMBIGUOUS:
      return "❔"
    default:
      return ""
  }
}

export function floatEquality(
  a: number,
  b: number,
  tolerance: number = 0.0001,
) {
  return Math.abs(a - b) < tolerance
}

export function averageScores(scores: (number | undefined)[]) {
  const existentScores = scores.filter(
    (s: number | undefined) => s != undefined,
  ) as number[]
  if (existentScores.length == 0) {
    return undefined
  } else {
    return existentScores.reduce((a, b) => a + b, 0) / scores.length
  }
}

export function toSentenceCase(str: string) {
  if (str.length === 0) {
    return ""
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function tomorrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

type ScoreDetails = {
  brierScore: number
  rBrierScore: number | undefined
  ranking: number
  totalParticipants: number
}
type QScoreLite = {
  absolute: number
  relative: number | undefined
}
export function populateDetails(questionScores: QuestionScore[]): {
  recentDetails: ScoreDetails
  overallDetails: ScoreDetails
} {
  const recentScores = questionScores
    .filter(
      (qs: QuestionScore) =>
        qs.createdAt >
        new Date(Date.now() - 1000 * 60 * 60 * 24 * numberOfDaysInRecentPeriod),
    )
    .map((qs: QuestionScore) => {
      return {
        absolute: qs.absoluteScore.toNumber(),
        relative: qs.relativeScore?.toNumber(),
      }
    })

  const overallScores = questionScores.map((qs: QuestionScore) => {
    return {
      absolute: qs.absoluteScore.toNumber(),
      relative: qs.relativeScore?.toNumber(),
    }
  })
  const recentDetails = {
    brierScore: averageScores(
      recentScores.map((qs: QScoreLite) => qs.absolute),
    )!,
    rBrierScore: averageScores(
      recentScores.map((qs: QScoreLite) => qs.relative),
    ),
    ranking: 0,
    totalParticipants: 0,
  }
  const overallDetails = {
    brierScore: averageScores(
      overallScores.map((qs: QScoreLite) => qs.absolute),
    )!,
    rBrierScore: averageScores(
      overallScores.map((qs: QScoreLite) => qs.relative),
    ),
    ranking: 0,
    totalParticipants: 0,
  }
  return { recentDetails, overallDetails }
}

export function padAndFormatScore(
  score: number,
  maxprepad: number = scorePrepad,
) {
  let prepad = maxprepad

  if (score < 0) prepad = prepad - 2

  const scorePadded =
    " ".repeat(prepad) +
    "`" +
    formatScoreNicely(
      score,
      maxDecimalPlacesScoreForecastListing,
      maxScoreDecimalPlacesListing,
    ) +
    "`"
  return scorePadded
}

export function plural(num: number) {
  return num === 1 ? "" : "s"
}

export function joinWithOr(list: string[]) {
  if (list.length === 0) return ""
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} or ${list[1]}`
  return `${list.slice(0, -1).join(", ")}, or ${list.slice(-1)}`
}

export function generateRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

export function filterToUniqueIds(arr: { id: any }[]) {
  const uniqueArray = arr.filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
  )
  return uniqueArray
}

export function sum(arr: number[]) {
  return arr.reduce((acc, curr) => acc + curr, 0)
}

export function mean(arr: number[]) {
  return sum(arr) / arr.length
}

// for convenient debugging
export function truthyLog(message: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(message)
  }
  return true as true
}

export function logAndReturn<T>(message: T) {
  if (process.env.NODE_ENV === "development") {
    console.log(message)
  }
  return message
}

export function capitalizeFirstLetter(str: string) {
  if (str.length === 0) {
    return ""
  }

  return str.charAt(0).toUpperCase() + str.slice(1)
}

export async function subscribeToMailingList(email: string, name?: string) {
  if (!process.env.MAILING_LIST_SECRET) {
    throw new Error("MAILING_LIST_SECRET is not set")
  }
  const res = await fetch(
    "https://www.quantifiedintuitions.org/api/email/subscribe",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MAILING_LIST_SECRET,
      },
      body: JSON.stringify({
        subscribers: [
          {
            email,
            tags: ["fatebook-user"],
            products: ["Fatebook"],
            name,
          },
        ],
      }),
    },
  )
  if (!res.ok) {
    throw new Error(
      "Failed to subscribe to mailing list " +
        JSON.stringify(await res.json(), null, 2),
    )
  }
  return await res.json()
}
