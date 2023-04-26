import { Resolution } from '@prisma/client'
import { QuestionWithAuthorAndQuestionMessages } from '../../prisma/additional'
import { feedbackFormUrl, slackAppId } from '../_constants'
import { formatDecimalNicely, getResolutionEmoji, resolutionToString } from '../_utils'
import type { Blocks } from './_block_utils'
import { dividerBlock, feedbackOverflow, getQuestionTitleLink, markdownBlock } from './_block_utils'

type ResolveQuestionDetails = {
  brierScore: number
  rBrierScore: number
  ranking: number
  totalParticipants: number
  lastForecast: number
  lastForecastDate: string
  overallBrierScore: number
  overallRBrierScore: number
}

export async function buildQuestionResolvedBlocks(teamId: string, question: QuestionWithAuthorAndQuestionMessages, details : ResolveQuestionDetails | undefined = undefined) {
  const questionLink       = await getQuestionTitleLink(teamId, question)
  if(question.resolution == null){
    return [
      {
        'type': 'section',
        'text': markdownBlock(`${questionLink} *resolution has been undone!*`),
      },
      {
        'type': 'context',
        'elements': [
          markdownBlock(`Unresolved by <@${question.profile.slackId}>`)
        ],
        // 'accessory': feedbackOverflow()
      },
    ]
  }
  const questionResolution = resolutionToString(question.resolution!)
  return [
    {
      'type': 'section',
      'text': markdownBlock(`${questionLink} *resolved ${questionResolution} ${getResolutionEmoji(question.resolution)}*`),
      'accessory': feedbackOverflow()
    },
    {
      'type': 'context',
      'elements': [
        markdownBlock(`Resolved by <@${question.profile.slackId}>`)
      ],
      // 'accessory': feedbackOverflow()
    },
    dividerBlock(),
    ...(((question.resolution!) != Resolution.AMBIGUOUS) ? generateNonAmbiguousResolution(details!) : generateAmbiguousResolution()),
    dividerBlock(),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`<slack://app?team=${teamId}&id=${slackAppId}&tab=home|See your full forecasting history.>`),
        markdownBlock(`_Thanks for using our bot! We'd love to <${feedbackFormUrl}/|hear your feedback>_`)
      ]
    }
  ]
}

function generateNonAmbiguousResolution(details : ResolveQuestionDetails) : Blocks {
  return [
    {
      'type': 'section',
      'fields': [
        markdownBlock(`*Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(details.brierScore, 6)}`),
        markdownBlock(`*Relative Brier score*\n ${formatDecimalNicely(details.rBrierScore, 6)}`),
        markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
        markdownBlock(`*Your last forecast*\n ${details.lastForecast}% _at ${details.lastForecastDate}_`)
      ]
    },
    dividerBlock(),
    {
      'type': 'section',
      'fields': [
        markdownBlock(`*Brier score across all questions:*\n ${formatDecimalNicely(details.overallBrierScore, 6)}`),
        markdownBlock(`*Relative Brier score across all questions:*\n ${formatDecimalNicely(details.overallRBrierScore, 6)}`)
      ]
    }
  ]
}

function generateAmbiguousResolution() : Blocks {
  return [
    {
      'type': 'section',
      'text': markdownBlock(`No scoring due to ambiguous resolution!`),
    }
  ]
}
