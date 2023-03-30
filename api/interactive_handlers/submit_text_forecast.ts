import { BlockActionPayload, BlockActionPayloadAction } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import { SubmitTextForecastActionParts } from "../blocks-designs/_block_utils"
import { postMessageToResponseUrl } from "../_utils.js"

export async function submitTextForecast(actionParts: SubmitTextForecastActionParts, action: BlockActionPayloadAction, payload: BlockActionPayload) {
  if (actionParts.questionId === undefined)
    throw Error('blockActions: missing qID on action_id')

  if (!payload.response_url) {
    console.error("No response_url in payload", payload)
    return
  }

  const textInput = action.value

  const getNumber = (text: string) => {
    return Number(text.trim().replace("%", ""))
  }
  if (textInput === undefined || textInput === '' || Number.isNaN(getNumber(textInput))) {
    await postMessageToResponseUrl({
      text: `To make a prediction, enter a number between 0% and 100%, e.g. "50%"`,
      response_type: "ephemeral",
      replace_original: false,
    }, payload.response_url)
    
    return
  }

  const { questionId } = actionParts
  const userId = payload.user?.id

  await postMessageToResponseUrl({
    text: `Thanks for submitting your forecast!`,
    response_type: "ephemeral",
    replace_original: false,
  }, payload.response_url)
}
