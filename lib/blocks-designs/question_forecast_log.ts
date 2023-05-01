import { QuestionWithForecastsAndUsersAndAuthor } from '../../prisma/additional'
import { ModalView } from '@slack/types'
import { noForecastsMessage, defaultDisplayPictureUrl } from '../_constants'
import { maybeQuestionResolutionBlock, questionForecastInformationBlock, markdownBlock, textBlock } from './_block_utils'
import { conciseDateTime, displayForecast } from '../../lib/_utils'

export function buildQuestionForecastLogModalView(question: QuestionWithForecastsAndUsersAndAuthor): ModalView {
  return {
    'type': 'modal',
    'title': textBlock(`All forecasts`),
    'blocks': [
      {
        'type': 'section',
        'text': markdownBlock(`*${question.title}*`),
      },
      ...maybeQuestionResolutionBlock(question),
      questionForecastInformationBlock(question),
      ...question.forecasts
        .sort((b, a) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((forecast) => (
          {
            'type': 'context',
            'elements': [
              {
                'type': 'image',
                'image_url': forecast.profile.user.imageUrl ||  defaultDisplayPictureUrl,
                'alt_text': 'profile picture'
              },
              markdownBlock(
                `${forecast.profile.slackId ? `<@${forecast.profile.slackId}>` : forecast.profile.user.name} ` +
                `*${displayForecast(forecast)}*` +
                ` - _submitted at ${conciseDateTime(forecast.createdAt)}_`
              )
            ]
          }
        )),
      ...(question.forecasts.length === 0 ? [{
        'type': 'context',
        'elements': [
          markdownBlock(noForecastsMessage)
        ]
      }] : []),
    ]
  }
}
