import { VercelRequest, VercelResponse } from '@vercel/node';
import { BlockActionPayload, BlockActionPayloadAction } from 'seratch-slack-types/app-backend/interactive-components/BlockActionPayload'

import { Resolution } from '@prisma/client'
import prisma from '../_utils.js'

async function handleResolution(questionid : number, resolution : Resolution) {
  await prisma.question.update({
    where: {
      id: questionid,
    },
    data: {
      resolved: true,
      resolution: resolution,
      resolved_at: new Date()
    },
  })
  console.log(`handledUpdateResolution: ${questionid} ${resolution}`)
}

export async function resolve(payload: BlockActionPayload) {
  if (payload.actions === undefined)
    throw Error('blockActions: payload.actions is undefined')
  else if (payload.actions[0].action_id === undefined)
    throw Error('blockActions: payload.actions[0].action_id is undefined')
  else if (isNaN(payload.actions[0].action_id.split('_')[1] as any))
    throw Error('blockActions: cannot cast qID on action_id')
  else{
    payload.actions = payload.actions as BlockActionPayloadAction[]
    payload.actions[0].action_id = payload.actions[0].action_id as string
  }

  const actionResolve = payload.actions![0].action_id.split('_')[0]
  const questionid    = + payload.actions![0].action_id.split('_')[1]

  switch (actionResolve) {
    case 'yes':
      console.log(`yes on ${questionid}`)
      await handleResolution(questionid, Resolution.YES)
      break;
    case 'no':
      console.log(`no on ${questionid}`)
      handleResolution(questionid, Resolution.NO)
      break;
    case 'ambiguous':
      console.log(`ambiguous on ${questionid}`)
      handleResolution(questionid, Resolution.AMBIGUOUS)
      break;
    default:
      console.log('default')
      break;
  }
}

