import { VercelResponse } from '@vercel/node';

import { token } from './_constants.js'

// tokenize a string into an array by splitting on sections
// in the following syntax, with two strings and one number:
// "forecast" "date" 0.8
export function tokenizeForecastString(instring : string) : string[] | null {
  const regex = /([a-zA-Z]+)\s?(\"[^"]*\")?\s?(\"?[^"\s]*\"?)?\s?([\d.]*)?/
  const array : string[] | null = instring.match(regex)
  console.log('Tokenized version:', array)
  return array
}


export function getUserID(slack_id : string) : number {
  // its always alice
  return 1
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
