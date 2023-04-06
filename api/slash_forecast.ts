import { VercelRequest, VercelResponse } from '@vercel/node'

import { showCreateQuestionModal } from './interactive_handlers/edit_question_modal.js'
import { getForecasts } from './slash_handlers/_get_forecasts.js'
import { tokenizeForecastString } from './_utils.js'

export default async function forecast(req : VercelRequest, res: VercelResponse){
  console.log("req.body: ", req.body)

  const commandArray : string[] | null = tokenizeForecastString(req.body.text as string)
  if (commandArray === null) {
    res.send({
      response_type: 'ephemeral',
      text: 'Wrong usage of the command!',
    })
    return
  }
  const action       : string   = commandArray[1]!

  switch (action) {
    case 'set':
      await showCreateQuestionModal(req.body?.team_id, req.body?.trigger_id, req.body.channel_id)
      res.status(200).send(null)
      // await createForecast(res, commandArray!, req.body.user_id, req.body.team_id, req.body.channel_id)
      break
    case 'get':
      await getForecasts(res, req.body.user_id, req.body.team_id, req.body.channel_id)
      break
    default:
      res.send({
        response_type: 'ephemeral',
        text: 'Sorry, I don\'t recognise that command!',
      })
  }
}
