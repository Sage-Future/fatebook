import { VercelRequest, VercelResponse } from '@vercel/node'
import { showCreateQuestionModal } from '../lib/interactive_handlers/edit_question_modal.js'

export default async function forecast(req : VercelRequest, res : VercelResponse){
  const reqbody = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body

  await showCreateQuestionModal(reqbody?.team_id, reqbody?.trigger_id, reqbody.channel_id, reqbody.text)

  res.status(200).send(null)
}
