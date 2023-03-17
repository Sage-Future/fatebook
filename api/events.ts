import { VercelRequest, VercelResponse } from '@vercel/node';

import { challenge } from './events_handlers/_challenge.js'
import { app_mention } from './events_handlers/_app_mention.js'
import { validate_slack_request } from './_validate.js'
import { signing_secret } from './_constants.js'

export default async function events (req : VercelRequest, res: VercelResponse) {
  const type : string = req.body.type
  console.log("event hit")

  if (type === 'url_verification') {
    await challenge(req, res)
  } else if (validate_slack_request(req, signing_secret)) {
    if (type === 'event_callback') {
      const event_type : string = req.body.event.type

      switch (event_type) {
        case 'app_mention':
          await app_mention(req, res)
          break
        default:
          break
      }
    } else {
      console.log('body:', req.body)
    }
  }
}
