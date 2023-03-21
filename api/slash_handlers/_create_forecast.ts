import { VercelRequest, VercelResponse } from '@vercel/node';

import { getProfileID } from '../_utils.js'
import prisma from '../_utils.js'


export async function createForecast(res : VercelResponse, commandArray : string[], slack_userID : string) {
  let question : string = commandArray[2]
  let date_str : string = commandArray[3]
  let forecast : string = commandArray[4]
  console.log(`question: ${question}, date: ${date_str}, forecast: ${forecast}`)

  let createUserIfNotExists : boolean = true
  let userID = await getProfileID(slack_userID, createUserIfNotExists)

  if(userID === undefined) {
    console.log(`Error: couldn't find or create userID for slack_userID: ${slack_userID}`)
    res.send({
      response_type: 'ephemeral',
      text: `I couldn't find your userID`,
    })
    return
  }

  let forecast_num : number = Number(forecast)

  //parse the date string
  let date : Date = new Date(date_str)

  await prisma.question.create({
    data: {
          title     : question,
          resolve_at: date,
          authorId  : userID!,
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
