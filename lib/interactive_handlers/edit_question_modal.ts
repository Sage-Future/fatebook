import { Question } from "@prisma/client"
import * as chrono from "chrono-node"
import { BlockActionPayload } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import {
  backendAnalyticsEvent,
  callSlackApi,
  deleteMessage,
  getOrCreateProfile,
  getUserNameOrProfileLink,
  postMessageToResponseUrl,
  showModal,
  updateMessage,
} from "../_utils_server"
import {
  DeleteQuestionActionParts,
  EditQuestionBtnActionParts,
  OptionSelection,
  OptionsCheckBoxActionParts,
  QuestionModalActionParts,
  parseSelectedCheckboxOptions,
  textBlock,
} from "../blocks-designs/_block_utils"
import { buildQuestionBlocks } from "../blocks-designs/question"
import { buildEditQuestionModalView } from "../blocks-designs/question_modal"
import prisma from "../prisma"
import { createForecastingQuestion } from "../slash_handlers/_create_forecast"

export async function showCreateQuestionModal(
  teamId: string,
  triggerId: string,
  channelId: string,
  questionInput: string,
) {
  const view = buildEditQuestionModalView(
    parseQuestion(questionInput),
    true,
    channelId,
  )
  await showModal(teamId, triggerId, view)
  console.log("showCreateQuestionModal")
}

function parseQuestion(str: string): Partial<Question> {
  // todo parse date relative to user timezone
  const dateResult = chrono.parse(str, new Date(), { forwardDate: true })
  const resolveBy =
    dateResult.length === 1 && dateResult[0].date()
      ? dateResult[0].date()
      : undefined

  return {
    title: str.trim(),
    resolveBy,
  }
}

export async function showEditQuestionModal(
  actionParts: EditQuestionBtnActionParts,
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
      "missing required fields in payload for edit question modal ",
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
      user: {
        include: {
          profiles: true,
        },
      },
    },
  })

  if (!question) {
    console.error("Couldn't find question to open edit modal: ", questionId)
    await postMessageToResponseUrl(
      {
        text: `Error: Couldn't find question to edit.`,
        replace_original: false,
        response_type: "ephemeral",
      },
      payload.response_url,
    )
    throw new Error(`Couldn't find question ${questionId}`)
  }

  if (!question.user.profiles.some((p) => p.slackId === payload.user?.id)) {
    // user is not the author of the question
    await postMessageToResponseUrl(
      {
        text: `Only the question's author ${getUserNameOrProfileLink(
          payload.team.id,
          question.user,
        )} can edit it.`,
        replace_original: false,
        response_type: "ephemeral",
      },
      payload.response_url,
    )
  } else {
    // user is question author
    // WARNING: assumes that the channel where the button was pressed is the same as the channel where the question was asked
    const view = buildEditQuestionModalView(question, false, payload.channel.id)
    await showModal(payload.team.id, payload.trigger_id, view)
    console.log("showEditQuestionModal")
  }
}

interface ViewStateValues {
  [blockId: string]: {
    [actionId: string]: {
      type: string
      value?: string
      selected_date?: string
      selected_options?: OptionSelection[]
    }
  }
}

export async function questionModalSubmitted(
  payload: any,
  actionParts: QuestionModalActionParts,
) {
  function getVal(actionId: string, throwIfMissing = true) {
    const blockObj = Object.values(
      payload.view.state.values as ViewStateValues,
    ).find((v) => v[actionId] !== undefined)
    if (!blockObj && throwIfMissing) {
      console.error("missing blockObj for actionId", actionId)
      throw new Error("missing blockObj for actionId")
    }
    return blockObj ? blockObj[actionId] : undefined
  }

  const question = getVal("forecast_question")?.value
  const resolutionDate = getVal(
    '{"action":"updateResolutionDate"}',
  )?.selected_date
  const notes = getVal("notes")?.value

  const hideForecastsUntilStr = getVal(
    '{"action":"updateHideForecastsDate"}',
    false,
  )?.selected_date
  console.log("    hideForecastsUntilStr", hideForecastsUntilStr)
  const hideForecastsUntil = hideForecastsUntilStr
    ? new Date(hideForecastsUntilStr)
    : null

  if (!question || !resolutionDate) {
    console.error("missing question or resolution date")
    throw new Error("missing question or resolution date")
  }

  // get the value of the hide forecasts until prediction checkbox
  const checkboxValue = Object.values(
    payload.view.state.values as ViewStateValues,
  ).find((v) => Object.keys(v)[0]?.includes('"action":"optionsCheckBox"'))
  const selectedCheckboxes =
    checkboxValue && Object.values(checkboxValue)?.[0]?.selected_options
  const hideForecastsUntilPrediction =
    (selectedCheckboxes &&
      parseSelectedCheckboxOptions(selectedCheckboxes).find(
        (cb) => cb.valueLabel === "hide_forecasts_until_prediction",
      )?.value) ||
    false

  if (actionParts.isCreating) {
    const profile = await getOrCreateProfile(
      payload.user.team_id,
      payload.user.id,
    )

    await createForecastingQuestion(payload.user.team_id, {
      question: question,
      date: new Date(resolutionDate),
      channelId: actionParts.channel,
      profile,
      user: profile.user,
      notes,
      hideForecastsUntilPrediction,
      hideForecastsUntil,
      slackUserId: payload.user.id,
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
        hideForecastsUntil,
        hideForecastsUntilPrediction,
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

    const questionBlocks = await buildQuestionBlocks(
      payload.user.team_id,
      updatedQuestion,
    )

    for (const slackMessage of updatedQuestion.questionMessages) {
      const response = await updateMessage(
        slackMessage.message.teamId,
        {
          channel: slackMessage.message.channel,
          ts: slackMessage.message.ts,
          text: `Question edited: *${updatedQuestion.title}*`,
          blocks: questionBlocks,
        },
        payload.user.id,
      )
      if (!response.ok) {
        console.error("Error updating question message after edit: ", response)
      }
    }

    console.log(
      `Updated question ${actionParts.questionId} resolveBy: ${resolutionDate}`,
    )
    await backendAnalyticsEvent("question_edited", {
      platform: "slack",
      team: payload.user.team_id,
      user: payload.user.id,
    })
  }
}

export async function deleteQuestionSlack(
  actionParts: DeleteQuestionActionParts,
  payload: any,
) {
  // we can't close a modal from a button click, so update the modal to say the question was deleted
  await callSlackApi(
    payload.view.team_id,
    {
      view_id: payload.view.id,
      view: {
        type: "modal",
        callback_id: "question_deleted",
        title: textBlock("Question deleted"),
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Your question has been deleted. Forecasts on it will not affect anyone's score.`,
            },
          },
        ],
        submit: textBlock("Ok"),
      },
    },
    "https://slack.com/api/views.update",
  )

  await deleteQuestion(actionParts.questionId)

  await backendAnalyticsEvent("question_deleted", {
    platform: "slack",
    team: payload.user.team_id,
    user: payload.user.id,
  })
}

export async function deleteQuestion(questionId: string) {
  const question = await prisma.question.delete({
    where: {
      id: questionId,
    },
    include: {
      questionMessages: {
        include: {
          message: true,
        },
      },
      pingResolveMessages: {
        include: {
          message: true,
        },
      },
    },
  })

  const messagesToDelete = [
    ...question.questionMessages,
    ...question.pingResolveMessages,
  ].map((m) => m.message)
  for (const slackMessage of messagesToDelete) {
    const response = await deleteMessage(
      slackMessage.teamId,
      slackMessage.channel,
      slackMessage.ts,
    )
    if (!response.ok) {
      console.error("Error deleting question message after delete: ", response)
    }
  }

  console.log(
    "Deleted question ",
    questionId,
    " and ",
    messagesToDelete.length,
    " Slack messages",
  )
}

export async function updateFromCheckboxes(
  actionParts: OptionsCheckBoxActionParts,
  payload: any,
  channel: string,
) {
  const checkboxOptions = parseSelectedCheckboxOptions(
    payload.actions?.[0].selected_options,
  )
  const questionPart = {
    id: actionParts.questionId,
    resolveBy: new Date(actionParts.questionResolutionDate),
  }
  const newView = buildEditQuestionModalView(
    questionPart,
    actionParts.isCreating,
    channel,
    checkboxOptions.find((cb) => cb.valueLabel === "hide_forecasts_until_date")
      ?.value,
    checkboxOptions.find(
      (cb) => cb.valueLabel === "hide_forecasts_until_prediction",
    )?.value,
  )

  await callSlackApi(
    payload.view.team_id,
    {
      view_id: payload.view.id,
      view: newView,
    },
    "https://slack.com/api/views.update",
  )
}
