import { VercelRequest, VercelResponse } from '@vercel/node';

import { tokenizeForecastString } from './_utils.js'
import { createForecast } from './slash_handlers/_create_forecast.js'
import { getKey } from './slash_handlers/_get_key.js'

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

  const commandArray : string[] | null = tokenizeForecastString(req.body.text)
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
      createForecast(res, commandArray!, req.body.user_id)
      break
    case 'get':
      getKey(res, commandArray)
      break
    default:
      res.send({
        response_type: 'ephemeral',
        text: 'Sorry, I don\'t recognise that command!',
      })
  }
}
