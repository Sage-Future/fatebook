import { VercelRequest, VercelResponse } from '@vercel/node';

import { getProfileID } from '../_utils.js'
import prisma from '../_utils.js'

export async function getForecasts(res : VercelResponse, slack_userID : string) {

  let userID = await getProfileID(slack_userID)

  if(userID === undefined) {
    console.log(`Error: couldn't find or create userID for slack_userID: ${slack_userID}`)
    res.send({
      response_type: 'ephemeral',
      text: `I couldn't find your userID`,
    })
    return
  }

  const allUserForecasts = await prisma.forecast.findMany({
    where: {
      authorId: userID!
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
