import { VercelRequest, VercelResponse } from '@vercel/node';

export async function setKey(res : VercelResponse, commandArray : string[]) { 
  let key   : string = commandArray[1]
  let value : string = commandArray[2]

  try {
    res.send({
      response_type: 'in_channel',
      text: `I did this thing ${key}=${value}`,
    })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}
