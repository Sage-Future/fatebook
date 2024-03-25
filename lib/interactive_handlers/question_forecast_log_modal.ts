import { BlockActionPayload } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload.js"
import { postMessageToResponseUrl, showModal } from "../_utils_server"
import { ViewForecastLogBtnActionParts } from "../blocks-designs/_block_utils"
import { buildQuestionForecastLogModalView } from "../blocks-designs/question_forecast_log"
import prisma from "../prisma"

export async function showForecastLogModal(
  actionParts: ViewForecastLogBtnActionParts,
  payload: BlockActionPayload,
) {
  if (
    !payload.response_url ||
    !payload.trigger_id ||
    !payload.team?.id ||
    !payload.user?.id ||
    !payload.channel?.id
  ) {
    console.error(
      "missing required fields in payload for show forecast log modal ",
      payload,
    )
    throw new Error("missing required fields in payload")
  }

  const { questionId } = actionParts
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      forecasts: {
        include: {
          user: {
            include: {
              profiles: true,
            },
          },
        },
      },
      user: {
        include: {
          profiles: true,
        },
      },
      questionMessages: {
        include: {
          message: true,
        },
      },
    },
  })

  if (!question) {
    console.error("Couldn't find question to open forecast log: ", questionId)
    await postMessageToResponseUrl(
      {
        text: `Error: Couldn't find question to show log.`,
        replace_original: false,
        response_type: "ephemeral",
      },
      payload.response_url,
    )
    throw new Error(`Couldn't find question ${questionId}`)
  }

  const view = buildQuestionForecastLogModalView(
    payload.team.id,
    question,
    payload.user.id,
  )
  const response = await showModal(payload.team.id, payload.trigger_id, view)
  console.log("showForecastLogModal response", response)
}
