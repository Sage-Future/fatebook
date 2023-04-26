import prisma, { callSlackApi, getGroupIDFromSlackID, getOrCreateProfile } from "../_utils"
import { HomeAppPageNavigationActionParts } from "../blocks-designs/_block_utils"
import { buildHomeTabBlocks } from "../blocks-designs/app_home"

export async function refreshAppHome(event: any, teamId: string) {
  await refreshUserAppHome(event.user, teamId)
}

async function refreshUserAppHome(userId: string, teamId: string, activePage : number = 0, closedPage : number = 0) {
  const groupId = await getGroupIDFromSlackID(teamId, true)
  const profile = await getOrCreateProfile(teamId, userId, groupId)

  if (!profile) {
    console.error('Could not find or create profile for user', userId)
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
          questionMessages: {
            include: {
              message: true
            }
          }
        }
      }
    },
  })

  const allUserQuestionScores = await prisma.questionScore.findMany({
    where: {
      profileId: profile!.id
    },
  })

  const blocks = await buildHomeTabBlocks(teamId, allUserForecasts, allUserQuestionScores, activePage, closedPage)

  console.log(`App home refreshed for user ${userId}, blocks `, JSON.stringify(blocks, null, 2))
  await callSlackApi(teamId, {
    user_id: userId,
    view: {
      type: 'home',
      blocks
    },
  }, 'https://slack.com/api/views.publish')
}

export async function buttonHomeAppPageNavigation(actionParts : HomeAppPageNavigationActionParts, payload: any) {
  console.log('  buttonHomeAppPageNavigation')
  let { activePage, closedPage } = actionParts
  //add or minus one from appropriate page
  if(actionParts.isForActiveForecasts) {
    activePage = activePage + (actionParts.direction == 'next' ? 1 : -1)
  } else {
    closedPage = closedPage + (actionParts.direction == 'next' ? 1 : -1)
  }

  await refreshUserAppHome(payload.user.id, payload.user.team_id, activePage, closedPage)
}
