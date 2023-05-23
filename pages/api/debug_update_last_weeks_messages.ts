import { VercelRequest, VercelResponse } from "@vercel/node"
import { updateForecastQuestionMessages } from '../../lib/_utils'
import prisma from '../../lib/_utils'

export default async function updateLastWeeksQuestions(req: VercelRequest, res: VercelResponse) {
  const LAST_X_DAYS = 7
  const qs = await prisma.question.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - LAST_X_DAYS * 24 * 60 * 60 * 1000)
      },
    },
    include: {
      groups: true,
      forecasts: {
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
      },
      user: {
        include: {
          profiles: {
            include: {
              groups: true
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
    console.log(`Updating - ${q.id}`)
    try {
      await updateForecastQuestionMessages(q, "")
      // wait 100ms between each update to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (e) {
      console.log(`  ${e}`)
    }
  }
  return res.status(200).json(qs)
}

