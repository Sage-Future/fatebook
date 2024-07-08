import {
  Forecast,
  Prisma,
  Question,
  QuestionType,
  Resolution,
} from "@prisma/client"
import { VercelRequest, VercelResponse } from "@vercel/node"
import { relativeBrierScoring } from "../../lib/_scoring"
import { floatEquality } from "../../lib/_utils_common"

let forecastid = 0
const questionid = "0"
const startDate = new Date(Date.now())

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 1000 * 60 * 60 * 24)
}

function createForecast(
  userId: string,
  forecastValue: number,
  dateOffset: number,
) {
  const forecast: Forecast = {
    id: forecastid++,
    userId: userId,
    profileId: 10,
    forecast: new Prisma.Decimal(forecastValue),
    questionId: questionid,
    createdAt: addDays(startDate, dateOffset),
    comment: "test",
    optionId: null,
  }

  return forecast
}

const testMultiForecasts: Forecast[] = [
  createForecast("1", 0.9, 0),
  createForecast("1", 0.95, 3),
  createForecast("2", 0.25, 0),
  createForecast("2", 0.2, 2),
  createForecast("3", 0.99, 5),
]

const testSingleForecasts: Forecast[] = [
  createForecast("1", 0.9, 0),
  createForecast("1", 0.95, 3),
]

const testSinglePartForecasts: Forecast[] = [createForecast("1", 0.9, 0.2)]

const testMultiPartForecasts: Forecast[] = [
  createForecast("1", 0.9, 0),
  createForecast("1", 0.95, 0.21),
]

const question = getQuestion(7)
const quickQuestion = getQuestion(0.7)

function getQuestion(days: number): Question {
  return {
    id: questionid,
    title: "Will cubs win?",
    resolution: Resolution.YES,
    createdAt: startDate,
    resolvedAt: addDays(startDate, days),
    comment: "test",
    resolveBy: startDate,
    resolved: true,
    pingedForResolution: true,
    userId: "0",
    profileId: 0,
    notes: null,
    hideForecastsUntil: null,
    hideForecastsUntilPrediction: null,
    sharedPublicly: false,
    unlisted: false,
    type: QuestionType.BINARY,
  }
}

export default function testScoring(req: VercelRequest, res: VercelResponse) {
  const scoreMulti = relativeBrierScoring(testMultiForecasts, question)

  if (
    !floatEquality(scoreMulti[1].relativeBrierScore!, -0.43) ||
    !floatEquality(scoreMulti[2].relativeBrierScore!, 0.7943) ||
    !floatEquality(scoreMulti[3].relativeBrierScore!, -0.00137)
  ) {
    console.log(
      `scoreMulti 1 1 is right : ${floatEquality(
        scoreMulti[1].relativeBrierScore!,
        -0.43,
      )}`,
    )
    console.log(
      `scoreMulti 2 1 is right : ${floatEquality(
        scoreMulti[2].relativeBrierScore!,
        0.7943,
      )}`,
    )
    console.log(
      `scoreMulti 3 1 is right : ${floatEquality(
        scoreMulti[3].relativeBrierScore!,
        -0.00137,
      )}`,
    )
    res
      .status(500)
      .send("Multiuser scoring failed: " + JSON.stringify(scoreMulti))
    return
  }

  const scoreSingle = relativeBrierScoring(testSingleForecasts, question)
  if (!floatEquality(scoreSingle[1].absoluteBrierScore, 0.0114)) {
    res
      .status(500)
      .send("Single user scoring failed: " + JSON.stringify(scoreSingle))
    return
  }

  const scoreSinglePartDay = relativeBrierScoring(
    testSinglePartForecasts,
    quickQuestion,
  )
  console.log(scoreSinglePartDay)
  if (!floatEquality(scoreSinglePartDay[1].absoluteBrierScore, 0.02)) {
    res
      .status(500)
      .send(
        "Single user part day scoring failed: " +
          JSON.stringify(scoreSinglePartDay),
      )
    return
  }

  const scoreMultiPartDay = relativeBrierScoring(
    testMultiPartForecasts,
    quickQuestion,
  )
  console.log(scoreMultiPartDay)
  if (!floatEquality(scoreMultiPartDay[1].absoluteBrierScore, 0.00845)) {
    res
      .status(500)
      .send(
        "Multi user part day scoring failed: " +
          JSON.stringify(scoreMultiPartDay),
      )
    return
  }

  const combinedScores = {
    scoreMulti,
    scoreSingle,
    scoreSinglePartDay,
    scoreMultiPartDay,
  }
  res.status(200).send("ok!\n" + JSON.stringify(combinedScores) + "\n")
}
