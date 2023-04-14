import { VercelRequest, VercelResponse } from '@vercel/node'

import { showCreateQuestionModal } from '../lib/interactive_handlers/edit_question_modal.js'
import { getForecasts } from '../lib/slash_handlers/_get_forecasts.js'

export default async function forecast(req : VercelRequest, res : VercelResponse){
  const reqbody = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body

  if (reqbody.text === "get") {
    await getForecasts(reqbody.user_id, reqbody.team_id, reqbody.channel_id)
  } else {
    await showCreateQuestionModal(reqbody?.team_id, reqbody?.trigger_id, reqbody.channel_id, reqbody.text)
  }
  res.status(200).send(null)
}
