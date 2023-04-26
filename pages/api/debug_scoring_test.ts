import { Forecast, Prisma, Question, Resolution } from '@prisma/client'
import { VercelRequest, VercelResponse } from "@vercel/node"
import { relativeBrierScoring } from '../../lib/_scoring'
import { floatEquality } from '../../lib/_utils'

let forecastid = 0
const questionid = 0
const startDate = new Date(Date.now())

function addDays(date : Date, days : number) {
  return new Date(date.getTime() + (days * 1000 * 60 * 60 * 24))
}

function createForecast(authorid : number, forecastValue : number, dateOffset : number)
{
  const forecast : Forecast = {
    id: forecastid++,
    authorId: authorid,
    forecast: new Prisma.Decimal(forecastValue),
    questionId: questionid,
    createdAt: addDays(startDate, dateOffset),
    comment: "test"
  }

  return forecast
}

const testMultiForecasts : Forecast[] = [
  createForecast(1, 0.9,  0),
  createForecast(1, 0.95, 3),
  createForecast(2, 0.25, 0),
  createForecast(2, 0.2,  2),
  createForecast(3, 0.99, 5)
]

const testSingleForecasts : Forecast[] = [
  createForecast(1, 0.9,  0),
  createForecast(1, 0.95, 3)
]

const testSinglePartForecasts : Forecast[] = [
  createForecast(1, 0.9,  0.2)
]

const question = getQuestion(7)
const quickQuestion = getQuestion(0.8)

function getQuestion(days : number) : Question {
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
    authorId: 0,
    notes: null,
  }
}

export default function testScoring(req: VercelRequest, res: VercelResponse) {
  const score = relativeBrierScoring(testMultiForecasts, question)
  console.log(score)
  if (!floatEquality(score[1].relativeBrierScore, -0.43) || !floatEquality(score[2].relativeBrierScore, 0.7943) || !floatEquality(score[3].relativeBrierScore, -0.00137)) {
    console.log(`score 1 1 is right : ${floatEquality(score[1].relativeBrierScore, -0.43)}`)
    console.log(`score 2 1 is right : ${floatEquality(score[2].relativeBrierScore, 0.7943)}`)
    console.log(`score 3 1 is right : ${floatEquality(score[3].relativeBrierScore, -0.00137)}`)
    res.status(500).send("Multiuser scoring failed: " + JSON.stringify(score))
    return
  }

  const scoreSingle = relativeBrierScoring(testSingleForecasts, question)
  if (!floatEquality(scoreSingle[1].relativeBrierScore,	0.0114)){
    res.status(500).send("Single user scoring failed: " + JSON.stringify(scoreSingle))
    return
  }

  const scoreSinglePartDay = relativeBrierScoring(testSinglePartForecasts, quickQuestion)
  if (!floatEquality(scoreSinglePartDay[1].relativeBrierScore,	0.02)){
    res.status(500).send("Single user part day scoring failed: " + JSON.stringify(scoreSinglePartDay))
    return
  }

  const combinedScores = {
    scoreMulti : score,
    scoreSingle : scoreSingle,
    scoreSinglePartDay : scoreSinglePartDay
  }
  res.status(200).send("ok!\n" + JSON.stringify(combinedScores) + "\n")
}

