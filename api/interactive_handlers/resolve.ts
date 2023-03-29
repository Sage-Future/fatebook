import { VercelRequest, VercelResponse } from '@vercel/node';
import { ResolveQuestionActionParts } from '../blocks-designs/_block_utils.js'
import { Resolution, Question } from '@prisma/client'
import { relativeBrierScoring, ScoreArray } from '../_scoring.js'

import prisma from '../_utils.js'

async function dbResolveQuestion(questionid : number, resolution : Resolution) {
  console.log(`      dbResolveQuestion ${questionid} - ${resolution}`)
  await prisma.question.update({
    where: {
      id: questionid,
    },
    data: {
      resolved: true,
      resolution: resolution,
      resolvedAt: new Date()
    },
  })
  console.log(`      dbResolveQuestion return`)
}

async function dbGetQuestion(questionid : number) {
  const questionMaybe = await prisma.question.findUnique({
    where: {
      id: questionid,
    },
    include: {
      forecasts: true,
    },
  })
  return questionMaybe
}

async function scoreForecasts(scoreArray : ScoreArray, question : Question) {
  console.log(`updating questionScores for question id: ${question.id}`)

  let updateArray : any[] = []
  for (const [id, score] of scoreArray) {
    let profileQuestionComboId = parseInt(`${id}${question.id}`)
    updateArray.push(prisma.questionScore.upsert({
      where: {
        profileQuestionComboId: profileQuestionComboId,
      },
      update: {
        score: score,
      },
      create: {
        profileQuestionComboId: profileQuestionComboId,
        profileId: id,
        questionId: question.id,
        score: score,
      }
    }))
    console.log(`  user id: ${id} with score: ${score}`)
  }
  await prisma.$transaction(updateArray)
}

async function updateForecasts(questionid : number) {
  const questionMaybe = await dbGetQuestion(questionid)
  if(!questionMaybe)
    throw Error(`Cannot find question with id: ${questionid}`)

  let question = questionMaybe!
  const scores = relativeBrierScoring(question.forecasts, question)
  await scoreForecasts(scores, question)
}

async function handleQuestionResolution(questionid : number, resolution : Resolution) {
  console.log(`    handleQuestionResolution: ${questionid} ${resolution}`)
  await dbResolveQuestion(questionid, resolution)
  console.log(`    handledUpdateQuestionResolution: ${questionid} ${resolution}`)

  await updateForecasts(questionid)
}

export async function resolve(actionParts: ResolveQuestionActionParts) {
  if (actionParts.answer === undefined)
    throw Error('blockActions: payload.actions.answer is undefined')
  else if (actionParts.questionId === undefined)
    throw Error('blockActions: missing qID on action_id')

  const { answer, questionId } = actionParts
  console.log(`  resolve question ${questionId} to ${answer}`)

  // TODO:NEAT replace yes/no/ambiguous with enum (with check for resolution template)
  switch (answer) {
    case 'yes':
      await handleQuestionResolution(questionId, Resolution.YES)
      break
    case 'no':
      await handleQuestionResolution(questionId, Resolution.NO)
      break
    case 'ambiguous':
      await handleQuestionResolution(questionId, Resolution.AMBIGUOUS)
      break
    default:
      console.log('default')
      break
  }
}

