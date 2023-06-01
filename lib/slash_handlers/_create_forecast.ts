import { Profile, User } from '@prisma/client'
import { VercelResponse } from '@vercel/node'

import { ProfileWithUser } from '../../prisma/additional'
import prisma, { backendAnalyticsEvent, getOrCreateProfile, postSlackMessage } from '../_utils_server'
import { buildQuestionBlocks } from '../blocks-designs/question'

export async function createForecast(res : VercelResponse, commandArray : string[], slackUserId : string, slackTeamId : string, channelId : string) {
  let question : string = commandArray[2]
  let dateStr  : string = commandArray[3]
  let forecast : string = commandArray[4]
  console.log(`question: ${question}, date: ${dateStr}, forecast: ${forecast}`)

  let profile : ProfileWithUser
  try {
    profile = await getOrCreateProfile(slackTeamId, slackUserId)
  } catch (err) {
    res.send({
      response_type: 'ephemeral',
      text: `I couldn't find or create your profile!`,
    })
    return
  }

  let forecastNum : number = Number(forecast)

  //parse the date string
  let date : Date = new Date(dateStr)
  await createForecastingQuestion(slackTeamId, { question, date, forecastNum, profile, user : profile.user, channelId })
}

export async function createForecastingQuestion(teamId: string, { question, date, forecastNum, profile, user, channelId, notes, hideForecastsUntil }:{ question: string, date: Date, forecastNum?: number, profile: Profile, user: User, channelId: string, notes?: string, hideForecastsUntil?: Date | null}) {
  const createdQuestion = await prisma.question.create({
    data: {
      title     : question,
      resolveBy : date,
      userId  : user.id,
      profileId  : profile.id,
      notes,
      hideForecastsUntil,
      forecasts : forecastNum ? {
        create: {
          profileId : profile.id,
          userId : user.id,
          forecast : forecastNum
        }
      } : {}
    },
    include: {
      user: {
        include: {
          profiles: true
        }
      },
      forecasts: {
        include: {
          user: {
            include: {
              profiles: true
            }
          }
        }
      }
    }
  })

  const questionBlocks = await buildQuestionBlocks(teamId, createdQuestion)

  let questionPostedSuccessfully = true
  let data
  try {
    data = await postSlackMessage(teamId, {
      channel: channelId,
      text: `Forecasting question created: ${question}`,
      blocks: questionBlocks,
      unfurl_links: false,
      unfurl_media: false
    }, undefined)
    // TODO createdQuestion.profile.slackId || undefined)

    if ((data as any)?.notifiedUserAboutEmptyChannel) {
      questionPostedSuccessfully = false

      await backendAnalyticsEvent("question_create_failed_invalid_channel", {
        platform: "slack",
        team: teamId,
        user: profile.userId,
      })
    }
  } catch (err) {
    questionPostedSuccessfully = false
  }

  // if question slack message failed to post, delete the question
  if (!questionPostedSuccessfully) {
    await prisma.question.delete({
      where: {
        id: createdQuestion.id
      }
    })
    console.log('Immediately deleted question because slack message failed to post')
    return
  }

  if (!data?.ts) {
    console.error(`Missing message.ts in response ${JSON.stringify(data)}`)
    throw new Error("Missing message.ts in response")
  }

  console.log(`updating `, {data})
  await prisma.question.update({
    where: {
      id: createdQuestion.id
    },
    data: {
      questionMessages: {
        create: {
          message: {
            create: {
              ts: data.ts,
              channel: channelId,
              teamId: teamId,
            }
          }
        }
      }
    }
  })
  console.log("Recorded question message ts ", data?.ts)

  await backendAnalyticsEvent("question_created", {
    platform: "slack",
    team: teamId,
    user: profile.userId,
  })
}
