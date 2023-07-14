import { NextApiRequest, NextApiResponse } from "next"
import prisma, { backendAnalyticsEvent } from "../../../lib/_utils_server"
import { getQuestionUrl } from "../../q/[id]"

interface Request extends NextApiRequest {
  body: {
    apiKey: string
    title: string
    resolveBy: string
    forecast: number
  }
}

const createQuestionPublicApi = async (req: Request, res: NextApiResponse) => {
  const { apiKey, title, resolveBy, forecast } = req.query
  if (
    typeof apiKey !== "string" ||
    typeof title !== "string" ||
    typeof resolveBy !== "string" ||
    new Date(resolveBy) === undefined ||
    typeof forecast !== "string" ||
    isNaN(parseFloat(forecast)) ||
    parseFloat(forecast) < 0 ||
    parseFloat(forecast) > 1
  ) {
    res.status(400).json({
      error: `Invalid request. apiKey must be a string (see https://fatebook.io/api-setup), title must be a string, resolveBy must be a string (YYYY-MM-DD), and forecast must be a number between 0 and 1. `
      + `Got apiKey: ${apiKey} title: ${title}, resolveBy: ${resolveBy}, forecast: ${forecast}`,
    })
    return
  }

  const user = await prisma.user.findFirst({
    where: {
      apiKey: apiKey
    }
  })
  if (!user) {
    res.status(401).json({
      error: `Invalid API key. Check your API key at https://fatebook.io/api-setup`
    })
    return
  }

  const question = await prisma.question.create({
    data: {
      title: title,
      resolveBy: new Date(resolveBy),
      userId: user.id,
      forecasts: forecast ? {
        create: {
          userId: user.id,
          forecast: forecast,
        }
      } : undefined,
    },
  })

  await backendAnalyticsEvent("question_created", {
    platform: "web",
    user: user.id,
  })

  if (forecast) {
    await backendAnalyticsEvent("forecast_submitted", {
      platform: "web",
      user: user.id,
      question: question.id,
      forecast: forecast,
    })
  }

  res.status(200).send(getQuestionUrl(question, false))
}
export default createQuestionPublicApi
