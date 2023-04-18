import {  buildGetForecastsBlocks } from '../blocks-designs/get_forecasts.js'
import { createProfile, getGroupIDFromSlackID, postSlackMessage, postEphemeralTextMessage } from '../../lib/_utils.js'
import prisma from '../../lib/_utils.js'

export async function getForecasts(slackUserId : string, slackTeamId : string, channelId : string) {
  console.log('getForecasts called')


  // query the database for the user
  //   we use findFirst because we expect only one result
  //   cannot get unique because we don't have a unique on
  //   uncertain field
  let profile = await prisma.profile.findFirst({
    where: {
      slackId: slackUserId
    },
  })
  console.log("profile tes:", profile)

  // if no profile, create one
  if(!profile) {
    try {
      const createGroupIfNotExists : boolean = true
      const groupId = await getGroupIDFromSlackID(slackTeamId, createGroupIfNotExists)
      profile = await createProfile(slackTeamId, slackUserId, groupId)
    } catch(err){
      console.log(`Error: couldn't create userID or group for slackUserID: ${slackUserId}`)
      await postEphemeralTextMessage(slackTeamId,
                                     channelId,
                                     slackUserId,
                                     `I couldn't find your userID or group!`)
      return
    }
  }

  const allUserForecasts = await prisma.forecast.findMany({
    where: {
      authorId: profile!.id
    },
    include: {
      question: {
        include: {
          forecasts: true,
          questionMessages: true
        }
      }
    },
  })
  console.log("allUserForecasts:", allUserForecasts)

  try {
    const forecastsBlocks = await buildGetForecastsBlocks(slackTeamId, allUserForecasts)
    console.log('builtBlocks:', forecastsBlocks)
    await postSlackMessage(slackTeamId, {
      channel: channelId,
      text: `Your forecasts...`,
      blocks: forecastsBlocks,
      unfurl_links: false,
      unfurl_media: false,
    }, slackUserId)

  } catch (err) {
    console.log('res send Error:', err)
    await postEphemeralTextMessage(slackTeamId,
                                   channelId,
                                   slackUserId,
                                   `There was an error displaying your forecasts! Sorry about that!`)
  }
}
