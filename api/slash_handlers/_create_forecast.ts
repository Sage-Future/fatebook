import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client'

import { getUserID } from '../_utils.js'

const prisma = new PrismaClient()

export async function createForecast(res : VercelResponse, commandArray : string[], slack_userID : string) {
  let question : string = commandArray[2]
  let date_str : string = commandArray[3]
  let forecast : string = commandArray[4]
  console.log(`question: ${question}, date: ${date_str}, forecast: ${forecast}`)

  let userID       : number = getUserID(slack_userID)
  let forecast_num : number = Number(forecast)

  //parse the date string
  let date : Date = new Date(date_str)

  await prisma.question.create({
    data: {
          title     : question,
          resolve_at: date,
          authorId  : userID,
      forecasts : { 
        create: {
      authorId : userID,
      forecast : forecast_num
      }}
    },
  })

  try {
    res.send({
      response_type: 'in_channel',
      text: `I made a forecast for ${question} on ${date.toDateString()} with the forecast ${forecast} likelihood`,
    })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}
