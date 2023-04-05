import { Profile } from "@prisma/client"
import { buildEditQuestionModalView } from "../blocks-designs/question_modal.js"
import { QuestionModalActionParts } from "../blocks-designs/_block_utils.js"
import { createForecastingQuestion } from "../slash_handlers/_create_forecast.js"
import { getGroupIDFromSlackID, getOrCreateProfile, showModal } from "../_utils.js"

export async function showCreateQuestionModal(trigger_id: string, channelId: string) {
  const view = buildEditQuestionModalView({}, true, channelId)

  console.log("showing modal ", JSON.stringify(view, null, 2))

  const response = await showModal(trigger_id, view)
  console.log('showCreateQuestionModal response', response)
}

export async function showEditQuestionModal(trigger_id: string, questionId: string) {
  console.log("todo get question, show modal")
}

interface ViewStateValues {
  [blockId: string]: {
    [actionId: string]: {
      type: string,
      value?: string,
      selected_date?: string
    }
  }
}
export async function questionModalSubmitted(payload: any, actionParts: QuestionModalActionParts) {
  console.log("questionModalSubmitted", payload)

  function getVal(actionId: string) {
    const blockObj = Object.values(payload.view.state.values as ViewStateValues).find((v) => v[actionId] !== undefined)
    if (!blockObj) {
      console.error("missing blockObj for actionId", actionId)
      throw new Error("missing blockObj for actionId")
    }
    return blockObj[actionId]
  }

  const question = getVal('forecast_question')?.value
  const resolutionDate = getVal('resolution_date')?.selected_date
  const notes = getVal('notes')?.value

  if (!question || !resolutionDate) {
    console.error("missing question or resolution date")
    throw new Error("missing question or resolution date")
  }

  if (actionParts.isCreating) {
    const groupId = await getGroupIDFromSlackID(payload.user.team_id, true)
    const profile = await getOrCreateProfile(payload.user.id, groupId)

    await createForecastingQuestion({
      question: question,
      date: new Date(resolutionDate),
      channelId: actionParts.channel,
      groupId,
      profile,
    })
  } else {
    // edit
  }
}