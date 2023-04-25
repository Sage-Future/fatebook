import { QuestionWithAuthorAndQuestionMessages, QuestionWithSlackMessagesAndForecasts } from '../../prisma/additional'
import { Block, DividerBlock, KnownBlock, MrkdwnElement } from "@slack/types"
import { getSlackPermalinkFromChannelAndTS } from '../_utils.js'
import { feedbackFormUrl } from '../_constants.js'

export interface ResolveQuestionActionParts {
  action: 'resolve'
  questionId: number
  answer?: 'yes' | 'no' | 'ambiguous' // can be omitted if answer is in value of dropdown
}

export interface SubmitTextForecastActionParts {
  action: 'submitTextForecast'
  questionId: number
}

export interface QuestionModalActionParts {
  action: 'qModal'
  isCreating: boolean
  channel: string
  questionId?: number // only required for editing
}

export interface UpdateResolutionDateActionParts {
  action: 'updateResolutionDate'
}

export interface OverflowAccessoryPart {
  action: 'submitTextForecast'
  questionId: number
}

export interface SortForecastsActionParts {
  action: 'sortForecasts'
  field : 'date' | 'title' | 'difference from community'
  order: 'asc' | 'desc'
}

export interface EditQuestionBtnActionParts {
  action: 'editQuestionBtn'
  questionId: number
}

export interface UndoResolveActionParts {
  action: 'undoResolve'
  questionId: number
}

export interface QuestionOverflowActionParts {
  action: 'questionOverflow'
  questionId: number
}

export interface DeleteQuestionActionParts {
  action: 'deleteQuestion'
  questionId: number
}

export interface HomeAppPageNavigationActionParts {
  action: 'homeAppPageNavigation'
  direction: 'next' | 'previous'
  activePage: number
  closedPage: number
  isForActiveForecasts: boolean
}


export type ActionIdParts = ResolveQuestionActionParts | SubmitTextForecastActionParts | SortForecastsActionParts | QuestionModalActionParts
  | UpdateResolutionDateActionParts | EditQuestionBtnActionParts | UndoResolveActionParts | QuestionOverflowActionParts | DeleteQuestionActionParts | HomeAppPageNavigationActionParts

export type Blocks = (KnownBlock | Block | Promise<KnownBlock> | Promise<Block>)[]

export function toActionId(parts: ActionIdParts) {
  const stringified = JSON.stringify(parts)
  if (stringified.length >= 255) {
    throw new Error(`ActionIdParts too long - Slack limits actionId to 255 chars. ${stringified}`)
  }
  return stringified
}

export function unpackBlockActionId(actionId: string) {
  try {
    return JSON.parse(actionId) as ActionIdParts
  } catch (e) {
    throw new Error("Could not parse actionId: " + actionId)
  }
}

export function textBlock(content: string, emoji = true) {
  return {
    'type': "plain_text" as "plain_text",
    'emoji': emoji,
    'text': content,
  }
}

export function dividerBlock() {
  return {
    'type': 'divider' as 'divider',
  } as DividerBlock
}

export function markdownBlock(content: string) {
  return {
    'type': "mrkdwn" as "mrkdwn",
    'text': content,
  } as MrkdwnElement
}

export function headerBlock(content: string) {
  return {
    'type': 'header' as 'header',
    'text': textBlock(content),
  } as Block
}

export function feedbackOverflow(){
  return {
    "type": "overflow",
    "options": [
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "Give feedback on this bot"
        },
        "value": "value-0",
        "url": feedbackFormUrl
      }
    ]
  }
}

export async function getQuestionTitleLink(teamId : string, question: QuestionWithAuthorAndQuestionMessages | QuestionWithSlackMessagesAndForecasts) {
  const questionTitle = `*${question.title}*`
  if (question.questionMessages.length) {
    const slackMessage = question.questionMessages[0]!
    const slackPermalink = await getSlackPermalinkFromChannelAndTS(teamId, slackMessage.message.channel, slackMessage.message.ts)
    return `*<${slackPermalink}|${question.title}>*`
  }
  return questionTitle
}
