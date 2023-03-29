import { VercelResponse } from '@vercel/node'

import { buildQuestionBlocks } from '../blocks-designs/question.js'
import prisma, { createProfile, getGroupIDFromSlackID } from '../_utils.js'


export async function createForecast(res : VercelResponse, commandArray : string[], slackUserId : string, slackTeamId : string) {
  let question : string = commandArray[2]
  let date_str : string = commandArray[3]
  let forecast : string = commandArray[4]
  console.log(`question: ${question}, date: ${date_str}, forecast: ${forecast}`)

  let createUserIfNotExists : boolean = true
  // query the database for the user
  //   we use findFirst because we expect only one result
  //   cannot get unique because we don't have a unique on
  //   uncertain field
  let profile = await prisma.profile.findFirst({
    where: {
      slackId: slackUserId
    },
  })


  // find the group id, create group if doesn't exist for workspace
  let groupId : number
  try {
    const createGroupIfNotExists : boolean = true
    groupId = await getGroupIDFromSlackID(slackTeamId, createGroupIfNotExists)
  } catch (err) {
    console.log(`Error: couldn't find slack group`)
    res.send({
      response_type: 'ephemeral',
      text: `I couldn't find your group! So I don't know where to assign your forecasts.`,
    })
    return
  }

  // if no profile, create one
  if(!profile) {
    try{
      profile = await createProfile(slackUserId, groupId)
    } catch(err) {
      console.log(`Error: couldn't find or create userID for slackUserId: ${slackUserId}\n Underlying error:\n`)
      console.log(err)
      res.send({
        response_type: 'ephemeral',
        text: `I couldn't create an account for your userID`,
      })
      return
    }
  }

  let forecast_num : number = Number(forecast)

  //parse the date string
  let date : Date = new Date(date_str)

  const createdQuestion = await prisma.question.create({
    data: {
      title     : question,
      resolveBy : date,
      authorId  : profile!.id,
      groups    : {
        connect: {
          id: groupId
        }
      },
      forecasts : {
        create: {
          authorId : profile!.id,
          forecast : forecast_num
        }
      }
    },
    include: {
      forecasts: {
        include: {
          profile: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })

  const questionBlocks = buildQuestionBlocks(createdQuestion)

  console.log(JSON.stringify(questionBlocks))

  try {
    res.send({
      response_type: 'in_channel',
      blocks: questionBlocks
    })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}
