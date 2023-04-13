import { Forecast, Question, Resolution } from '@prisma/client'

type ScoreTimeSeries = {
    [id: number]: number[]
}

export type ScoreTuple = {
  relativeBrierScore: number
  absoluteBrierScore: number
  rank              : number
}

export type ScoreCollection = {
  [key: number]: ScoreTuple
}

export function relativeBrierScoring(forecasts : Forecast[], question : Question, scoreResolution : number = 101) : ScoreCollection {
  let uniqueIds = Array.from(new Set(forecasts.map(f => f.authorId)))

  if (uniqueIds.length == 1) {
    return oneUserScoring(forecasts, question, uniqueIds[0], scoreResolution)
  }

  // iterate over each time interval from start of question to
  //   resolution datetimes
  const dateInterval = question.resolvedAt!.getTime() - question.createdAt.getTime()
  const interval = dateInterval / scoreResolution
  let relativeScoreTimeSeries : ScoreTimeSeries = {}
  let absoluteScoreTimeSeries : ScoreTimeSeries = {}

  const startInterval = question.createdAt.getTime() + interval
  const sortedForecastsById : [number, Forecast[]][] = uniqueIds.map(id => {
    return [id, forecasts.filter(f => f.authorId == id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())]
  })


  for (let i = startInterval; i < question.resolvedAt!.getTime(); i = i + interval) {
    // get the most up to date forecast for each users at this time interval
    let idForecastValueTuples : [number, number|undefined][] = sortedForecastsById.map(([id, sortedForecasts]) => {
      const forecastsBeforeCurrentInterval = sortedForecasts.filter(f => f.createdAt.getTime() <= i)

      if (forecastsBeforeCurrentInterval.length > 0) {
        return [id, (forecastsBeforeCurrentInterval[0].forecast.toNumber())]
      } else {
        return [id, undefined]
      }
    })

    let absoluteBrierScores : [number, number | undefined][] = idForecastValueTuples.map(([id, forecast]) => {
      if (forecast === undefined) {
        return [id, undefined]
      }else{
        return [id, brierScore(forecast, question.resolution!)]
      }
    })

    // get the median brier score for this time interval
    let medianBrierScore : number = median(absoluteBrierScores.map(([,score]) => score).filter(v => v !== undefined) as number[])


    // subtract the median brier score from the brier score from each user's forecast
    let relativeBrierScores : [number, number | undefined][] = idForecastValueTuples.map(([id, forecast]) => {
      if (forecast === undefined) {
        return [id, undefined]
      }else{
        return [id, brierScore(forecast, question.resolution!) - medianBrierScore]
      }
    })

    if(relativeBrierScores.length != absoluteBrierScores.length){
      throw new Error("relative and absolute brier scores are not the same length")
    }

    // add the score to the user score array
    for (let i = 0; i < relativeBrierScores.length; i++) {
      const [id,  relativeScore]  = <[number, number | undefined]> relativeBrierScores[i]
      const [, absoluteScore]  = <[number, number | undefined]> absoluteBrierScores[i]
      if (relativeScoreTimeSeries[id] === undefined && relativeScore !== undefined){
        relativeScoreTimeSeries[id] = [relativeScore!]
        absoluteScoreTimeSeries[id] = [absoluteScore!]
      }
      else if (relativeScore !== undefined){
        relativeScoreTimeSeries[id].push(relativeScore!)
        absoluteScoreTimeSeries[id].push(absoluteScore!)
      }
    }
  }

  // average the scores for each user
  let avgScoresPerUser : ScoreCollection = {}
  for(const id of Object.keys(relativeScoreTimeSeries).map(id => parseInt(id))){
    avgScoresPerUser[id] = {
      relativeBrierScore : averageForScoreResolution(relativeScoreTimeSeries[id], scoreResolution),
      absoluteBrierScore : averageForScoreResolution(absoluteScoreTimeSeries[id], scoreResolution),
      rank               : -1 //reassigned below
    }
  }

  //sort the user id's of avgScoresPerUser by their relative brier score
  let sortedIds = Object.keys(avgScoresPerUser).map(id => parseInt(id)).sort((a, b) => avgScoresPerUser[a].relativeBrierScore - avgScoresPerUser[b].relativeBrierScore)

  for (let i = 0; i < sortedIds.length; i++) {
    avgScoresPerUser[sortedIds[i]].rank = i+1
  }

  return avgScoresPerUser
}

function oneUserScoring(forecasts : Forecast[], question : Question, id : number, scoreResolution : number = 101) : ScoreCollection {
  // iterate over each time interval from start of question to
  //   resolution datetimes
  const dateInterval = question.resolvedAt!.getTime() - question.createdAt.getTime()
  const interval = dateInterval / scoreResolution
  let scores = []
  const startInterval = question.createdAt.getTime() + interval

  const sortedForecasts = forecasts.filter(f => f.authorId == id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  for (let i = startInterval; i < question.resolvedAt!.getTime(); i = i + interval) {
    const forecastsBeforeCurrentInterval = sortedForecasts.filter(f => f.createdAt.getTime() <= i)

    if (forecastsBeforeCurrentInterval.length > 0) {
      scores.push(brierScore(forecastsBeforeCurrentInterval[0].forecast.toNumber(), question.resolution!))
    }
  }
  const avgScore = scores.reduce((a, b) => a + b, 0) / (scoreResolution-1)
  return {
    [id]: {
      relativeBrierScore: avgScore,
      absoluteBrierScore: avgScore,
      rank              : 1
    }
  }
}

function median(values : number[]) : number {
  if (values.length === 0) return 0
  // filter out undefined values
  let numValues = values.filter(v => v !== undefined).sort((a, b) => a - b)

  // get the median
  let halfIndex = Math.floor(numValues.length / 2)
  if (numValues.length % 2) {
    return numValues[halfIndex]
  } else {
    return (numValues[halfIndex - 1] + numValues[halfIndex]) / 2.0
  }
}

function averageForScoreResolution(scores : number[], scoreResolution: number) : number{
  let sum = scores.reduce((a, b) => a + b, 0)
  return sum / (scoreResolution-1)
}

function brierScore(forecast : number, resolution : Resolution) : number {
  let trueValue = resolution == Resolution.YES ? 1 : 0
  return ((forecast - trueValue) ** 2) + (((1-forecast) - (1-trueValue)) ** 2)
}
