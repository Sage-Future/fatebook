import { VercelRequest, VercelResponse } from '@vercel/node'

import { showCreateQuestionModal } from './interactive_handlers/edit_question_modal.js'
import { getForecasts } from './slash_handlers/_get_forecasts.js'
import { tokenizeForecastString, postEphemeralTextMessage } from './_utils.js'

export default async function forecast(req : VercelRequest, res : VercelResponse){
  const reqbody = JSON.parse(req.body)

  if(reqbody.text === undefined){
    res.status(200).send(null)
    return
  }

  const commandArray : string[] | null = tokenizeForecastString(reqbody.text as string)
  if (commandArray === null) {
    console.log("error with commandArray")
    await postEphemeralTextMessage(reqbody?.team_id,
                                   reqbody.channel_id,
                                   'I think you may have specified the wrong syntax on that command. Please try again!',
                                   reqbody.user_id)
    res.status(200).send(null)
    return
  }

  const action : string = commandArray![1]!

  switch (action) {
    case 'set':
      await showCreateQuestionModal(reqbody?.team_id, reqbody?.trigger_id, reqbody.channel_id)
      break
    case 'get':
      await getForecasts(reqbody.user_id, reqbody.team_id, reqbody.channel_id)
      break
    default:
      await postEphemeralTextMessage(reqbody?.team_id,
                                     reqbody.channel_id,
                                     'Sorry, I don\'t recognise that command!',
                                     reqbody.user_id)
  }
  res.status(200).send(null)
}
