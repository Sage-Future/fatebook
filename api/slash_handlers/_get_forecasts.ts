import { VercelRequest, VercelResponse } from '@vercel/node';

import { createProfileID } from '../_utils.js'
import prisma from '../_utils.js'

export async function getForecasts(res : VercelResponse, slack_userID : string) {


  // query the database for the user
  //   we use findFirst because we expect only one result
  //   cannot get unique because we don't have a unique on
  //   uncertain field
  let profile = await prisma.profile.findFirst({
    where: {
      slackId: slack_userID
    },
  })

  // if no profile, create one
  if(!profile) {
    try{
      profile = await createProfileID(slack_userID)
    } catch(err){
      console.log(`Error: couldn't find or create userID for slack_userID: ${slack_userID}`)
      res.send({
        response_type: 'ephemeral',
        text: `I couldn't find your userID`,
      })
      return
    }
  }

  const allUserForecasts = await prisma.forecast.findMany({
    where: {
      authorId: profile!.id
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
