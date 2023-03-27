import { Type } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"

export function textBlock(text: string, emoji: boolean = false) {
  return {
    type: Type.PlainText,
    text,
    emoji,
  }
}

export function markdownBlock(text: string, emoji: boolean = false) {
  return {
    type: Type.Mrkdwn,
    text,
    emoji,
  }
}