import { ResolveQuestionActionParts } from '../blocks-designs/_block_utils.js'
import { buildQuestionResolvedBlocks } from '../blocks-designs/question_resolved.js'
import { Resolution, Question } from '@prisma/client'
import { relativeBrierScoring, ScoreCollection } from '../_scoring.js'

import prisma, { postMessageToResponseUrl, postBlockMessage, conciseDateTime } from '../_utils.js'

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

async function scoreForecasts(scoreArray : ScoreCollection, question : Question) {
  console.log(`updating questionScores for question id: ${question.id}`)

  let updateArray : any[] = []
  for (const id in scoreArray) {
    const relativeScore = scoreArray[id].relativeBrierScore
    //const absoluteScore = scoreArray[id].absoluteBrierScore
    let profileQuestionComboId = parseInt(`${id}${question.id}`)
    updateArray.push(prisma.questionScore.upsert({
      where: {
        profileQuestionComboId: profileQuestionComboId,
      },
      update: {
        score: relativeScore,
      },
      create: {
        profileQuestionComboId: profileQuestionComboId,
        profileId: Number(id),
        questionId: question.id,
        score: relativeScore,
      }
    }))
    console.log(`  user id: ${id} with relative score ${relativeScore}`)
  }
  await prisma.$transaction(updateArray)
}

async function messageUsers(scoreArray : ScoreCollection, questionid : number) {
  console.log(`messageUsers for question id: ${questionid}`)
  const question = await prisma.question.findUnique({
    where: {
      id: questionid,
    },
    include: {
      groups: true,
      profile: {
        include: {
          user: true
        }
      },
      slackMessages: true,
    },
  })
  if(!question)
    throw Error(`Cannot find question with id: ${questionid}`)

  const profiles = await prisma.profile.findMany({
    where: {
      id: {
        in: Object.keys(scoreArray).map(id => Number(id))
      },
      slackId: {
        not: null
      }
    },
    include: {
      groups: {
        where: {
          // this is likely overkill, as we should only have one slack group per profile
          id: {
            in: question.groups.map(group => group.id)
          },
          slackTeamId: {
            not: null
          }
        }
      }
    }
  })

  // go over each profile and send a message to each group they are in which
  //   are also in the question's groups
  await Promise.all(profiles.map(async profile => {
    const scoreDetails = {
      brierScore:  scoreArray[profile.id].absoluteBrierScore,
      rBrierScore: scoreArray[profile.id].relativeBrierScore,
      ranking: 2,
      totalParticipants: Object.keys(scoreArray).length,
      lastForecast: 20,
      lastForecastDate: conciseDateTime(new Date(), false),
      overallBrierScore: 0.00002,
      overallRBrierScore: 0.002
    }
    const message = `Your forecast for question ${question.title} was scored ${scoreArray[profile.id].relativeBrierScore}`
    return await Promise.all(profile.groups.map(async group => {
      const blocks = await buildQuestionResolvedBlocks(group.slackTeamId!,
                                                       question,
                                                       scoreDetails)
      await postBlockMessage(group.slackTeamId!, profile.slackId!, blocks, message, {unfurl_links: false})
    }))
  }))
}

async function updateForecastsAndMessageUsers(questionid : number) {
  const question = await dbGetQuestion(questionid)
  if(!question)
    throw Error(`Cannot find question with id: ${questionid}`)

  const scores = relativeBrierScoring(question.forecasts, question)
  await scoreForecasts(scores, question)
  await messageUsers(scores, question.id)
}

async function handleQuestionResolution(questionid : number, resolution : Resolution) {
  console.log(`    handleQuestionResolution: ${questionid} ${resolution}`)
  await dbResolveQuestion(questionid, resolution)
  console.log(`    handledUpdateQuestionResolution: ${questionid} ${resolution}`)

  await updateForecastsAndMessageUsers(questionid)
}

export async function resolve(actionParts: ResolveQuestionActionParts, responseUrl?: string, userSlackId?: string, actionValue?: string) {
  // actionParts.answer is set by buttons block in resolution reminder DM, actionValue is set by select block on question
  const answer = actionParts.answer || actionValue
  if (!answer)
    throw Error('blockActions: both payload.actions.answer and actionValue is undefined')
  else if (actionParts.questionId === undefined || userSlackId === undefined || responseUrl === undefined)
    throw Error('blockActions: missing qID on action_id')

  const { questionId } = actionParts
  console.log(`  resolve question ${questionId} to ${answer}`)

  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      profile: {
        include: {
          user: {
            include: {
              profiles: true
            }
          }
        }
      }
    },
  })

  if (!question) {
    console.error("Couldn't find question to open edit modal: ", questionId)
    await postMessageToResponseUrl({
      text: `Error: Couldn't find question to edit.`,
      replace_original: false,
      response_type: 'ephemeral',
    }, responseUrl)
    throw new Error(`Couldn't find question ${questionId}`)
  }

  if (!question.profile.user.profiles.some((p) => p.slackId === userSlackId)) {
    // user is not the author of the question
    await postMessageToResponseUrl({
      text: `Only the question's author <@${question.profile.slackId}> can resolve it.`,
      replace_original: false,
      response_type: 'ephemeral',
    }, responseUrl)
    return
  }

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
      console.error('Unhandled resolution: ', answer)
      throw new Error('Unhandled resolution')
  }
}

