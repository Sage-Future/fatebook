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
      questionMessages: {
        include: {
          message: true
        }
      }
    }
  })
  return allQuestionsToBeNotified
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allQuestionsToBeNotified  = await getQuestionsToBeResolved()

  for (const question of allQuestionsToBeNotified) {
    // there should only be one slack group per profile
    const group   = question.profile.groups[0]
    const slackId = question.profile.slackId!
    const teamId  = group.slackTeamId!
    try {
      const resolveQuestionBlock = await buildResolveQuestionBlocks(group.slackTeamId!, question)
      const data = await postBlockMessage(teamId,
                                          slackId,
                                          resolveQuestionBlock,
                                          "Ready to resolve your question?",
                                          {unfurl_links: false, unfurl_media:false})

      if (!data?.ts || !data?.channel) {
        console.error(`Missing message.ts or channel in response ${JSON.stringify(data)}`)
        throw new Error("Missing message.ts or channel in response")
      }

      console.log(`Sent message to ${question.profile.slackId} for question ${question.id}`)

      // OPTIMISATION:: move these intro a transaction
      await prisma.question.update({
        where: {
          id: question.id,
        },
        data: {
          pingedForResolution: true,
          pingResolveMessages: {
            create: {
              message: {
                create: {
                  ts: data.ts,
                  teamId: teamId,
                  channel: data.channel,
                }
              }
            }
          }
        },
      })

      console.log(`Updated question ${question.id} to pingedForResolution`)
    } catch (err) {
      console.error(`Error sending message on question ${question.id}: \n${err}`)
    }
  }

  res.json(allQuestionsToBeNotified)
}
