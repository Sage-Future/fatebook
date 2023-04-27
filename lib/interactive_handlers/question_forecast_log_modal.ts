import { BlockActionPayload } from 'seratch-slack-types/app-backend/interactive-components/BlockActionPayload.js'
import { buildQuestionForecastLogModalView } from '../blocks-designs/question_forecast_log'
import { ViewForecastLogBtnActionParts } from '../blocks-designs/_block_utils'
import prisma, { postMessageToResponseUrl, showModal } from '../../lib/_utils'

export async function showForecastLogModal(actionParts: ViewForecastLogBtnActionParts, payload: BlockActionPayload) {
  if (!payload.response_url || !payload.trigger_id || !payload.team?.id || !payload.user?.id || !payload.channel?.id) {
    console.error("missing required fields in payload for show forecast log modal ", payload)
    throw new Error("missing required fields in payload")
  }

  const { questionId } = actionParts
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      profile: {
        include: {
          user: {
            include: {
              profiles: true
            }
          }
        }
      },
      forecasts: {
        include: {
          profile: {
            include: {
              user: true
            }
          }
        }
      }
    },
  })

  if (!question) {
    console.error("Couldn't find question to open forecast log: ", questionId)
    await postMessageToResponseUrl({
      text: `Error: Couldn't find question to show log.`,
      replace_original: false,
      response_type: 'ephemeral',
    }, payload.response_url)
    throw new Error(`Couldn't find question ${questionId}`)
  }

  const view = buildQuestionForecastLogModalView(question)
  const response = await showModal(payload.team.id, payload.trigger_id, view)
  console.log('showForecastLogModal response', response)

}
