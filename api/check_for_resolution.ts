import { VercelRequest, VercelResponse } from '@vercel/node'

import { buildResolveQuestionBlocks } from './blocks-designs/resolve_question.js'


import prisma, { postBlockMessage } from './_utils.js'

async function getQuestionsToBeResolved()  {
  // check if any questions need to be resolved by time
  const allQuestionsToBeNotified = await prisma.question.findMany({
    where: {
      resolveBy: {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allQuestionsToBeNotified  = await getQuestionsToBeResolved()

  for (const question of allQuestionsToBeNotified) {
    try {
      let resolveQuestionBlock = buildResolveQuestionBlocks(question)

      await postBlockMessage(question.profile.slackId!, resolveQuestionBlock, "Ready to resolve your question?")
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

  res.json(allQuestionsToBeNotified)
}
