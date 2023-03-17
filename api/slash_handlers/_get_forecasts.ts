import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client'

import { getUserID } from '../_utils.js'

const prisma = new PrismaClient()

export async function getForecasts(res : VercelResponse, slack_userID : string) {

  let userID       : number = getUserID(slack_userID)

  const allUserForecasts = await prisma.forecast.findMany({
    where: {
      authorId: userID
    },
    include: {
      question: true,
    },
  })

  try {
    res.send({
      response_type: 'in_channel',
      text: `I found ${allUserForecasts.length} forecasts for you:\n
        ${allUserForecasts.map((forecast) => {return `*${forecast.question.title}* - ${forecast.forecast}`}).join('\n')}`
    })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}
