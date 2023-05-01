import { VercelRequest, VercelResponse } from "@vercel/node"
import { updateForecastQuestionMessages } from '../../lib/_utils'
import prisma from '../../lib/_utils'

export default async function testScoring(req: VercelRequest, res: VercelResponse) {
  // query for all questions created in past week
  const qs = await prisma.question.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
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
      }

    }
  })

  for (const q of qs) {
    console.log(`Updating - ${q.title}`)
    try {
      await updateForecastQuestionMessages(q, q.groups[0].slackTeamId!, "")
    } catch (e) {
      console.log(`  ${e}`)
    }
  }
  return res.status(200).json(qs)
}

