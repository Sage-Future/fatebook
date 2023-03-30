import { VercelRequest, VercelResponse } from "@vercel/node"
import { Forecast, Question, Resolution, Prisma } from '@prisma/client'
import { relativeBrierScoring } from "../_scoring.js"

let forecastid = 0
const questionid = 0
const startDate = new Date(Date.now())

function addDays(date : Date, days : number) {
  var result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function floatEquality(a : number, b : number, tolerance : number = 0.0001) {
  return Math.abs(a - b) < tolerance
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
  createForecast(1, 0.9,  1),
  createForecast(1, 0.95, 4),
  createForecast(2, 0.25, 1),
  createForecast(2, 0.2,  3),
  createForecast(3, 0.99, 6)
]

const testSingleForecasts : Forecast[] = [
  createForecast(1, 0.9,  1),
  createForecast(1, 0.95, 4)
]

const question : Question = {
  id: questionid,
  title: "Will cubs win?",
  resolution: Resolution.YES,
  createdAt: startDate,
  resolvedAt: addDays(startDate, 8),
  comment: "test",
  resolveBy: startDate,
  resolved: true,
  pingedForResolution: true,
  authorId: 0
}

export default function testScoring(req: VercelRequest, res: VercelResponse) {
  const score = relativeBrierScoring(testMultiForecasts, question, 8)
  if (!floatEquality(score[0][1], -0.43) || !floatEquality(score[1][1], 0.7943) || !floatEquality(score[2][1], -0.00137)) {
    console.log(`score 1 1 is right : ${floatEquality(score[0][1], -0.43)}`)
    console.log(`score 2 1 is right : ${floatEquality(score[1][1], 0.7943)}`)
    console.log(`score 3 1 is right : ${floatEquality(score[2][1], -0.00137)}`)
    res.status(500).send("Multiuser scoring failed: " + JSON.stringify(score))
    return
  }

  const scoreSingle = relativeBrierScoring(testSingleForecasts, question, 8)
  if (!floatEquality(scoreSingle[0][1],	0.0114)){
    res.status(500).send("Single user scoring failed: " + JSON.stringify(scoreSingle))
    return
  }

  const combinedScores = {
    scoreMulti : score,
    scoreSingle : scoreSingle
  }
  res.status(200).send("ok!\n" + JSON.stringify(combinedScores) + "\n")
}

