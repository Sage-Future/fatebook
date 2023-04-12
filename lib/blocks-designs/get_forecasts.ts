import { ForecastWithQuestionWithSlackMessagesAndForecasts } from '../../prisma/additional'
import { KnownBlock } from '@slack/types'
import { conciseDateTime, getSlackPermalinkFromChannelAndTS, getCommunityForecast, formatDecimalNicely } from '../../lib/_utils.js'
import { maxForecastsVisible } from '../_constants.js'
import { markdownBlock } from './_block_utils.js'

export async function buildGetForecastsBlocks(teamId: string, forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[]) {
  if(forecasts.length == 0) {
    return [buildEmptyResponseBlock()]
  } else if (forecasts.length <= maxForecastsVisible) {
    return await buildGetForecastsBlocksPage(teamId, forecasts, false, 1)
  }

  return await buildGetForecastsBlocksPage(teamId, forecasts.slice(0,maxForecastsVisible-1), true, 0)
}

async function buildGetForecastsBlocksPage(teamId: string, forecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[], pagination : boolean, page: number) {
  let blocks = await Promise.all([
    buildResponseBlock(forecasts.length),
    {
      "type": "divider"
    },
    ...forecasts.map(async (forecast) => (
      {
			  "type": "section",
			  "text": markdownBlock((await buildForecastQuestionText(teamId, forecast)))
      }
    )),
    {
      "type": "divider"
    }
  ])
  if (pagination) { // @FRANCIS - I added these curly brackets for clarity, not sure if maybeGenerateButtonsBlock should be inside or outside!
    console.log(page)
    //maybeGenerateButtonsBlock(forecasts)
  }
  return blocks
}

async function buildForecastQuestionText(teamId: string, forecast : ForecastWithQuestionWithSlackMessagesAndForecasts) {
  // Question title
  let questionTitle = `*${forecast.question.title}*`
  try {
    const slackMessage  = forecast.question.slackMessages[0]!
    const slackPermalink = await getSlackPermalinkFromChannelAndTS(teamId, slackMessage.channel, slackMessage.ts)
    questionTitle = `*<${slackPermalink}|${forecast.question.title}>*`
  } catch (err) {
    console.log('No original forecast message found:', err)
  }

  // get the length of the string to represent forecast.forecast as two digit decimal
  const yourForecastValueStr    = formatDecimalNicely(100 * forecast.forecast.toNumber())
  const yourForecastValuePadded = 'You:' + padForecastPrettily(yourForecastValueStr, 3, 8)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const commForecastValueStr    = formatDecimalNicely(100* getCommunityForecast(forecast.question, new Date()))
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
      "text": `We found *0 open forecasts*! Time to start making some?`
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
