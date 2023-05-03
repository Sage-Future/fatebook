import { VercelRequest, VercelResponse } from '@vercel/node'

import prisma, { postBlockMessage, updateForecastQuestionMessages } from '../../lib/_utils'
import { buildResolveQuestionBlocks } from '../../lib/blocks-designs/resolve_question'

async function getQuestionsToBeResolved()  {
  // check if any questions need to be resolved by time
  const allQuestionsToBeNotified = await prisma.question.findMany({
    where: {
      resolveBy: {
        lte: new Date()
      },
      resolved: false,
      pingedForResolution: false,
      // has at least one question message
      questionMessages: { some: {} },
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


async function notifyAuthorsToResolveQuestions() {
  const allQuestionsToBeNotified = await getQuestionsToBeResolved()

  for (const question of allQuestionsToBeNotified) {
    // there should only be one slack group per profile
    const group = question.profile.groups[0]
    const slackId = question.profile.slackId!
    const teamId = group.slackTeamId!
    try {
      const resolveQuestionBlock = await buildResolveQuestionBlocks(group.slackTeamId!, question)
      const data = await postBlockMessage(teamId,
                                          slackId,
                                          resolveQuestionBlock,
                                          "Ready to resolve your question?",
                                          { unfurl_links: false, unfurl_media: false })

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
  return allQuestionsToBeNotified
}

async function updateQuestionsToUnhideForecasts(){
  const questionsToBeUpdated = await prisma.question.findMany({
    where: {
      hideForecastsUntil: {
        lte: new Date()
      },
      // where any question message is last updated before the hideForecastsUntil date or is null
      questionMessages : {
        some: {
          updatedAt: {
            lte: new Date()
          }
        }
      }
    },
    include: {
      groups: true,
      forecasts: {
        include: {
          profile: {
            include: {
              user: {
                include: {
                  profiles: {
                    include: {
                      groups: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      profile: {
        include: {
          user: {
            include: {
              profiles: true
            }
          }
        }
      },
      questionMessages: {
        include: {
          message: true
        }
      },
      resolutionMessages: {
        include: {
          message: true
        }
      },
      pingResolveMessages: {
        include: {
          message: true
        }
      },
      questionScores: true,
    }
  })

  for (const question of questionsToBeUpdated) {
    const teamId = question.questionMessages[0].message.teamId
    await updateForecastQuestionMessages(question, teamId, "Forecasts unhidden")
    await prisma.questionSlackMessage.updateMany({
      // select all ids of question messages that are in the question
      where: {
        id: {
          in: question.questionMessages.map((qm) => qm.id)
        }
      },
      data: {
        updatedAt: new Date()
      }
    })
  }

  return questionsToBeUpdated
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allQuestionsToBeNotified = await notifyAuthorsToResolveQuestions()
  const questionsToBeUpdated     = await updateQuestionsToUnhideForecasts()
  res.json({questionsToBeUpdated, allQuestionsToBeNotified})
}
