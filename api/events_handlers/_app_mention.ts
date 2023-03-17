import { VercelRequest, VercelResponse } from '@vercel/node';

import { postToChannel } from '../_utils'

export async function app_mention(req : VercelRequest, res: VercelResponse) {
  let event = req.body.event

  try {
    await postToChannel(
      'general',
      res,
      `Hi there! Thanks for mentioning me, <@${event.user}>!`
    )
  } catch (e) {
    console.log(e)
  }
}
