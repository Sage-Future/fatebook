import { VercelRequest, VercelResponse } from '@vercel/node'
import { Question } from '@prisma/client'

import { blocks as questionResolveBlocks } from './blocks-designs/resolve_question.js'


import { postBlockMessage } from './_utils.js'
import prisma from './_utils.js'

async function getQuestionsToBeResolved()  {
  // check if any questions need to be resolved by time
  const allQuestionsToBeNotified = prisma.question.findMany({
    where: {
      resolve_by: {
        lte: new Date()
      },
      resolved: false,
      pingedForResolution: false,
    },
    include: {
      profile: {
        include: {
          user: true,
        }
      }
    } 
  })
  return allQuestionsToBeNotified
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const allQuestionsToBeNotified  = await getQuestionsToBeResolved();

  for (const question of allQuestionsToBeNotified) {
    try { 
      let this_block : any = questionResolveBlocks.blocks
      const name : string = question?.profile.user.name || 'there'

      // adjust block for question
      this_block[0].text.text = `Hey ${name}, you asked:\n ${question.title}\n How should this resolve?`
      // TODO:NEAT -- decouple this from block design -- map qidhere
      this_block[1].elements[0].action_id = `yes_${question.id}`
      this_block[1].elements[1].action_id = `no_${question.id}`
      this_block[1].elements[2].action_id = `ambiguous_${question.id}`

      postBlockMessage(question.profile.slackId!, this_block)
      console.log(`Sent message to ${question.profile.slackId} for question ${question.id}`)

      await prisma.question.update({
        where: {
          id: question.id,
        },
        data: {
          //TODO change to true
          pingedForResolution: false,
        },
      })
      console.log(`Updated question ${question.id} to pingedForResolution`)
    } catch (err) {
      console.error(`Error sending message on question ${question.id}: \n${err}`)
    }
  }

  res.json(allQuestionsToBeNotified);
}

export default handler;
