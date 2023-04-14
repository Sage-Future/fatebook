import { Question, Resolution } from '@prisma/client'
import { ActionsBlock, InputBlock, SectionBlock } from '@slack/types'
import { QuestionWithForecastsAndUsersAndAuthor } from '../../prisma/additional'
import { conciseDateTime, getDateYYYYMMDD, getResolutionEmoji, round } from '../../lib/_utils.js'
import { Blocks, markdownBlock, ResolveQuestionActionParts, textBlock, toActionId } from './_block_utils.js'
import { feedbackFormUrl } from '../_constants.js'

export function buildQuestionBlocks(question: QuestionWithForecastsAndUsersAndAuthor): Blocks {

  return [
    {
      'type': 'section',
      'text': markdownBlock(`*${question.title}*`),
      'accessory': {
        'type': 'overflow',
        'action_id': toActionId({
          action: 'questionOverflow',
          questionId: question.id,
        }),
        'options': [
          ...(question.resolution ?
            [
              {
                'text': textBlock('Undo resolve'),
                'value': 'undo_resolve',
              }
            ]
            :
            (['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]).map(
              (answer) => ({
                'text': textBlock(`${getResolutionEmoji(answer?.toUpperCase() as Resolution)} Resolve ${answer}`),
                'value': `resolve_${answer}`
              })
            )
          ),
          {
            'text': textBlock('Edit question'),
            'value': 'edit_question',
          },
          {
            'text': textBlock('Give feedback on this bot'),
            'value': 'give_feedback',
            'url': feedbackFormUrl
          },
        ]
      }
    },
    ...(question.resolution ? [{
      'type': 'section',
      // NB: this assumes that the author resolved the question
      'text': markdownBlock(`${getResolutionEmoji(question.resolution)} Resolved *${question.resolution}* by <@${question.profile.slackId}>`
        + (question.resolvedAt ? ` on ${getDateYYYYMMDD(question.resolvedAt)}` : '')),
    } as SectionBlock] : [{
      'type': 'section',
      'text': markdownBlock(`Resolves on ${getDateYYYYMMDD(question.resolveBy)}`)
    } as SectionBlock]),
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
            'image_url': forecast.profile.user.imageUrl || 'https://camo.githubusercontent.com/eb6a385e0a1f0f787d72c0b0e0275bc4516a261b96a749f1cd1aa4cb8736daba/68747470733a2f2f612e736c61636b2d656467652e636f6d2f64663130642f696d672f617661746172732f6176615f303032322d3531322e706e67',
            'alt_text': 'profile picture'
          },
          markdownBlock(
            `*${forecast.profile.slackId ? `<@${forecast.profile.slackId}>` : forecast.profile.user.name}* ` +
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
    ...(!question.resolution ? [buildPredictOptions(question)] : []),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`_Created by <@${question.profile.slackId}> using /forecast_`)
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