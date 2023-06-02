import { VercelRequest, VercelResponse } from '@vercel/node'
import { BlockActionPayload } from 'seratch-slack-types/app-backend/interactive-components/BlockActionPayload'
import { QuestionModalActionParts, unpackBlockActionId } from '../../lib/blocks-designs/_block_utils'
import { deleteQuestion, questionModalSubmitted, showEditQuestionModal, updateFromCheckboxes } from '../../lib/interactive_handlers/edit_question_modal'
import { showForecastLogModal } from '../../lib/interactive_handlers/question_forecast_log_modal'
import { questionOverflowAction } from '../../lib/interactive_handlers/question_overflow'
import { buttonHomeAppPageNavigation } from '../../lib/interactive_handlers/app_home'

import { buttonUndoResolution, resolve } from '../../lib/interactive_handlers/resolve'
import { submitTextForecast } from '../../lib/interactive_handlers/submit_text_forecast'
import { buttonTargetAdjust, buttonTargetSet, buttonTriggerTargetSet } from '../../lib/interactive_handlers/targets'

async function blockActions(payload: BlockActionPayload) {
  for (const action of payload.actions!) {
    if (!action.action_id) {
      console.warn(`Missing action id in action: ${action}`)
      return
    }
    const actionParts = unpackBlockActionId(action.action_id)
    let callbackParts : QuestionModalActionParts = {action: 'qModal',
      isCreating: false,
      channel: '',
    }
    if (payload.view?.callback_id?.startsWith('question_modal')) {
      // extract callback_id after 'question_modal'
      const actionId = payload.view.callback_id.substring('question_modal'.length)
      callbackParts = unpackBlockActionId(actionId) as QuestionModalActionParts
    }
    switch (actionParts.action) {
      case 'resolve':
        console.log('  resolve')
        await resolve(actionParts, payload?.response_url, payload.user?.id, action.selected_option?.value, payload?.team?.id)
        break

      case 'submitTextForecast':
        await submitTextForecast(actionParts, action, payload)
        break

      case 'updateResolutionDate':
        console.log('  updateResolutionDate: user changed resolution date in modal, do nothing')
        break

      case 'updateHideForecastsDate':
        console.log('  updateHideForecastsDate: user changed hide date in modal, do nothing')
        break

      case 'editQuestionBtn':
        await showEditQuestionModal(actionParts, payload)
        break

      case 'questionOverflow':
        await questionOverflowAction(actionParts, action, payload)
        break

      case 'undoResolve':
        await buttonUndoResolution(actionParts, payload)
        break

      case 'deleteQuestion':
        await deleteQuestion(actionParts, payload)
        break

      case 'homeAppPageNavigation':
        await buttonHomeAppPageNavigation(actionParts, payload)
        break

      case 'viewForecastLog':
        await showForecastLogModal(actionParts, payload)
        break

      case 'optionsCheckBox':
        await updateFromCheckboxes(actionParts, payload, callbackParts.channel)
        break

      case 'targetAdjust':
        await buttonTargetAdjust(actionParts, payload)
        break

      case 'targetSet':
        await buttonTargetSet(actionParts, payload)
        break

      case 'forecastMore':
        await buttonTriggerTargetSet(actionParts, payload)
        break

      default:
        console.warn('Unknown action: ', actionParts)
        break
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const reqbody = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body
  const payload = JSON.parse(reqbody.payload) as BlockActionPayload
  switch (payload.type) {
    case 'block_actions':
      console.log('block_actions')
      await blockActions(payload)
      console.log('block_actions done')
      break
    case 'view_submission':
      console.log('view_submission')
      if (payload.view?.callback_id?.startsWith('question_modal')) {
        // extract callback_id after 'question_modal'
        const actionId = payload.view.callback_id.substring('question_modal'.length)
        const actionParts = unpackBlockActionId(actionId) as QuestionModalActionParts
        await questionModalSubmitted(payload, actionParts)
      }
      break
    case 'view_closed':
      console.log('view_closed')
      break
    case 'message_action':
      console.log('message_action')
      break
    case 'shortcut':
      console.log('shortcut')
      break
    default:
      console.log('default')
      break
  }

  console.log('handler done')
  res.status(200).send(null)
}
