import { Resolution } from '@prisma/client'
import { QuestionWithAuthorAndQuestionMessages } from '../../prisma/additional'
import { feedbackFormUrl, maxDecimalPlacesForResolution, slackAppId } from '../_constants'
import { formatDecimalNicely, getResolutionEmoji, resolutionToString } from "../_utils_common"
import { getUserNameOrProfileLink } from '../_utils_server'
import type { Blocks } from './_block_utils'
import { dividerBlock, feedbackOverflow, getQuestionTitleLink, markdownBlock } from './_block_utils'

type ResolveQuestionDetails = {
  brierScore: number
  rBrierScore: number | undefined
  ranking: number
  totalParticipants: number
  lastForecast: number
  lastForecastDate: string
  overallBrierScore: number | undefined
  overallRBrierScore: number | undefined
}

export async function buildQuestionResolvedBlocks(teamId: string, question: QuestionWithAuthorAndQuestionMessages, details : ResolveQuestionDetails | undefined = undefined) {
  const questionLink       = await getQuestionTitleLink(question)
  if(question.resolution == null){
    return [
      {
        'type': 'section',
        'text': markdownBlock(`${questionLink} *resolution has been undone!*`),
      },
      {
        'type': 'context',
        'elements': [
          markdownBlock(`Unresolved by ${getUserNameOrProfileLink(teamId, question.user)}`)
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
        markdownBlock(`Resolved by ${getUserNameOrProfileLink(teamId, question.user)}`)
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
        markdownBlock(`_Thanks for using <https://fatebook.io/for-slack|Fatebook for Slack>! We'd love to <${feedbackFormUrl}/|hear your feedback>_`)
      ]
    }
  ]
}

function generateNonAmbiguousResolution(details : ResolveQuestionDetails) : Blocks {
  const formatScore = (score: number | undefined) => {
    return (score || score === 0) ? formatDecimalNicely(score, maxDecimalPlacesForResolution) : 'N/A'
  }

  return [
    {
      'type': 'section',
      'fields': [
        markdownBlock(`*Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(details.brierScore, 6)}`),
        markdownBlock(`*Relative Brier score*\n ${formatScore(details.rBrierScore)}`),
        markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
        markdownBlock(`*Your last forecast*\n ${details.lastForecast}%, _${details.lastForecastDate}_`)
      ]
    },
    dividerBlock(),
    {
      'type': 'section',
      'fields': [
        markdownBlock(`*Brier score across all questions:*\n ${formatScore(details.overallBrierScore)}`),
        markdownBlock(`*Relative Brier score across all questions:*\n ${formatScore(details.overallRBrierScore)}`)
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
