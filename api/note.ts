import { VercelRequest, VercelResponse } from '@vercel/node';

import { tokenizeString } from './_utils.js'
import { setKey } from './slash_handlers/_set_key.js'
import { getKey } from './slash_handlers/_get_key.js'

export default async function note(req : VercelRequest, res: VercelResponse){
  // If the user just types /note, we'll show them the help text
  if(req.body === undefined) {
    res.send({
      response_type: 'ephemeral',
      text: 'Usage: /note set <key> <value> or /note get <key>',
    })
    return
  }
  console.log(req.body)
  const commandArray : string[] = tokenizeString(req.body.text)
  const action       : string   = commandArray[0]

  switch (action) {
    case 'set':
      setKey(res, commandArray)
      break
    case 'get':
      getKey(res, commandArray)
      break
    default:
      res.send({
        response_type: 'ephemeral',
        text: 'Wrong usage of the command!',
      })
  }
}
