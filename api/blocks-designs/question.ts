import { Block, KnownBlock } from '@slack/types'
import { QuestionWithForecastsAndAuthor } from '../../prisma/additional'

export function buildQuestionBlocks(question: QuestionWithForecastsAndAuthor): (KnownBlock | Block)[] {
  const quickPredictOptions = [10, 30, 50, 70, 90]

  return [
    {
      'type': 'section',
      'text': {
        'type': "mrkdwn",
        'text': `*${question.title}*`
      }
    },
    ...question.forecasts.map((forecast) => (
      {
        'type': 'context',
        'elements': [
          {
            'type': 'image',
            'image_url': 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
            'alt_text': 'profile picture'
          },
          {
            'type': "mrkdwn",
            'text': `${forecast.profile.slackId} ${forecast.forecast} - _submitted ${forecast.createdAt.toDateString()}_`
          }
        ]
      }
    )),
    {
      'type': 'actions',
      'elements': [
        ...quickPredictOptions.map((option) => ({
          'type': 'button',
          'text': {
            'type': "plain_text",
            'emoji': true,
            'text': `${option}%`
          },
          'style': 'primary',
          'value': 'click_me_123'
        })),
        {
          'type': 'button',
          'text': {
            'type': "plain_text",
            'emoji': true,
            'text': '....'
          },
          'value': 'click_me_123'
        }
      ]
    }
  ]
}