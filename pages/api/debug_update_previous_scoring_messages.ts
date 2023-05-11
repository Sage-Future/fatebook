import { VercelRequest, VercelResponse } from "@vercel/node"
import prisma from '../../lib/_utils'
import { relativeBrierScoring } from "../../lib/_scoring"
import { scoreForecasts } from "../../lib/interactive_handlers/resolve"

export default async function updateLastWeeksQuestions(req: VercelRequest, res: VercelResponse) {
  const LAST_X_DAYS = 30
  const dateSince   = new Date(Date.now() - (LAST_X_DAYS * 24 * 60 * 60 * 1000))
  console.log(`date since ${dateSince}`)
  const qs = await prisma.question.findMany({
    where: {
      createdAt: {
        gte: dateSince
      },
      resolved: true,
      //has questionScores
      questionScores: {
        some: {
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
      questionScores : true
    }
  })
  console.log(`Found ${qs.length} questions`)
  for (const q of qs) {
    console.log(`Updating - ${q.id}`)
    try {
      const scoreArray = relativeBrierScoring(q.forecasts, q)
      await scoreForecasts(scoreArray, q)
      // wait 100ms between each update to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (e) {
      console.log(`  ${e}`)
    }
  }
  return res.status(200).json(qs)
}
