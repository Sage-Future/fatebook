import { QuestionScore } from '@prisma/client'
import { ForecastWithQuestionWithSlackMessagesAndForecasts } from "../../prisma/additional.js"
import { buildGetForecastsBlocks } from "./get_forecasts.js"
import { Blocks, textBlock, dividerBlock, headerBlock, markdownBlock } from "./_block_utils.js"
import { formatDecimalNicely } from '../../lib/_utils.js'
import { numberOfDaysInRecentPeriod, quantifiedIntuitionsUrl } from '../_constants.js'

type ScoreDetails = {
  brierScore: number
  rBrierScore: number
  ranking: number
  totalParticipants: number
}

type QScoreLite = {
  absolute: number
  relative: number
}

function averageScores(scores: number[]) {
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function populateDetails(questionScores : QuestionScore[]) : { recentDetails: ScoreDetails, overallDetails: ScoreDetails } {
  const recentScores = questionScores.filter((qs : QuestionScore) => qs.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * numberOfDaysInRecentPeriod)).map((qs : QuestionScore) => { return {absolute: qs.absoluteScore.toNumber(), relative: qs.relativeScore.toNumber()}})

  const overallScores = questionScores.map((qs : QuestionScore) => { return {absolute: qs.absoluteScore.toNumber(), relative: qs.relativeScore.toNumber()}})
  const recentDetails = {
    brierScore: averageScores(recentScores.map((qs : QScoreLite) => qs.absolute)),
    rBrierScore: averageScores(recentScores.map((qs : QScoreLite) => qs.relative)),
    ranking: 0,
    totalParticipants: 0,
  }
  const overallDetails = {
    brierScore: averageScores(overallScores.map((qs : QScoreLite) => qs.absolute)),
    rBrierScore: averageScores(overallScores.map((qs : QScoreLite) => qs.relative)),
    ranking: 0,
    totalParticipants: 0,
  }
  return {recentDetails, overallDetails}
}

export async function buildHomeTabBlocks(teamId: string, allUserForecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[], questionScores: QuestionScore[], activePage : number = 0, closedPage : number = 0): Promise<Blocks> {
  const {recentDetails, overallDetails} = populateDetails(questionScores)

  const myRecentScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(recentDetails.brierScore, 6)}`),
        markdownBlock(`*Relative Brier score*\n ${formatDecimalNicely(recentDetails.rBrierScore, 6)}`),
        //markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks
  const myOverallScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Overall Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(overallDetails.brierScore, 6)}`),
        markdownBlock(`*Overall Relative Brier score*\n ${formatDecimalNicely(overallDetails.rBrierScore, 6)}`),
        //markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks

  const activeForecasts = allUserForecasts.filter(f => f.question.resolution == null).sort((a, b) => b.question.createdAt.getTime() - a.question.createdAt.getTime())
  const closedForecasts = allUserForecasts.filter(f => f.question.resolution != null).sort((a, b) => b.question.createdAt.getTime() - a.question.createdAt.getTime())

  const myActiveForecastsBlock : Blocks = await buildGetForecastsBlocks(teamId, activeForecasts, activePage, closedPage, true)
  const myClosedForecastsBlock : Blocks = await buildGetForecastsBlocks(teamId, closedForecasts, activePage, closedPage, false)
  return [
    headerBlock('Your score for the last 3 months'),
    ...(myRecentScoreBlock),
    dividerBlock(),
    headerBlock('Your active forecasts'),
    ...(myActiveForecastsBlock),
    dividerBlock(),
    headerBlock('Your resolved forecasts'),
    ...(myClosedForecastsBlock),
    dividerBlock(),
    headerBlock('Your all-time overall score'),
    ...(myOverallScoreBlock),
    dividerBlock(),
    headerBlock('How to use this app'),
    {
      "type": "section",
      "text": textBlock(
        '1. Ask a question about the future by typing `/forecast` in any Slack channel\n' +
        '2. Record your prediction of how likely the question is to be answered \'yes\'\n' +
        '3. After time passes, resolve the question Yes, No or Ambiguous\n' +
        '4. Check back here to see your scores and watch your prediction skills improve over time!'
      )
    },
    dividerBlock(),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`_Built by Sage to help impactful teams seek the truth. Find our other tools on <${quantifiedIntuitionsUrl}|Quantified Intuitions>_`)
      ]
    }

  ]
}
