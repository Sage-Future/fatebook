import { Target, TargetType } from '@prisma/client'
import { Blocks, targetSetButtons, textBlock, toActionId } from './_block_utils'
import { markdownBlock } from './_block_utils'

export function buildTargetSet() : Blocks{
  return [
    {
      'type': 'section',
      'text': markdownBlock(`Building a forecasting habit can help:
      1. Improve your predictive skills
      2. Communicate your uncertainty more clearly
      3. Build a track record of your calibration
      
      *Want to set a forecasting target for this week?*`),
    },
    ...targetSetButtons(false)
  ]
}

export function buildTargetAdjust() : Blocks{
  return [
    {
      'type': 'section',
      'text': markdownBlock(`*What would you like your forecasting target to be for this week?*`),
    },
    ...targetSetButtons(false)
  ]
}

export function buildTargetReset(){
  return [
    {
      'type': 'section',
      'text': markdownBlock(`*Want to set a forecasting target?*`),
    },
    targetSetButtons(false)
  ]
}

export function buildConfirmTarget(type : TargetType, goal : number){
  const noun   = type == TargetType.QUESTION ? 'question' : 'forecast'
  const plural = goal === 1 ? '' : 's'
  return [
    {
      'type': 'section',
      'text': markdownBlock(`Great! I've set your goal of *${goal} ${noun}${plural}* by next week!\nI'll check in with you to see how you did.`),
    },
  ]
}

function buildTargetAdjustButtons(){
  return [
    {
      'type': 'actions',
      'elements': [
        {
          'type': 'button',
          'text': textBlock('Adjust my target'),
          'action_id': toActionId(
            {
              action: 'targetAdjust',
              cancel: false,
            }),
          'value': 'adjust_target',
        },
        {
          'type': 'button',
          'text': textBlock('Cancel my target'),
          'action_id': toActionId(
            {
              action: 'targetAdjust',
              cancel: true,
            }),
          'value': 'cancel_target',
        }
      ]
    }
  ]
}
export function buildTargetNotificationText(target : Target, actual : number){
  const met    = actual >= target.goal
  const noun   = target.type == TargetType.QUESTION ? 'question' : 'forecast'
  const plural = actual === 1 ? '' : 's'
  const quote  = met ?
    `Great work forming your forecasting habit!`
    : `You missed your target this week!`
  const summary = `You made *${actual} ${noun}${plural}* this week.`
  return `${quote} ${summary}`
}

export function buildTargetNotification(target : Target, actual : number){
  const goalNoun   = target.type == TargetType.QUESTION ? 'question' : 'forecast'
  const goalPlural = target.goal === 1 ? '' : 's'
  return [
    {
      'type': 'section',
      'text': markdownBlock(`${buildTargetNotificationText(target, actual)}\nNext week, aim to make ${target.goal} ${goalNoun}${goalPlural}.`),
    },
    ...(buildTargetAdjustButtons())
  ]
}