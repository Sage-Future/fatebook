import { VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client'

import { token } from './_constants.js'

const prisma = new PrismaClient()
export default prisma

// tokenize a string into an array by splitting on sections
// in the following syntax, with two strings and one number:
// "forecast" "date" 0.8
export function tokenizeForecastString(instring : string) : string[] | null {
  const regex = /([a-zA-Z]+)\s?(\"[^"]*\")?\s?(\"?[^"\s]*\"?)?\s?([\d.]*)?/
  const array : string[] | null = instring.match(regex)
  console.log('Tokenized version:', array)
  return array
}

export async function getSlackUserlFromSlackId(slackId : string) {
  try {
    const url = 'https://slack.com/api/users.info'
    const response = await fetch(url+`?user=${slackId}`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      }
    })
    const data = await response.json()
    console.log('data from fetch:', data)
    return data.user
  } catch (err) {
    console.log('fetch email Error:', err)
    throw err
  }
}

export async function getProfileID(slackId : string, createUserIfNotExists : boolean = false) : Promise<number | undefined>{
  // query the database for the user
  //   we use findFirst because we expect only one result
  //   cannot get unique because we don't have a unique on
  //   uncertain field
  let profile = await prisma.profile.findFirst({
    where: {
      slackId: slackId
    },
  })

  if (createUserIfNotExists && !profile) {
    // check if the user exists
    let slackUser
    try {
      slackUser = (await getSlackUserlFromSlackId(slackId)).profile
      if(slackUser === undefined) {
        throw new Error('slackUser not found')
      }
      console.log('slackUser found:', slackUser)
    } catch (err) {
      console.log('Error getting email from slackId:', err)
      return undefined
    }
    let user = await prisma.user.findUnique({
      where: {
        email: slackUser.email
      },
    })
    if (!user) {
      await prisma.user.create({
        data: {
          email: slackUser.email,
          name: slackUser.real_name,
          profiles: {
            create: {
              slackId: slackId,
            }
          }
        },
      })
    }else{
      // create the profile if they don't exist
      await prisma.profile.create({
        data: {
          slackId: slackId,
          userId: user.id,
        },
      })
    }
    // see above for why findFirst is used
    profile = await prisma.profile.findFirst({
      where: {
        slackId: slackId
      },
    })
  }

  return profile?.id
}

export function tokenizeString(instring : string) {
  const array : string[] = instring.split(' ').filter((element) => {
    return element !== ''
  })
  console.log('Tokenized version:', array)
  return array
}

export async function postToChannel(channel : string, res : VercelResponse, payload : string) {
  console.log('channel:', channel)
  const channelId = await channelNameToId(channel)

  console.log('ID:', channelId)

  const message = {
    channel: channelId,
    text: payload,
  }

  try {
    const url = 'https://slack.com/api/chat.postMessage'
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    })
    const data = await response.json()

    console.log('data from fetch:', data)
    res.json({ ok: true })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}

async function channelNameToId(channelName : string) {
  let generalId
  let id

  try {
    const url = 'https://slack.com/api/conversations.list'
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()

    data.channels.forEach((element : any) => {
      if (element.name === channelName) {
        id = element.id
      }
      if (element.name === 'general') generalId = element.id
    })
    if (id) {
      return id
    } else return generalId
  } catch (err) {
    console.log('fetch Error:', err)
  }
  return id
}
