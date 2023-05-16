import { ModalView } from '@slack/types'
import { displayForecast, getDateSlackFormat } from '../../lib/_utils'
import { ForecastWithProfileAndUser, QuestionWithForecastWithProfileAndUserWithProfilesWithGroups } from '../../prisma/additional'
import { defaultDisplayPictureUrl, maxDecimalPlacesForecastLogListing, noForecastsMessage } from '../_constants'
import { markdownBlock, maybeQuestionResolutionBlock, questionForecastInformationBlock, textBlock } from './_block_utils'
import { Forecast } from '@prisma/client'

function formatForecast(forecast: Forecast, maxDecimalPlaces : number = maxDecimalPlacesForecastLogListing){
  return displayForecast(forecast, maxDecimalPlaces)
}

export function buildQuestionForecastLogModalView(question: QuestionWithForecastWithProfileAndUserWithProfilesWithGroups, slackUserId : string): ModalView {
  const hideForecasts =
    (question.hideForecastsUntil && question.hideForecastsUntil?.getTime() > Date.now())
    || false
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
      ...maybeQuestionResolutionBlock(question),
      questionForecastInformationBlock(question, hideForecasts),
      ...forecasts
        .sort((b, a) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((forecast) => (
          {
            'type': 'context',
            'elements': [
              {
                'type': 'image',
                'image_url': forecast.profile.user.image ||  defaultDisplayPictureUrl,
                'alt_text': 'profile picture'
              },
              markdownBlock(
                `${forecast.profile.slackId ? `<@${forecast.profile.slackId}>` : forecast.profile.user.name} ` +
                `*${formatForecast(forecast)}*` +
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

function getForecastsOfUser(forecasts: ForecastWithProfileAndUser[], slackUserId: string) {
  const userId = forecasts.find(forecast => forecast.profile.slackId === slackUserId)?.profile.user.id
  return userId ? forecasts.filter(forecast => forecast.profile.user.id === userId) : []
}