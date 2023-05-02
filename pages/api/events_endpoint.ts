import { VercelRequest, VercelResponse } from '@vercel/node'
import { postEphemeralTextMessage } from '../../lib/_utils'
import { refreshAppHome } from '../../lib/interactive_handlers/app_home'
import { slackAppId } from '../../lib/_constants'

export default async function eventsApiHandler(req: VercelRequest, res: VercelResponse) {
  console.log(req.body)
  const reqbody = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body

  if (reqbody?.type === 'url_verification') {
    console.log("Sending URL verficiation. NB: This should be handled by middleware in production")
    return res.status(200).send(reqbody.challenge)
  }

  const event = reqbody?.event
  if ((!event) || (!event.type)) {
    return console.log("No event type found in request body")
  }

  // Remember to subscribe to events in the bot's `Event Subscriptions`
  switch (event.type) {
    case 'app_home_opened':
      // NB: triggers on Home tab, Messages tab, and About tab
      // we refresh the app home on all of these so it's probably ready when Home tab is opened
      console.log(`app_home_opened, tab ${(reqbody as any).tab}`)
      await refreshAppHome(event, reqbody.team_id)
      break

    case 'app_mention':
      console.log("app_mentioned ", event.text)
      await postEphemeralTextMessage(
        reqbody.team_id, event.channel, event.user,
        `To ask a new forecasting question, type /forecast in any channel. `
        + `Or <slack://app?team=${reqbody.team_id}&id=${slackAppId}&tab=home|see more info and your full forecasting history.>`
      )
      break

    default:
      console.log("Unhandled event type: ", reqbody.type)
  }

  res.status(200).send(null)
}
