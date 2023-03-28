import { Resolution } from '@prisma/client';
import { ResolveQuestionActionParts } from '../blocks-designs/_block_utils.js';
import prisma from '../_utils.js';

async function handleResolution(questionid : number, resolution : Resolution) {
  await prisma.question.update({
    where: {
      id: questionid,
    },
    data: {
      resolved: true,
      resolution: resolution,
      resolved_at: new Date()
    },
  })
  console.log(`handledUpdateResolution: ${questionid} ${resolution}`)
}

export async function resolve(actionParts: ResolveQuestionActionParts) {
  if (actionParts.answer === undefined)
    throw Error('blockActions: payload.actions.answer is undefined')
  else if (actionParts.questionId === undefined)
    throw Error('blockActions: missing qID on action_id')

  const { answer, questionId } = actionParts
  console.log(`resolve question ${questionId} to ${answer}`)

  switch (answer) {
    case 'yes':
      await handleResolution(questionId, Resolution.YES)
      break;
    case 'no':
      handleResolution(questionId, Resolution.NO)
      break;
    case 'ambiguous':
      handleResolution(questionId, Resolution.AMBIGUOUS)
      break;
    default:
      console.log('default')
      break;
  }
}

