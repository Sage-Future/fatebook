import { Forecast, Question, Resolution } from '@prisma/client'
import { floatEquality } from "./_utils_common"

type ScoreTimeSeries = {
    [id: string]: number[]
}

type ForecastArray = {
    [id: string]: number | undefined
}

export type ScoreTuple = {
  relativeBrierScore: number | undefined
  absoluteBrierScore: number
  rank              : number
}

export type ScoreCollection = {
  [id: string]: ScoreTuple
}

export type DaysForecasts = {
  id : string
  forecasts : Forecast[]
  mostRecentForecast : number | undefined
}

export type DayAvgForecast = {
  id : string
  avgForecast : number | undefined
}


export function relativeBrierScoring(forecasts : Forecast[], question : Question) : ScoreCollection {
  if(forecasts.length == 0){
    return {}
  }

  const days      = (question.resolvedAt!.getTime() - question.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  const fractionalDay = days - Math.floor(days)

  let uniqueIds = Array.from(new Set(forecasts.map(f => f.userId)))

  // iterate over each time interval from start of question to
  //   resolution datetimes
  const day = (1000 * 60 * 60 * 24)
  const endDay = question.createdAt.getTime() + (Math.ceil(days) * day)

  let relativeScoreTimeSeries : ScoreTimeSeries = {}
  let absoluteScoreTimeSeries : ScoreTimeSeries = {}

  const sortedForecastsById : [string, Forecast[]][] = uniqueIds.map(id => {
    return [id, forecasts.filter(f => f.userId == id).sort((b, a) => b.createdAt.getTime() - a.createdAt.getTime())]
  })
  for (let j = question.createdAt.getTime(); j < endDay; j = j + day) {
    // dealing with fractional part of day at the end
    const currentInterval = j + day < question.resolvedAt!.getTime() ? j + day : question.resolvedAt!.getTime()
    const startOfInterval = j < question.resolvedAt!.getTime() ? j       : question.resolvedAt!.getTime()
    const lengthOfInterval = currentInterval - startOfInterval


    // get the most up to date forecast for each user before this time period
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
                                                                                                           lengthOfInterval)
    let absoluteBrierScores : [string, number | undefined][] = weightedForecastsOfCurrentIntervalById.map(({id, avgForecast}) => {
      if (avgForecast === undefined) {
        return [id, undefined]
      }else{
        return [id, brierScore(avgForecast, question.resolution!)]
      }
    })

    // get the median brier score for this time interval
    let medianBrierScore : number = median(absoluteBrierScores.map(([,score]) => score).filter(v => v !== undefined) as number[])



    // subtract the median brier score from the brier score from each user's forecast
    let relativeBrierScores : [string, number | undefined][] = weightedForecastsOfCurrentIntervalById.map(({id, avgForecast}) => {
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
      const [id,  relativeScore]  = <[string, number | undefined]> relativeBrierScores[i]
      const [, absoluteScore]  = <[string, number | undefined]> absoluteBrierScores[i]
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
  for(const id of Object.keys(relativeScoreTimeSeries)){
    avgScoresPerUser[id] = {
      relativeBrierScore : (
        uniqueIds.length === 1 ?
          undefined
          :
          averageForScoreResolution(relativeScoreTimeSeries[id], Math.floor(days), fractionalDay)
      ),
      absoluteBrierScore :
          averageForScoreResolution(absoluteScoreTimeSeries[id], Math.floor(days), fractionalDay),
      rank               : -1 //reassigned below
    }
  }

  //sort the user id's of avgScoresPerUser by their relative brier score
  let sortedIds : string[] = []
  if (uniqueIds.length != 1) {
    sortedIds = Object.keys(avgScoresPerUser).map(id => id).sort((a, b) => avgScoresPerUser[a].relativeBrierScore! - avgScoresPerUser[b].relativeBrierScore!)
  } else {
    sortedIds = uniqueIds
  }

  for (let i = 0; i < sortedIds.length; i++) {
    console.log({avgScoresPerUser, sortedIds, relativeScoreTimeSeries, sortedForecastsById, forecasts})
    avgScoresPerUser[sortedIds[i]].rank = i+1
  }

  return avgScoresPerUser
}

function getWeightedAverageForecastOfInterval(forecastsOfCurrentIntervalbyId : DaysForecasts[], startOfInterval : number, day : number)  : DayAvgForecast[]{
  // mapping for each id
  return forecastsOfCurrentIntervalbyId.map(({id, forecasts, mostRecentForecast}) => {
    let avg          = 0
    let sumOfWeights = 0

    if (mostRecentForecast != undefined && forecasts.length > 0){
      const thisForecast = mostRecentForecast
      const nextForecast = forecasts[0]
      const mostRecentWeight = (nextForecast.createdAt.getTime() - startOfInterval) / day
      sumOfWeights     = sumOfWeights + mostRecentWeight
      avg              = avg + (mostRecentWeight * thisForecast)
    } else if (mostRecentForecast != undefined){
      return {id, avgForecast : mostRecentForecast}
    } else if (forecasts.length == 0){
      return {id, avgForecast:undefined}
    }

    for(let i = 0; i < forecasts.length - 1; i++){
      const thisForecast = forecasts[i]
      const nextForecast = forecasts[i+1]
      const thisWeight = (nextForecast.createdAt.getTime() - thisForecast.createdAt.getTime()) / day
      sumOfWeights     = sumOfWeights + thisWeight
      avg              = avg + (thisWeight * thisForecast.forecast.toNumber())
    }

    const lastForecastWeight = 1 - sumOfWeights
    avg = avg + (lastForecastWeight * forecasts[forecasts.length-1].forecast.toNumber())
    return {id, avgForecast : avg}
  })
}

function getMostRecentForecasts(sortedForecastsById : [string, Forecast[]][], startOfInterval : number) : ForecastArray {
  let mostRecentForecasts : ForecastArray = {}
  for(const idEntry of sortedForecastsById){
    const id = idEntry[0]
    const sortedForecasts : Forecast[] = idEntry[1]
    const forecastsBeforeCurrentInterval = sortedForecasts.filter(f => f.createdAt.getTime() <= startOfInterval)

    if (forecastsBeforeCurrentInterval.length > 0) {
      mostRecentForecasts[id] = (forecastsBeforeCurrentInterval[forecastsBeforeCurrentInterval.length-1].forecast.toNumber())
    } else {
      mostRecentForecasts[id] = undefined
    }
  }
  return mostRecentForecasts
}

function median(values : number[]) : number {
  if (values.length === 0) return 0
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
