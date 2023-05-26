import { Block, ContextBlock, KnownBlock } from '@slack/types'
import { getDateSlackFormat, formatDecimalNicely, getCommunityForecast, getResolutionEmoji, formatScoreNicely, getSlackPermalinkFromChannelAndTS } from '../../lib/_utils'
import { ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts, QuestionWithResolutionMessages } from '../../prisma/additional'
import { ambiguousResolutionColumnSpacing, forecastListColumnSpacing, forecastPrepad, maxDecimalPlacesForecastForecastListing, maxDecimalPlacesScoreForecastListing, maxForecastsVisible, maxScoreDecimalPlacesListing, noResolutionColumnSpacing, scorePrepad, yesResolutionColumnSpacing } from '../_constants'
import { Blocks, getQuestionTitleLink, markdownBlock, textBlock, toActionId } from './_block_utils'
import { Forecast, QuestionScore, Resolution } from '@prisma/client'

function roundForecast(forecast: number, decimalPlaces :number = maxDecimalPlacesForecastForecastListing){
  return formatDecimalNicely(forecast, decimalPlaces)
}

function roundScore(score: number, decimalPlaces :number = maxDecimalPlacesScoreForecastListing, sf : number = maxScoreDecimalPlacesListing){
  return formatScoreNicely(score, decimalPlaces, sf)
}

export async function buildGetForecastsBlocks(forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[], activePage : number, closedPage : number, activeForecast : boolean, noForecastsText: string, questionScores : QuestionScore[]) : Promise<Blocks> {
  const latestForecasts = getLatestForecastPerQuestion(forecasts)

  const page = activeForecast ? activePage : closedPage

  const pagination = latestForecasts.length > maxForecastsVisible
  const firstPage  = page == 0
  const lastPage   = page == (Math.ceil(latestForecasts.length / maxForecastsVisible) -1)

  if(latestForecasts.length == 0) {
    return [{
      'type': 'section',
      'text': markdownBlock(noForecastsText)
    }]
  }

  const forecastsForPage = latestForecasts.slice(page * maxForecastsVisible, (page + 1) * maxForecastsVisible)
  const scoresForPage    = matchForecastsToScores(forecastsForPage, questionScores)

  return await Promise.all([
    // slice latestForecasts to get the forecasts for the current page
    ...(await buildGetForecastsBlocksPage(forecastsForPage, scoresForPage)),
    ...(pagination ? [generateButtonsBlock(firstPage, lastPage, activePage, closedPage, activeForecast)]:[])
  ])
}

function matchForecastsToScores(forecasts : Forecast[], questionScores : QuestionScore[]){
  const forecastScores = questionScores.filter((qs : QuestionScore) => forecasts.find((f) => qs.questionId == f.questionId))
  return forecastScores
}

function generateButtonsBlock(firstPage: boolean, lastPage: boolean, activePage: number, closedPage : number, activeForecast : boolean) : Block {
  return {
    'type': 'actions',
    'elements': [
      ...(!firstPage ? [{
        'type': 'button',
        'text': textBlock('Previous Page'),
        'value': 'previous_page',
        'action_id': toActionId({
          'action': 'homeAppPageNavigation',
          'direction': 'previous',
          'activePage': activePage,
          'closedPage': closedPage,
          'isForActiveForecasts': activeForecast,
        })
      }] : []),
      ...(!lastPage ? [{
        'type': 'button',
        'text': textBlock('Next Page'),
        'value': 'next_page',
        'action_id': toActionId({
          'action': 'homeAppPageNavigation',
          'direction': 'next',
          'activePage': activePage,
          'closedPage': closedPage,
          'isForActiveForecasts': activeForecast,
        })
      }] : [])
    ]
  } as KnownBlock
}

async function buildGetForecastsBlocksPage(forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[], questionScores : QuestionScore[]) : Promise<Blocks> {
  let blocks = await Promise.all([
    ...forecasts.map(async (forecast) => (
      {
			  'type': 'context',
        'elements': [
          markdownBlock((await buildForecastQuestionText(forecast,
                                                         questionScores.find((qs : QuestionScore) => qs.questionId == forecast.questionId)))),
        ]
      } as ContextBlock
    ))
  ])
  return blocks as Blocks
}

async function buildForecastQuestionText(forecast : ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts, questionScore : QuestionScore | undefined) {
  const questionTitle = await getQuestionTitleLink(forecast.question)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const yourForecastValueStr    = roundForecast(100 * forecast.forecast.toNumber())
  const yourForecastValuePadded = 'You:' + padForecast(yourForecastValueStr)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const hideForecasts = forecast.question.hideForecastsUntil !== null && forecast.question.hideForecastsUntil > new Date()
  const commForecastValueStr    = (hideForecasts ?
    '?'
    :
    roundForecast(100* getCommunityForecast(forecast.question, new Date()))
  )
  const commForecastValuePadded = 'Community:' + padForecast(commForecastValueStr)

  // resolution date
  const resolutionStr = forecast.question.resolution ?
    `Resolved: ${getResolutionEmoji(forecast.question.resolution)} ${shortResolution(forecast.question.resolution)}`
    :
    `Resolves:${getDateSlackFormat(forecast.question.resolveBy, false, 'date_short_pretty')}`

  const resolutionPadded = questionScore ?
    resolutionStr + padResolution(forecast.question.resolution)
    :
    resolutionStr

  let scoreStr
  if(questionScore) {
    const scoreLink = forecast.profileId && await getScoreLink(forecast.question, forecast.profileId)

    const scoreStrLabel     = questionScore.relativeScore !== null ? `Relative score:` : `Brier score:`
    const scoreStrLabelPad  = questionScore.relativeScore !== null ? `` : `      `
    const scoreStrLinklabel = scoreLink ? `<${scoreLink}|${scoreStrLabel}>${scoreStrLabelPad}` : scoreStrLabel+scoreStrLabelPad

    scoreStr = scoreStrLinklabel+padAndFormatScore(questionScore.absoluteScore.toNumber())
  } else {
    scoreStr = ''
  }

  return questionTitle + '\n' + yourForecastValuePadded + commForecastValuePadded + resolutionPadded + scoreStr
}

async function getScoreLink(question : QuestionWithResolutionMessages, profileId : number) {
  const resolutionMessage = question.resolutionMessages.filter((rm) => rm.profileId == profileId)
    .sort((b,a) => a.id - b.id)[0]?.message
  if (resolutionMessage) {
    return await getSlackPermalinkFromChannelAndTS(resolutionMessage.teamId, resolutionMessage.channel, resolutionMessage.ts)
  } else {
    return undefined
  }
}

function shortResolution(resolution : Resolution | null){
  switch(resolution){
    case 'YES':
    case 'NO':
      return resolution
    case 'AMBIGUOUS':
      return 'N/A'
    case null:
    default:
      return ''
  }
}

function padResolution(resolution : Resolution | null){
  switch(resolution){
    case 'YES':
      return ' '.repeat(yesResolutionColumnSpacing)
    case 'NO':
      return ' '.repeat(noResolutionColumnSpacing)
    case 'AMBIGUOUS':
      return ' '.repeat(ambiguousResolutionColumnSpacing)
    case null:
      return ' '.repeat(forecastListColumnSpacing)
    default:
      return ' '.repeat(forecastListColumnSpacing)
  }
}

function padAndFormatScore(score : number, maxprepad : number = scorePrepad){
  let prepad  = maxprepad

  if (score < 0)
    prepad = prepad - 2

  const scorePadded = ' '.repeat(prepad) + '`'+ roundScore(score) + '`'
  return scorePadded
}

// function used to align decimal places, even when no decimal places are present
function padForecast(forecast : string, maxprepad : number = forecastPrepad, maxpostpad : number = forecastListColumnSpacing ) : string {
  let prepad  = maxprepad
  let postpad = maxpostpad

  if (forecast.includes('.'))
    postpad = postpad - 4

  const integerPart = forecast.split('.')[0]
  if (integerPart.length == 2){
    prepad = prepad - 2
  } else if ( integerPart.length == 3){
    prepad = prepad - 4
  }

  const forecastPadded = ' '.repeat(prepad) + '`'+ forecast + '%`' + ' '.repeat(postpad)
  return forecastPadded
}

function getLatestForecastPerQuestion(forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[]) {
  const latestForecasts = new Map<number, ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts>()
  for (const forecast of forecasts) {
    if (!latestForecasts.has(forecast.questionId)) {
      latestForecasts.set(forecast.questionId, forecast)
    } else {
      const latestForecast = latestForecasts.get(forecast.questionId)
      if (latestForecast!.createdAt < forecast.createdAt) {
        latestForecasts.set(forecast.questionId, forecast)
      }
    }
  }
  return Array.from(latestForecasts.values())
}

//function buildSortingAccessory(): Overflow {
//  const options  = [ 'date', 'title', 'difference from community' ] as SortForecastsActionParts['field'][]
//  const ordering = [ 'asc', 'desc' ]  as SortForecastsActionParts['order'][]
//  return {
//    'type': 'overflow',
//    options: options.flatMap((option) => {
//      //map for each ordering
//      return ordering.map((order) => (
//        {
//	  		'text': {
//	  			'type': 'plain_text',
//	  			'text': `${option[0].toUpperCase() + option.slice(1)} ${order}`,
//	  			'emoji': true
//	  		},
//	  		'value': toActionId({action: 'sortforecasts',
//            field: option,
//            order: order})
//	  	  }
//      ))
//    })
//  }
//}
