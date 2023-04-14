import { BlockActionPayload, BlockActionPayloadAction } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import { QuestionOverflowActionParts } from "../blocks-designs/_block_utils.js"
import { feedbackFormUrl } from "../_constants.js"
import { showEditQuestionModal } from "./edit_question_modal.js"
import { resolve, undoQuestionResolution } from "./resolve.js"

export async function questionOverflowAction(actionParts: QuestionOverflowActionParts, action: BlockActionPayloadAction, payload: BlockActionPayload) {
  const selected = action.selected_option?.value
  console.log(`questionOverflowAction, selected:`, selected)
  if (selected?.startsWith('resolve_')) {
    const answer = selected.substring('resolve_'.length)
    await resolve({
      action: 'resolve',
      questionId: actionParts.questionId,
      answer: answer as 'yes' | 'no' | 'ambiguous',
    }, payload.response_url, payload.user?.id, undefined, payload.team?.id)
  }
  switch (selected) {
    case 'undo_resolve':
      if (!payload.team?.id) {
        throw new Error('Missing team id on question overflow > undo_resolve')
      }
      await undoQuestionResolution(actionParts.questionId, payload.team?.id)
      break

    case 'edit_question':
      await showEditQuestionModal({
        action: 'editQuestionBtn',
        questionId: actionParts.questionId,
      }, payload)
      break

    case 'give_feedback':
      console.log(`Overflow > give_feedback pressed, opening feedback url ${feedbackFormUrl}`)
      break

    default:
      throw new Error(`Unknown question overflow action: ${selected}`)
  }
}