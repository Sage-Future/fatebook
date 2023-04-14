import { BlockActionPayload } from 'seratch-slack-types/app-backend/interactive-components/BlockActionPayload.js'
import { buildQuestionBlocks } from '../blocks-designs/question.js'
import { buildEditQuestionModalView } from '../blocks-designs/question_modal.js'
import { EditQuestionBtnActionParts, QuestionModalActionParts } from '../blocks-designs/_block_utils.js'
import { createForecastingQuestion } from '../slash_handlers/_create_forecast.js'
import prisma, { getGroupIDFromSlackID, getOrCreateProfile, postMessageToResponseUrl, showModal, updateMessage } from '../../lib/_utils.js'

export async function showCreateQuestionModal(teamId: string, triggerId: string, channelId: string, questionInput: string) {
  const view = buildEditQuestionModalView({title: questionInput.trim()}, true, channelId)
  const response = await showModal(teamId, triggerId, view)
  console.log('showCreateQuestionModal response', response)
}

export async function showEditQuestionModal(actionParts: EditQuestionBtnActionParts, payload: BlockActionPayload) {
  if (!payload.response_url || !payload.trigger_id || !payload.team?.id || !payload.user?.id || !payload.channel?.id) {
    console.error("missing required fields in payload for edit question modal ", payload)
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
      }
    },
  })

  if (!question) {
    console.error("Couldn't find question to open edit modal: ", questionId)
    await postMessageToResponseUrl({
      text: `Error: Couldn't find question to edit.`,
      replace_original: false,
      response_type: 'ephemeral',
    }, payload.response_url)
    throw new Error(`Couldn't find question ${questionId}`)
  }

  if (!question.profile.user.profiles.some((p) => p.slackId === payload.user?.id)) {
    // user is not the author of the question
    await postMessageToResponseUrl({
      text: `Only the question's author <@${question.profile.slackId}> can edit it.`,
      replace_original: false,
      response_type: 'ephemeral',
    }, payload.response_url)
  } else {
    // user is question author
    // WARNING: assumes that the channel where the button was pressed is the same as the channel where the question was asked
    const view = buildEditQuestionModalView(question, false, payload.channel.id)
    const response = await showModal(payload.team.id, payload.trigger_id, view)
    console.log('showEditQuestionModal response', response)
  }

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
  function getVal(actionId: string) {
    const blockObj = Object.values(payload.view.state.values as ViewStateValues).find((v) => v[actionId] !== undefined)
    if (!blockObj) {
      console.error("missing blockObj for actionId", actionId, ". values: ", payload.view.state.values)
      throw new Error("missing blockObj for actionId")
    }
    return blockObj[actionId]
  }

  const question = getVal('forecast_question')?.value
  const resolutionDate = getVal('{"action":"updateResolutionDate"}')?.selected_date
  const notes = getVal('notes')?.value

  if (!question || !resolutionDate) {
    console.error("missing question or resolution date")
    throw new Error("missing question or resolution date")
  }

  if (actionParts.isCreating) {
    const groupId = await getGroupIDFromSlackID(payload.user.team_id, true)
    const profile = await getOrCreateProfile(payload.user.team_id, payload.user.id, groupId)

    await createForecastingQuestion(payload.user.team_id, {
      question: question,
      date: new Date(resolutionDate),
      channelId: actionParts.channel,
      groupId,
      profile,
      notes,
    })
  } else {
    const updatedQuestion = await prisma.question.update({
      where: {
        id: actionParts.questionId,
      },
      data: {
        title: question,
        resolveBy: new Date(resolutionDate),
        notes,
      },
      include: {
        forecasts: {
          include: {
            profile: {
              include: {
                user: true
              }
            }
          }
        },
        profile: {
          include: {
            user: true
          }
        },
        slackMessages: true
      }
    })

    const questionBlocks = buildQuestionBlocks(updatedQuestion)

    for (const slackMessage of updatedQuestion.slackMessages) {
      const response = await updateMessage(payload.user.team_id, {
        channel: slackMessage.channel,
        ts: slackMessage.ts,
        text: `Question edited: *${updatedQuestion.title}*`,
        blocks: questionBlocks,
      })
      if (!response.ok) {
        console.error("Error updating question message after edit: ", response)
      }
    }

    console.log(`Updated question ${actionParts.questionId} with title: ${question}, resolveBy: ${resolutionDate}, notes: ${notes}`)
  }
}
