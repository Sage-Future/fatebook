import { Forecast, QuestionScore } from '@prisma/client'
import { Block, ContextBlock, KnownBlock } from '@slack/types'
import { ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts } from '../../prisma/additional'
import { Blocks, buildForecastQuestionText, markdownBlock, textBlock, toActionId } from './_block_utils'
import { maxDecimalPlacesForecastForecastListing, maxForecastsVisible } from '../_constants'


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
                                                         questionScores.find((qs : QuestionScore) => qs.questionId == forecast.questionId),
                                                         maxDecimalPlacesForecastForecastListing))),
        ]
      } as ContextBlock
    ))
  ])
  return blocks as Blocks
}

function getLatestForecastPerQuestion(forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[]) {
  const latestForecasts = new Map<string, ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts>()
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
