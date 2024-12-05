import { VercelRequest, VercelResponse } from "@vercel/node"
import { slackAppId } from "../../lib/_constants"
import {
  backendAnalyticsEvent,
  postEphemeralTextMessage,
  postTextMessage,
} from "../../lib/_utils_server"
import { refreshAppHome } from "../../lib/interactive_handlers/app_home"

export default async function eventsApiHandler(
  req: VercelRequest,
  res: VercelResponse,
) {
  console.log(req.body)
  const reqbody = typeof req.body === "string" ? JSON.parse(req.body) : req.body

  if (reqbody?.type === "url_verification") {
    console.log(
      "Sending URL verficiation. NB: This should be handled by middleware in production",
    )
    return res.status(200).send(reqbody.challenge)
  }

  const event = reqbody?.event
  if (!event || !event.type) {
    return console.log("No event type found in request body")
  }

  // Remember to subscribe to events in the bot's `Event Subscriptions`
  switch (event.type) {
    case "app_home_opened":
      // NB: triggers on Home tab, Messages tab, and About tab
      // we refresh the app home on all of these so it's probably ready when Home tab is opened
      console.log(`app_home_opened, tab ${event.tab}`)
      if (event.tab === "home" || !event.tab) {
        await refreshAppHome(event, reqbody.team_id)
      } else {
        await backendAnalyticsEvent(`${event.tab}_tab_opened`, {
          team: reqbody.team_id,
          platform: "slack",
          user: event.user,
        })
      }
      break

    case "app_mention":
      console.log("app_mentioned ")
      await postEphemeralTextMessage(
        reqbody.team_id,
        event.channel,
        event.user,
        `To ask a new forecasting question, type /forecast in any channel. ` +
          `Or <slack://app?team=${reqbody.team_id}&id=${slackAppId}&tab=home|see more info and your full forecasting history.>`,
      )
      await backendAnalyticsEvent("app_mention", {
        team: reqbody.team_id,
        platform: "slack",
      })
      break

    case "message":
      if (
        event.subtype === "message_deleted" ||
        event.subtype === "message_changed"
      ) {
        console.log("Not a DM to Fatebook, ignoring")
        break
      }

      console.log("app messaged ")
      if (
        !event.bot_profile &&
        event.subtype !== "message_changed" &&
        !event.thread_ts &&
        event.user !== "USLACKBOT"
      ) {
        await postTextMessage(
          reqbody.team_id,
          event.channel,
          `Hi <@${event.user}>!\nThis channel is just for making private forecasts that only you can see.\n\n` +
            `To make a new private forecasting question, type \`/forecast\` in this channel. ` +
            `Or <slack://app?team=${reqbody.team_id}&id=${slackAppId}&tab=home|see more info and your full forecasting history.>`,
        )
      } else {
        console.log("Message from self or edited message, ignoring")
      }
      break

    default:
      console.log("Unhandled event type: ", reqbody.type)
  }

  res.status(200).send(null)
}
