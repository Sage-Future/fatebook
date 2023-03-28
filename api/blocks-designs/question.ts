import { Question } from '@prisma/client'
import { ActionsBlock, Block, InputBlock, KnownBlock } from '@slack/types'
import { QuestionWithForecastsAndAuthor } from '../../prisma/additional'

export function buildQuestionBlocks(question: QuestionWithForecastsAndAuthor): (KnownBlock | Block)[] {

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
            'image_url': forecast.profile.user.imageUrl || 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
            'alt_text': 'profile picture'
          },
          {
            'type': "mrkdwn",
            'text': `*${forecast.profile.user.name || "Unknown user"}* ${forecast.forecast.toNumber() * 100}% - _submitted ${forecast.createdAt.toDateString()}_`
          }
        ]
      }
    )),
    showPredictOptions(question)
  ]
}

function showPredictOptions(question: Question): InputBlock | ActionsBlock {

  const useFreeTextInput = false

  const quickPredictOptions = [10, 30, 50, 70, 90]

  if (useFreeTextInput) {
    return {
      "dispatch_action": true,
      "type": "input",
      "element": {
        "type": "plain_text_input",
        "placeholder": {
          "type": "plain_text",
          "text": "e.g. '70%'"
        },
        "action_id": "plain_text_input-action"
      },
      "label": {
        "type": "plain_text",
        "text": "Make a prediction",
        "emoji": true
      }
    }
  } else {
    return {
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
  }

}