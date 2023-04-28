import { Decimal } from "@prisma/client/runtime/library"
import { BlockActionPayload, BlockActionPayloadAction } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import prisma, { backendAnalyticsEvent, getGroupIDFromSlackID, getOrCreateProfile, postMessageToResponseUrl, updateMessage, floatEquality } from "../_utils"
import { SubmitTextForecastActionParts } from "../blocks-designs/_block_utils"
import { buildQuestionBlocks } from "../blocks-designs/question"

export async function getLastForecast(profileId: number, questionId: number) {
  const forecasts = await prisma.forecast.findMany({
    where: {
      authorId: profileId,
      questionId: questionId,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 1,
  })
  return forecasts[0]
}

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

  // dealing with duplicate forecasts
  //   check if the last forecast was:
  //    within 5 minutes
  //    & has the same value
  const lastForecast = await getLastForecast(profile!.id, questionId)
  if (lastForecast && floatEquality(lastForecast.forecast.toNumber(), (number/100))) {
    const lastForecastTime = new Date(lastForecast.createdAt).getTime()
    const now = new Date().getTime()
    const timeDiff = now - lastForecastTime
    if (timeDiff < 5 * 60 * 1000) {
      console.log(`Duplicate forecast detected for ${profile.id} on ${questionId}\nExiting`)
    }
  }else{
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
  }

  if (payload.message?.ts && payload.channel?.id) {
    await updateQuestionMessages(payload.team.id, payload.message.ts, payload.channel.id)
  } else {
    console.error(`Missing message.ts or channel.id in payload ${JSON.stringify(payload)}`)
  }

  await backendAnalyticsEvent("forecast_submitted", {
    platform: "slack",
    team: payload.team.id,
    user: payload.user.id,
    question: questionId,
    forecast: number,
  })
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
              user: {
                include: {
                  profiles: {
                    include: {
                      groups: true
                    }
                  }
                }
              }
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
    const questionBlocks = buildQuestionBlocks(teamId, question)
    await updateMessage(teamId, {
      ts: questionTs,
      channel: channel,
      blocks: questionBlocks,
      text: `New forecasts on '${question.title}'`,
    })
  }
}
