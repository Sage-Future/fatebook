import { VercelRequest, VercelResponse } from '@vercel/node';
import { BlockActionPayload } from 'seratch-slack-types/app-backend/interactive-components/BlockActionPayload'

import { resolve } from './interactive_handlers/resolve.js'


async function blockActions(payload: BlockActionPayload) {
  await resolve(payload)
}

export default async function (req : VercelRequest, res: VercelResponse){
  const payload: BlockActionPayload = JSON.parse(req.body.payload)
  switch (payload.type) {
    case 'block_actions':
      console.log('block_actions')
      await blockActions(payload)
      console.log('block_actions done')
      res.status(200).json({message:'ok'})
      break;
    case 'view_submission':
      console.log('view_submission')
      break;
    case 'view_closed':
      console.log('view_closed')
      break;
    case 'message_action':
      console.log('message_action')
      break;
    case 'shortcut':
      console.log('shortcut')
      break;
    default:
      console.log('default')
      break;
  }
}
