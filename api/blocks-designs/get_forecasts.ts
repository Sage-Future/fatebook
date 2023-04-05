import { ForecastWithQuestionWithSlackMessagesAndForecasts } from '../../prisma/additional'
import { KnownBlock } from '@slack/types'
import { conciseDateTime, getSlackPermalinkFromChannelAndTS, getCommunityForecast, formatDecimalNicely } from '../_utils.js'
import { Blocks } from './_block_utils.js'
import { maxForecastsVisible } from '../_constants.js'

export function buildGetForecastsBlocks(forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[]): Blocks {
  if(forecasts.length === 0) {
    return [buildEmptyResponseBlock()]
  } else if (forecasts.length <= maxForecastsVisible) {
    return buildGetForecastsBlocksPage(forecasts, false, 1)
  }

  return buildGetForecastsBlocksPage(forecasts.slice(0,maxForecastsVisible-1), true, 0)
}

function buildGetForecastsBlocksPage(forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[], pagination : boolean, page: number): Blocks {
  let blocks = [
    buildResponseBlock(forecasts.length),
    ...forecasts.map((forecast) => (
      {
			  "type": "section",
			  "text": {
			  	"type": "mrkdwn",
          "text": buildForecastQuestionText(forecast)
        }
      }
    )),
    {
      "type": "divider"
    }
  ]
  if (pagination)
    console.log(page)
    //maybeGenerateButtonsBlock(forecasts)
  return blocks
}

function buildForecastQuestionText(forecast : ForecastWithQuestionWithSlackMessagesAndForecasts): string {
  // Question title
  let questionTitle = `*${forecast.question.title}*`
  try {
    const slackMessage  = forecast.question.slackMessages[0]!
    const slackPermalink = getSlackPermalinkFromChannelAndTS(slackMessage.channel, slackMessage.ts)
    questionTitle = `*<${slackPermalink}|${forecast.question.title}>*`
  } catch (err) {
    console.log('No original forecast message found:', err)
  }

  // get the length of the string to represent forecast.forecast as two digit decimal
  const yourForecastValueStr    = formatDecimalNicely(forecast.forecast.toNumber())
  const yourForecastValuePadded = 'You:' + padForecastPrettily(yourForecastValueStr, 3, 8)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const commForecastValueStr    = formatDecimalNicely(getCommunityForecast(forecast.question, new Date()))
  const commForecastValuePadded = 'Community:' + padForecastPrettily(commForecastValueStr, 3, 8)

  // resolution date
  const resolutionDateStr       = 'Resolves: ' + conciseDateTime(forecast.question.resolveBy, false)

  return questionTitle + '\n' + yourForecastValuePadded + commForecastValuePadded + resolutionDateStr
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
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `We found *0 open forecasts*! Perhaps you should start making some?`
    }
  }
}

function buildResponseBlock(numForecasts : number): KnownBlock {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `We found *${numForecasts} open forecasts*`
    }
  }
  //"accessory": {
  //  "type": "overflow",
  //	"options": buildSortingOptionsBlocks()
  //}
}

//function buildSortingAccessory(): Overflow {
//  const options  = [ 'date', 'title', 'difference from community' ] as SortForecastsActionParts['field'][]
//  const ordering = [ 'asc', 'desc' ]  as SortForecastsActionParts['order'][]
//  return {
//    "type": "overflow",
//    options: options.flatMap((option) => {
//      //map for each ordering
//      return ordering.map((order) => (
//        {
//	  		"text": {
//	  			"type": "plain_text",
//	  			"text": `${option[0].toUpperCase() + option.slice(1)} ${order}`,
//	  			"emoji": true
//	  		},
//	  		"value": toActionId({action: 'sortforecasts',
//            field: option,
//            order: order})
//	  	  }
//      ))
//    })
//  }
//}
