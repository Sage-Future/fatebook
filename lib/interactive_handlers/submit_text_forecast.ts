import { Decimal } from "@prisma/client/runtime/library.js"
import { BlockActionPayload, BlockActionPayloadAction } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import { buildQuestionBlocks } from "../blocks-designs/question.js"
import { SubmitTextForecastActionParts } from "../blocks-designs/_block_utils"
import prisma, { getGroupIDFromSlackID, getOrCreateProfile, postMessageToResponseUrl, updateMessage } from "../_utils.js"

export async function submitTextForecast(actionParts: SubmitTextForecastActionParts, action: BlockActionPayloadAction, payload: BlockActionPayload) {
  if (actionParts.questionId === undefined)
    throw Error('blockActions: missing qID on action_id')

  if (!payload.team?.id || !payload.user?.id) {
    throw Error(`Missing team or user in payload ${JSON.stringify(payload)}`)
  }

  if (!payload.response_url) {
    throw Error(`No response_url in payload ${JSON.stringify(payload)}`)
  }

  const textInput = action.value
  const number = textInput && Number(textInput.trim().replace("%", ""))
  if (textInput === undefined || textInput === '' || !number || Number.isNaN(number) || (number && (number < 0 || number > 100))) {
    await postMessageToResponseUrl({
      text: `To make a prediction, enter a number between 0% and 100%, e.g. "50%"`,
      response_type: "ephemeral",
      replace_original: false,
    }, payload.response_url)

    return
  }

  const { questionId } = actionParts

  let profile
  try {
    const groupId = await getGroupIDFromSlackID(payload.team.id)
    profile = await getOrCreateProfile(payload.team.id, payload.user.id, groupId)
  } catch (e) {
    console.error(e)
    await postMessageToResponseUrl({
      text: `Sorry, I couldn't find your profile. Please try again.`,
      response_type: "ephemeral",
      replace_original: false,
    }, payload.response_url)
    return
  }

  const forecastCreated = await prisma.forecast.create({
    data: {
      profile: {
        connect: {
          id: profile.id
        }
      },
      question: {
        connect: {
          id: questionId
        }
      },
      forecast: new Decimal(number / 100), // convert 0-100% to 0-1
    }
  })

  console.log("Forecast created: ", forecastCreated)

  // await postMessageToResponseUrl({
  //   text: `I've recorded your ${number}% forecast!`,
  //   response_type: "ephemeral",
  //   replace_original: false,
  // }, payload.response_url)

  if (payload.message?.ts && payload.channel?.id) {
    await updateQuestionMessages(payload.team.id, payload.message.ts, payload.channel.id)
  } else {
    console.error(`Missing message.ts or channel.id in payload ${JSON.stringify(payload)}`)
  }
}

async function updateQuestionMessages(teamId: string, questionTs: string, channel: string) {
  const questions = await prisma.question.findMany({
    where: {
      questionMessages: {
        some: {
          AND: {
            message: {
              ts: questionTs,
              channel: channel,
            }
          }
        }
      }
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
      }
    }
  })

  if (!questions) {
    console.error(`No question with ts ${questionTs} found. Maybe it's been deleted?`)
    return
  }

  console.log(`Updating ${questions.length} question messages `, questions)
  for (const question of questions) {
    const questionBlocks = buildQuestionBlocks(question)
    await updateMessage(teamId, {
      ts: questionTs,
      channel: channel,
      blocks: questionBlocks,
      text: `New forecasts on '${question.title}'`,
    })
  }
}
