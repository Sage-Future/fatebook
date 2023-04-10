import { Question } from '@prisma/client'
import { ActionsBlock, InputBlock, SectionBlock } from '@slack/types'
import { QuestionWithForecastsAndUsersAndAuthor } from '../../prisma/additional'
import { conciseDateTime, round } from '../_utils.js'
import { Blocks, markdownBlock, ResolveQuestionActionParts, textBlock, toActionId } from './_block_utils.js'

export function buildQuestionBlocks(question: QuestionWithForecastsAndUsersAndAuthor): Blocks {

  return [
    {
      'type': 'header',
      'text': textBlock(question.title)
    },
    ...(question.notes ? [{
      'type': 'section',
      'text': textBlock(`${question.notes}`)
    } as SectionBlock] : []),
    ...question.forecasts.map((forecast) => (
      {
        'type': 'context',
        'elements': [
          {
            'type': 'image',
            'image_url': forecast.profile.user.imageUrl || 'https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg',
            'alt_text': 'profile picture'
          },
          // todo update this for non-slack profiles or profiles from other workspaces (can't mention them)
          markdownBlock(
            `*${`<@${forecast.profile.slackId}>` || 'Unknown user'}* ` +
            `${(round(forecast.forecast.toNumber() * 100))}%` +
            ` - _submitted at ${conciseDateTime(forecast.createdAt)}_`
          )
        ]
      }
    )),
    ...(question.forecasts.length === 0 ? [{
      'type': 'context',
      'elements': [
        markdownBlock(`_No forecasts yet_`)
      ]
    }] : []),
    buildPredictOptions(question),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`_Created by <@${question.profile.slackId}> using /forecast_`)
      ]
    },
    {
      'type': 'actions',
      elements: [
        {
          'type': 'static_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Resolve question',
            'emoji': true
          },
          'action_id': toActionId({
            action: 'resolve',
            questionId: question.id,
          }),
          'options': (['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]).map(
            (answer) => ({
              'text': textBlock(answer![0].toUpperCase() + answer!.slice(1)), // capitalize,
              'value': answer
            })
          )
        },
        {
          'type': 'button',
          'text': textBlock('Edit'),
          'action_id': toActionId({
            action: 'editQuestionBtn',
            questionId: question.id,
          })
        }
      ]
    }
  ]
}

function buildPredictOptions(question: Question): InputBlock | ActionsBlock {

  const useFreeTextInput = true

  const quickPredictOptions = [10, 30, 50, 70, 90]

  if (useFreeTextInput) {
    return {
      'dispatch_action': true,
      'type': 'input',
      'element': {
        'type': 'plain_text_input',
        'placeholder': textBlock('e.g. \'70%\''),
        'action_id': toActionId({
          action: 'submitTextForecast',
          questionId: question.id,
        })
      },
      'label': textBlock('Make a prediction'),
    }
  } else {
    return {
      'type': 'actions',
      'elements': [
        ...quickPredictOptions.map((option) => ({
          'type': 'button',
          'text': textBlock(`${option}%`),
          'style': 'primary',
          'value': 'click_me_123'
        })),
        {
          'type': 'button',
          'text': textBlock('....'),
          'value': 'click_me_123'
        }
      ]
    }
  }

}