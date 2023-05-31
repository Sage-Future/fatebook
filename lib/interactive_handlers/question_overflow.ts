import { BlockActionPayload, BlockActionPayloadAction } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import { feedbackFormUrl } from "../_constants"
import { backendAnalyticsEvent } from "../_utils_server"
import { QuestionOverflowActionParts } from "../blocks-designs/_block_utils"
import { showEditQuestionModal } from "./edit_question_modal"
import { resolve, slackUserCanUndoResolution, undoQuestionResolution } from "./resolve"

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
    return
  }
  switch (selected) {
    case 'undo_resolve':
      if (!payload.team?.id || !payload.user?.id || !payload.channel?.id) {
        throw new Error('Missing team or user or channel id on question overflow > undo_resolve')
      }
      if (await slackUserCanUndoResolution(actionParts.questionId, payload.team.id, payload.user.id, payload.channel.id)) {
        await undoQuestionResolution(actionParts.questionId)
        await backendAnalyticsEvent("question_resolution_undone", {
          platform: "slack",
          team: payload.team.id,
        })
      }
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