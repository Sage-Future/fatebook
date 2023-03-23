import { VercelRequest, VercelResponse } from '@vercel/node'
import { Question } from '@prisma/client'

import { postMessage } from './_utils.js'
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
      let payload : string = `Hey ${question.profile.user.name}, your question *${question.title}* is ready to be resolved!`
      postMessage(question.profile.slackId!, payload)
      console.log(`Sent message to ${question.profile.slackId} for question ${question.id}`)

      await prisma.question.update({
        where: {
          id: question.id,
        },
        data: {
          pingedForResolution: true,
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
