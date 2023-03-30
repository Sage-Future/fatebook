import { VercelRequest, VercelResponse } from '@vercel/node'

import { tokenizeForecastString } from './_utils.js'
import { createForecast } from './slash_handlers/_create_forecast.js'
import { getForecasts } from './slash_handlers/_get_forecasts.js'

export default async function forecast(req : VercelRequest, res: VercelResponse){
  // If the user just types /note, we'll show them the help text
  if(req.body === undefined) {
    res.send({
      response_type: 'ephemeral',
      text: 'Usage: /note set <key> <value> or /note get <key>',
    })
    return
  }
  console.log(req.body)

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
      await createForecast(res, commandArray!, req.body.user_id, req.body.team_id, req.body.channel_id)
      break
    case 'get':
      await getForecasts(res, req.body.user_id, req.body.team_id)
      break
    default:
      res.send({
        response_type: 'ephemeral',
        text: 'Sorry, I don\'t recognise that command!',
      })
  }
}
