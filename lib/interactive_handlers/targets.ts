import prisma, { backendAnalyticsEvent, dateToDayEnum, getCurrentTargetProgress, getOrCreateProfile, getTarget, postBlockMessage, postEphemeralBlockMessage, postEphemeralTextMessage, postMessageToResponseUrl, userHasTarget } from "../_utils_server"
import { AdjustTargetActionParts, SetTargetActionParts, TargetTriggerActionParts } from "../blocks-designs/_block_utils"
import { slackAppId } from "../_constants"
import { buildConfirmTarget, buildTargetAdjust, buildTargetNotificationText, buildTargetSet } from "../blocks-designs/target_setting"
import { refreshUserAppHome } from "./app_home"

export async function buttonTriggerTargetSet(actionParts : TargetTriggerActionParts, payload :any){
  const teamId = payload.user.team_id
  const profile = await getOrCreateProfile(teamId, payload.user.id)
  if(await userHasTarget(profile.user.id)){
    await postEphemeralTextMessage(teamId,
                                   payload.channel.id,
                                   payload.user.id,
                                   `You already have a target set yet. Check out <slack://app?team=${teamId}&id=${slackAppId}&tab=home|Fatebook app home>.`)
  }

  await postEphemeralBlockMessage(teamId,
                                  payload.channel.id,
                                  payload.user.id,
                                  buildTargetSet(),
                                  `Want to set a forecasting target?`)
}

export async function buttonTargetAdjust(actionParts : AdjustTargetActionParts, payload :any){
  const teamId = payload.user.team_id

  const profile = await getOrCreateProfile(teamId, payload.user.id)

  const target = await getTarget(profile.user.id)

  if(!target){
    await postEphemeralTextMessage(teamId,
                                   payload.channel.id,
                                   payload.user.id,
                                   `You don't have a target set yet. Check out <slack://app?team=${teamId}&id=${slackAppId}&tab=home|Fatebook app home> to set one.`)
    return
  }

  if(actionParts.cancel){
    // update the message using response_url
    await postMessageToResponseUrl({
      text: `Okay! I've cancelled your target.`,
      replace_original: true,
    }, payload.response_url)

    // delete the target from database
    await prisma.target.delete({
      where: {
        userId: profile.user.id,
      }
    })

    await backendAnalyticsEvent("target_cancelled", {
      platform: "slack",
      team: payload.user.team_id,
      user: profile.user.id,
    })
    return
  }

  // update the message using response_url
  const current = await getCurrentTargetProgress(profile.user.id, target)

  await postMessageToResponseUrl({
    text: buildTargetNotificationText(target, current),
    replace_original: true,
  }, payload.response_url)
  // display update message
  await postBlockMessage(teamId,
                         payload.channel.id,
                         buildTargetAdjust(),
                         `Want to adjust your target?`)

  await backendAnalyticsEvent("target_adjust", {
    platform: "slack",
    team: payload.user.team_id,
    user: payload.user.id,
  })
}

export async function buttonTargetSet(actionParts : SetTargetActionParts, payload :any){
  const teamId = payload.user.team_id
  const profile = await getOrCreateProfile(teamId, payload.user.id)

  const lastFailedAt = new Date()
  await prisma.target.upsert({
    where: {
      profileId: profile.id,
    },
    update: {
      goal: actionParts.targetValue,
      type: actionParts.targetType,
      notifyOn: dateToDayEnum(new Date()),
      lastNotified: new Date()
    },
    create: {
      user: {
        connect: {
          id: profile.user.id
        }
      },
      goal: actionParts.targetValue,
      type: actionParts.targetType,
      lastFailedAt,
      notifyOn: dateToDayEnum(new Date()),
      profile: {
        connect: {
          id: profile.id
        }
      }
    }
  })

  if(actionParts.homeApp){
    await refreshUserAppHome(payload.user.id, payload.user.team_id)
  }else{
    await postMessageToResponseUrl({
      text:   `New target set!`,
      blocks: buildConfirmTarget(actionParts.targetType, actionParts.targetValue),
      replace_original: true,
    }, payload.response_url)
  }

  await backendAnalyticsEvent("target_set", {
    platform: "slack",
    team: payload.user.team_id,
    user: payload.user.id,
  })
}