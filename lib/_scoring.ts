import { Forecast, Question, Resolution } from '@prisma/client'
import { floatEquality } from './_utils.js'

type ScoreTimeSeries = {
    [id: number]: number[]
}

type ForecastArray = {
    [id: number]: number | undefined
}

export type ScoreTuple = {
  relativeBrierScore: number
  absoluteBrierScore: number
  rank              : number
}

export type ScoreCollection = {
  [key: number]: ScoreTuple
}

export type DaysForecasts = {
  id : number
  forecasts : Forecast[]
  mostRecentForecast : number | undefined
}

export type DayAvgForecast = {
  id : number
  avgForecast : number | undefined
}


export function relativeBrierScoring(forecasts : Forecast[], question : Question) : ScoreCollection {
  const days      = (question.resolvedAt!.getTime() - question.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  const fractionalDay = days - Math.floor(days)

  let uniqueIds = Array.from(new Set(forecasts.map(f => f.authorId)))

  // iterate over each time interval from start of question to
  //   resolution datetimes
  const day = (1000 * 60 * 60 * 24)
  const endDay = question.createdAt.getTime() + (Math.ceil(days) * day)

  let relativeScoreTimeSeries : ScoreTimeSeries = {}
  let absoluteScoreTimeSeries : ScoreTimeSeries = {}

  const sortedForecastsById : [number, Forecast[]][] = uniqueIds.map(id => {
    return [id, forecasts.filter(f => f.authorId == id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())]
  })

  for (let j = question.createdAt.getTime(); j < endDay; j = j + day) {
    // dealing with fractional part of day at the end
    const currentInterval = j + day < question.resolvedAt!.getTime() ? j + day : question.resolvedAt!.getTime()
    const startOfInterval = j < question.resolvedAt!.getTime() ? j       : question.resolvedAt!.getTime()

    // get the most up to date forecast for each profile before this time period
    const mostRecentForecastBeforeThisIntervalById : ForecastArray = getMostRecentForecasts(sortedForecastsById, startOfInterval)

    // get all the forecasts for each user inbetween the current time interval and the previous one
    const forecastsOfCurrentIntervalbyId : DaysForecasts[] = sortedForecastsById.map(([id, sortedForecasts]) => {
      return {
        id: id,
        forecasts: sortedForecasts.filter(f => f.createdAt.getTime() < currentInterval && f.createdAt.getTime() >= startOfInterval),
        mostRecentForecast: mostRecentForecastBeforeThisIntervalById[id]
      }
    })

    const weightedForecastsOfCurrentIntervalById : DayAvgForecast[] = getWeightedAverageForecastOfInterval(forecastsOfCurrentIntervalbyId,
                                                                                                           startOfInterval,
                                                                                                           day)

    let absoluteBrierScores : [number, number | undefined][] = weightedForecastsOfCurrentIntervalById.map(({id, avgForecast}) => {
      if (avgForecast === undefined) {
        return [id, undefined]
      }else{
        return [id, brierScore(avgForecast, question.resolution!)]
      }
    })

    // get the median brier score for this time interval
    let medianBrierScore : number = median(absoluteBrierScores.map(([,score]) => score).filter(v => v !== undefined) as number[])



    // subtract the median brier score from the brier score from each user's forecast
    let relativeBrierScores : [number, number | undefined][] = weightedForecastsOfCurrentIntervalById.map(({id, avgForecast}) => {
      if (avgForecast === undefined) {
        return [id, undefined]
      }else{
        return [id, brierScore(avgForecast, question.resolution!) - medianBrierScore]
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
  if (uniqueIds.length != 1) {
    for(const id of Object.keys(relativeScoreTimeSeries).map(id => parseInt(id))){
      avgScoresPerUser[id] = {
        relativeBrierScore : averageForScoreResolution(relativeScoreTimeSeries[id], Math.floor(days), fractionalDay),
        absoluteBrierScore : averageForScoreResolution(absoluteScoreTimeSeries[id], Math.floor(days), fractionalDay),
        rank               : -1 //reassigned below
      }
    }
  } else {
    const id = uniqueIds[0]
    avgScoresPerUser[id] = {
      relativeBrierScore : averageForScoreResolution(absoluteScoreTimeSeries[id], Math.floor(days), fractionalDay),
      absoluteBrierScore : averageForScoreResolution(absoluteScoreTimeSeries[id], Math.floor(days), fractionalDay),
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

function getWeightedAverageForecastOfInterval(forecastsOfCurrentIntervalbyId : DaysForecasts[], startOfInterval : number, day : number)  : DayAvgForecast[]{
  // mapping for each id
  return forecastsOfCurrentIntervalbyId.map(({id, forecasts, mostRecentForecast}) => {
    if (mostRecentForecast != undefined){
      const [avgForecast,] = forecasts.reduce(([sum, date], forecast) => {
        const weight = (forecast.createdAt.getTime() - date) / day
        if(weight == 1) {
          // dealing with case where forecast is on boundary, can ignore previous forecast
          sum = 0
        }
        return [sum + (weight * forecast.forecast.toNumber()), forecast.createdAt.getTime()]
      }, [mostRecentForecast!, startOfInterval] as [number, number])
      return {id, avgForecast}

    } else {
      if (forecasts.length == 0){
        return {id, avgForecast:undefined}
      } else {
        // In the case where there hasn't been a previous forecast, need to average over the time
        //   since the first forecast of the day, so intialise reduce with forecast[0] values
        const [avgForecast,] = forecasts.slice(1).reduce(([sum, date], forecast) => {
          const weight = (forecast.createdAt.getTime() - date) / day
          return [(sum + (weight * forecast.forecast.toNumber())), forecast.createdAt.getTime()]
        }, [forecasts[0].forecast.toNumber(), forecasts[0].createdAt.getTime()] as [number, number])
        return {id, avgForecast}
      }
    }
  })
}

function getMostRecentForecasts(sortedForecastsById : [number, Forecast[]][], startOfInterval : number) : ForecastArray {
  let mostRecentForecasts : ForecastArray = []
  for(const idEntry of sortedForecastsById){
    const id = idEntry[0]
    const sortedForecasts : Forecast[] = idEntry[1]
    const forecastsBeforeCurrentInterval = sortedForecasts.filter(f => f.createdAt.getTime() <= startOfInterval)

    if (forecastsBeforeCurrentInterval.length > 0) {
      mostRecentForecasts[id] = (forecastsBeforeCurrentInterval[0].forecast.toNumber())
    } else {
      mostRecentForecasts[id] = undefined
    }
  }
  return mostRecentForecasts
}

function median(values : number[]) : number {
  if (values.length === 0) return 0
  // filter out undefined values
  let numValues = values.sort((a, b) => a - b)

  // get the median
  let halfIndex = Math.floor(numValues.length / 2)
  if (numValues.length % 2) {
    return numValues[halfIndex]
  } else {
    return (numValues[halfIndex - 1] + numValues[halfIndex]) / 2.0
  }
}

function averageForScoreResolution(scores : number[], days : number, fractionalDay : number) : number{
  let sum = 0
  let divisor = days + fractionalDay

  if(days == 0){
    sum = scores.reduce((a, b) => a + b, 0)
    divisor = 1
  } else if(!floatEquality(fractionalDay, 0)){
    // all days are weighted as equal, except last fractional day
    sum = scores.slice(0,-1).reduce((a,b) => a + b,0) + (scores.slice(-1)[0] * fractionalDay)
  } else {
    divisor = days
    sum = scores.reduce((a, b) => a + b, 0)
  }
  return sum / divisor
}

function brierScore(forecast : number, resolution : Resolution) : number {
  let trueValue = resolution == Resolution.YES ? 1 : 0
  return ((forecast - trueValue) ** 2) + (((1-forecast) - (1-trueValue)) ** 2)
}
