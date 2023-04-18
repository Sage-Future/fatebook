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
      // send message to all of the groups listed
      //   due to the prisma select, will only be relevae groups
      const timestamps = await Promise.all(question.profile.groups.map(async group => {
        const resolveQuestionBlock = await buildResolveQuestionBlocks(group.slackTeamId!, question)
        const data await postBlockMessage(group.slackTeamId!, question.profile.slackId!, resolveQuestionBlock, "Ready to resolve your question?", {unfurl_links: false, unfurl_media:false})
        if (!data?.ts) {
          console.error(`Missing message.ts in response ${JSON.stringify(data)}`)
          throw new Error("Missing message.ts in response")
        }
      }))
      console.log(`Sent message to ${question.profile.slackId} for question ${question.id}`)

      // OPTIMISATION:: move these intro a transaction
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

  res.json(allQuestionsToBeNotified)
}
