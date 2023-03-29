import { Forecast, Question, Resolution } from '@prisma/client'

type ScoreTimeSeries = {
    [id: number]: number[]
}

export type ScoreArray = [number, number][]

export function relativeBrierScoring(forecasts : Forecast[], question : Question, scoreResolution : number = 100) : ScoreArray {
  let uniqueIds = Array.from(new Set(forecasts.map(f => f.authorId)))

  if (uniqueIds.length == 1) {
    return oneUserScoring(forecasts, question, uniqueIds[0], scoreResolution)
  }

  // iterate over each time interval from start of question to
  //   resolution datetimes
  const dateInterval = question.resolvedAt!.getTime() - question.createdAt.getTime()
  const interval = dateInterval / scoreResolution
  let scoreArray : ScoreTimeSeries = {}

  for (let i = question.createdAt.getTime(); i < question.resolvedAt!.getTime(); i = i + interval) {
    // iterate over each unique user
    for (let id of uniqueIds) {
      // get the most up to date forecast for each users at this time interval
      let idForecastValueTuples : [number, number|undefined][] = uniqueIds.map(id => {
        let mostRecentForecast = forecasts.filter(f => f.authorId == id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        if (mostRecentForecast.createdAt.getTime() <= i) {
          return [id, (mostRecentForecast.forecast.toNumber())]
        } else {
          return [id, undefined]
        }
      })

      // get the median brier score for this time interval
      let medianBrierScore : number = median(idForecastValueTuples.map(([id, forecast]) => {
        if (forecast === undefined) {
          return undefined
        }else{
          return brierScore(forecast, question.resolution!)
        }
      }).filter(v => v !== undefined) as number[])

      // subtract the median brier score from the brier score from each user's forecast
      let relativeBrierScores : [number, number | undefined][] = idForecastValueTuples.map(([id, forecast]) => {
        if (forecast === undefined) {
          return [id, undefined]
        }else{
          return [id, brierScore(forecast, question.resolution!) - medianBrierScore]
        }
      })

      // add the score to the user score array
      relativeBrierScores.forEach(([id, score]) => {
        if (scoreArray[id] === undefined && score !== undefined)
          scoreArray[id] = [score!]
        else if (score !== undefined)
          scoreArray[id].push(score!)
      })
    }
  }

  // average the scores for each user
  const avgScoresPerUser : [number, number][] = uniqueIds.map(id => {
    let scores = scoreArray[id]
    let sum = scores.reduce((a, b) => a + b, 0)
    return [id, sum / scores.length]
  })

  return avgScoresPerUser
}

function oneUserScoring(forecasts : Forecast[], question : Question, id : number, scoreResolution : number = 100) : ScoreArray {
  // iterate over each time interval from start of question to
  //   resolution datetimes
  const dateInterval = question.resolvedAt!.getTime() - question.createdAt.getTime()
  const interval = dateInterval / scoreResolution
  let scores = []

  for (let i = question.createdAt.getTime(); i < question.resolvedAt!.getTime(); i = i + interval) {
    // get the most up to date forecast for each users at this time interval
    let mostRecentForecast = forecasts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    if (mostRecentForecast.createdAt.getTime() <= i) {
      scores.push(brierScore(mostRecentForecast.forecast.toNumber(), question.resolution!))
    }
  }
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  return [[id, avgScore]]
}
  

 
function median(values : number[]) : number {
  if (values.length === 0) return 0
  // filter out undefined values
  let num_values = values.filter(v => v !== undefined).sort((a, b) => a - b)

  // get the median
  let half_index = Math.floor(num_values.length / 2)
  if (num_values.length % 2) {
    return num_values[half_index]
  } else {
    return (num_values[half_index - 1] + num_values[half_index]) / 2.0
  }
}

function brierScore(forecast : number, resolution : Resolution) : number {
  let true_value = resolution == Resolution.YES ? 1 : 0
  return ((forecast - true_value) ** 2) + (((1-forecast) - (1-true_value)) ** 2)
}
