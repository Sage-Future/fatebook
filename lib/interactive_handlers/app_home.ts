import { buildHomeTabBlocks } from "../blocks-designs/app_home.js"
import prisma, { callSlackApi, getGroupIDFromSlackID, getOrCreateProfile } from "../_utils.js"

export async function refreshAppHome(event: any, teamId: string) {
  const groupId = await getGroupIDFromSlackID(teamId, true)
  const profile = await getOrCreateProfile(teamId, event.user, groupId)

  if (!profile) {
    console.error('Could not find or create profile for user', event.user)
    return
  }

  const allUserForecasts = await prisma.forecast.findMany({
    where: {
      authorId: profile!.id
    },
    include: {
      question: {
        include: {
          forecasts: true,
          slackMessages: true
        }
      }
    },
  })

  const blocks = await buildHomeTabBlocks(teamId, allUserForecasts)

  console.log(`App home refreshed for user ${event.user}, blocks `, JSON.stringify(blocks, null, 2))
  await callSlackApi(teamId, {
    user_id: event.user,
    view: {
      type: 'home',
      blocks
    },
  }, 'https://slack.com/api/views.publish')
}