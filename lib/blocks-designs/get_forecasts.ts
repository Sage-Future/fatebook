import { ContextBlock, KnownBlock, Block } from '@slack/types'
import { conciseDateTime, formatDecimalNicely, getCommunityForecast, getResolutionEmoji } from '../../lib/_utils.js'
import { ForecastWithQuestionWithSlackMessagesAndForecasts } from '../../prisma/additional'
import { maxForecastsVisible, forecastListColumnSpacing } from '../_constants.js'
import { Blocks, getQuestionTitleLink, markdownBlock, textBlock, toActionId } from './_block_utils.js'

export async function buildGetForecastsBlocks(teamId: string, forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[], activePage : number, closedPage : number, activeForecast : boolean) : Promise<Blocks> {
  const latestForecasts = getLatestForecastPerQuestion(forecasts)

  const page = activeForecast ? activePage : closedPage

  const pagination = latestForecasts.length > maxForecastsVisible
  const firstPage  = page == 0
  const lastPage   = page == (Math.ceil(latestForecasts.length / maxForecastsVisible) -1)

  if(latestForecasts.length == 0) {
    return [buildEmptyResponseBlock()]
  }

  return await Promise.all([
    // slice latestForecasts to get the forecasts for the current page
    ...(await buildGetForecastsBlocksPage(teamId, latestForecasts.slice(page * maxForecastsVisible, (page + 1) * maxForecastsVisible))),
    ...(pagination ? [generateButtonsBlock(pagination, firstPage, lastPage, activePage, closedPage, activeForecast)]:[])
  ])
}

function generateButtonsBlock(pagination: boolean, firstPage: boolean, lastPage: boolean, activePage: number, closedPage : number, activeForecast : boolean) : Block {
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

async function buildGetForecastsBlocksPage(teamId: string, forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[]) : Promise<Blocks> {
  let blocks = await Promise.all([
    ...forecasts.map(async (forecast) => (
      {
			  'type': 'context',
        'elements': [
          markdownBlock((await buildForecastQuestionText(teamId, forecast))),
        ]
      } as ContextBlock
    ))
  ])
  return blocks as Blocks
}

async function buildForecastQuestionText(teamId: string, forecast : ForecastWithQuestionWithSlackMessagesAndForecasts) {
  const questionTitle = await getQuestionTitleLink(teamId, forecast.question)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const yourForecastValueStr    = formatDecimalNicely(100 * forecast.forecast.toNumber())
  const yourForecastValuePadded = 'You:' + padForecastPrettily(yourForecastValueStr, 3, forecastListColumnSpacing)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const commForecastValueStr    = formatDecimalNicely(100* getCommunityForecast(forecast.question, new Date()))
  const commForecastValuePadded = 'Community:' + padForecastPrettily(commForecastValueStr, 3, forecastListColumnSpacing)

  // resolution date
  const resolutionStr = forecast.question.resolution ?
    `Resolved: ${getResolutionEmoji(forecast.question.resolution)} ${forecast.question.resolution}`
    :
    `Resolves: ${conciseDateTime(forecast.question.resolveBy, false)}`

  return questionTitle + '\n' + yourForecastValuePadded + commForecastValuePadded + resolutionStr
}

// function used to align decimal places, even when no decimal places are present
function padForecastPrettily(forecast : string, maxprepad : number , maxpostpad : number ) : string {
  let prepad  = maxprepad
  let postpad = maxpostpad

  if (forecast.includes('.'))
    postpad = postpad - 4

  const integerPart = forecast.split('.')[0]
  if (integerPart.length > 1)
    prepad = prepad - 2

  const forecastPadded = ' '.repeat(prepad) + '`'+ forecast + '%`' + ' '.repeat(postpad)
  return forecastPadded
}

function buildEmptyResponseBlock(): KnownBlock {
  return {
    'type': 'section',
    'text': markdownBlock('_Time to make your first prediction! Create a question by typing `/forecast` in any channel._')
  }
}

function getLatestForecastPerQuestion(forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[]) {
  const latestForecasts = new Map<number, ForecastWithQuestionWithSlackMessagesAndForecasts>()
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
