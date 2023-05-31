import { Forecast } from '@prisma/client'
import { ModalView } from '@slack/types'
import { ForecastWithUserWithProfiles, QuestionWithForecastWithUserWithProfiles } from '../../prisma/additional'
import { defaultDisplayPictureUrl, maxDecimalPlacesForecastLogListing, noForecastsMessage } from '../_constants'
import { displayForecast, forecastsAreHidden } from "../_utils_common"
import { getDateSlackFormat, getUserNameOrProfileLink } from '../_utils_server'
import { markdownBlock, maybeQuestionResolutionBlock, questionForecastInformationBlock, textBlock } from './_block_utils'

function formatForecast(forecast: Forecast, maxDecimalPlaces : number = maxDecimalPlacesForecastLogListing){
  return displayForecast(forecast, maxDecimalPlaces)
}

export function buildQuestionForecastLogModalView(teamId : string, question: QuestionWithForecastWithUserWithProfiles, slackUserId : string): ModalView {
  const hideForecasts = forecastsAreHidden(question)
  const forecasts = hideForecasts
    ? getForecastsOfUser(question.forecasts, slackUserId)
    : question.forecasts
  const title     = hideForecasts ? 'My forecasts' : 'All forecasts'
  return {
    'type': 'modal',
    'title': textBlock(title),
    'blocks': [
      {
        'type': 'section',
        'text': markdownBlock(`*${question.title}*`),
      },
      ...maybeQuestionResolutionBlock(teamId, question),
      questionForecastInformationBlock(question, hideForecasts),
      ...forecasts
        .sort((b, a) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((forecast) => (
          {
            'type': 'context',
            'elements': [
              {
                'type': 'image',
                'image_url': forecast.user.image ||  defaultDisplayPictureUrl,
                'alt_text': 'profile picture'
              },
              markdownBlock(
                getUserNameOrProfileLink(teamId, forecast.user) +
                ` *${formatForecast(forecast)}*` +
                ` - _submitted ${getDateSlackFormat(forecast.createdAt, true, 'date_short_pretty')}_`
              )
            ]
          }
        )),
      ...(forecasts.length === 0 ? [{
        'type': 'context',
        'elements': [
          markdownBlock(noForecastsMessage)
        ]
      }] : []),
    ]
  }
}

function getForecastsOfUser(forecasts: ForecastWithUserWithProfiles[], slackUserId: string) {
  const userId = forecasts.find(forecast => forecast.user.profiles.find(p => p.slackId === slackUserId))?.user.id
  return userId ? forecasts.filter(forecast => forecast.user.id === userId) : []
}