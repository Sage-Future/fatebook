import { VercelRequest, VercelResponse } from '@vercel/node'

export async function getKey(res : VercelResponse, commandArray : string[]) {
  let key : string = commandArray[1]

  try {
    res.send({
      response_type: 'in_channel',
      text: `You asked for "${key}"`,
    })
  } catch (err) {
    console.log('fetch Error:', err)
    res.send({
      response_type: 'ephemeral',
      text: `${err}`,
    })
  }
}
