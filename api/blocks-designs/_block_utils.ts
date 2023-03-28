import { Block, KnownBlock } from "@slack/types"

export interface ResolveQuestionActionParts {
  action: 'resolve'
  questionId: number
  answer: 'yes' | 'no' | 'ambiguous'
}

export type ActionIdParts = ResolveQuestionActionParts

export type Blocks = (KnownBlock | Block)[]

export function toActionId(parts: ActionIdParts) {
  const stringified = JSON.stringify(parts)
  if (stringified.length > 255) {
    throw new Error(`ActionIdParts too long - Slack limits actionId to 255 chars. ${parts}`)
  }
  return stringified
}

export function unpackBlockActionId(actionId: string) {
  return JSON.parse(actionId) as ActionIdParts
}