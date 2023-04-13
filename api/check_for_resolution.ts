import { VercelRequest, VercelResponse } from '@vercel/node'

import { buildResolveQuestionBlocks } from '../lib/blocks-designs/resolve_question.js'
import prisma, { postBlockMessage } from '../lib/_utils.js'

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
          groups: {
            where: {
              slackTeamId:{
                not: null
              }
            }
          }
        }
      },
      slackMessages: true
    }
  })
  return allQuestionsToBeNotified
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allQuestionsToBeNotified  = await getQuestionsToBeResolved()

  for (const question of allQuestionsToBeNotified) {
    try {
      await Promise.all(question.profile.groups.map(async group => {
        const resolveQuestionBlock = await buildResolveQuestionBlocks(group.slackTeamId!, question)
        await postBlockMessage(group.slackTeamId!, question.profile.slackId!, resolveQuestionBlock, "Ready to resolve your question?", {unfurl_links: false})
      }))
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
