import { showModal } from "../_utils_server"
import { buildWrongConversationModalView } from "../blocks-designs/error_modal"

export async function showWrongChannelModalView(
  teamId: string,
  triggerId: string,
  channelId: string,
  questionInput: string,
) {
  const view = buildWrongConversationModalView(teamId, channelId, questionInput)
  const response = await showModal(teamId, triggerId, view)
  console.log("showCreateQuestionModal response", response)
}
