import { VercelRequest, VercelResponse } from '@vercel/node'
import { Question } from '@prisma/client'

import { default as questionResolveBlocks } from './blocks-designs/resolve_question.json' assert { type: "json" }


import { postBlockMessage } from './_utils.js'
import prisma from './_utils.js'

async function getQuestionsToBeResolved()  {
  // check if any questions need to be resolved by time
  const allQuestionsToBeNotified = prisma.question.findMany({
    where: {
      resolve_at: {
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
      postBlockMessage(question.profile.slackId!, questionResolveBlocks.blocks)
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
