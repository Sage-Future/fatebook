import { QuestionScore } from '@prisma/client'
import { ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts } from "../../prisma/additional"
import { baseUrl, feedbackFormUrl, maxAvgScoreDecimalPlaces, numberOfDaysInRecentPeriod, quantifiedIntuitionsUrl, slackAppId } from '../_constants'
import { averageScores, formatDecimalNicely } from "../_utils_common"
import { Blocks, dividerBlock, headerBlock, markdownBlock } from "./_block_utils"
import { buildGetForecastsBlocks } from "./get_forecasts"

type ScoreDetails = {
  brierScore: number
  rBrierScore: number | undefined
  ranking: number
  totalParticipants: number
}

type QScoreLite = {
  absolute: number
  relative: number | undefined
}

function populateDetails(questionScores : QuestionScore[]) : { recentDetails: ScoreDetails, overallDetails: ScoreDetails } {
  const recentScores = questionScores.filter((qs : QuestionScore) =>
    qs.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * numberOfDaysInRecentPeriod))
    .map((qs : QuestionScore) => {
      return {
        absolute: qs.absoluteScore.toNumber(),
        relative: qs.relativeScore?.toNumber()
      }
    })

  const overallScores = questionScores.map((qs : QuestionScore) => {
    return {
      absolute: qs.absoluteScore.toNumber(),
      relative: qs.relativeScore?.toNumber()
    }
  })
  const recentDetails = {
    brierScore:  averageScores(recentScores.map((qs : QScoreLite) => qs.absolute))!,
    rBrierScore: averageScores(recentScores.map((qs : QScoreLite) => qs.relative)),
    ranking: 0,
    totalParticipants: 0,
  }
  const overallDetails = {
    brierScore:  averageScores(overallScores.map((qs : QScoreLite) => qs.absolute))!,
    rBrierScore: averageScores(overallScores.map((qs : QScoreLite) => qs.relative)),
    ranking: 0,
    totalParticipants: 0,
  }
  return {recentDetails, overallDetails}
}

export async function buildHomeTabBlocks(teamId: string, fatebookUserId: number, allUserForecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[], questionScores: QuestionScore[], activePage : number = 0, closedPage : number = 0): Promise<Blocks> {
  const {recentDetails, overallDetails} = populateDetails(questionScores)

  const formatScore = (score: number | undefined) => {
    return (score || score === 0) ? formatDecimalNicely(score, maxAvgScoreDecimalPlaces) : '...'
  }

  const myRecentScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatScore(recentDetails.brierScore)}`),
        markdownBlock(`*Relative Brier score*\n ${formatScore(recentDetails.rBrierScore)}`),
        //markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks
  const myOverallScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Overall Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatScore(overallDetails.brierScore)}`),
        markdownBlock(`*Overall Relative Brier score*\n ${formatScore(overallDetails.rBrierScore)}`),
        //markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks

  const activeForecasts = allUserForecasts.filter(f => f.question.resolution == null).sort((a, b) => b.question.createdAt.getTime() - a.question.createdAt.getTime())
  const closedForecasts = allUserForecasts.filter(f => f.question.resolution != null).sort((a, b) => b.question.createdAt.getTime() - a.question.createdAt.getTime())

  const myActiveForecastsBlock : Blocks = await buildGetForecastsBlocks(
    activeForecasts, activePage, closedPage, true,
    '_Time to make your first prediction! Create a question by typing `/forecast` in any channel._',
    []
  )
  const myClosedForecastsBlock : Blocks = await buildGetForecastsBlocks(
    closedForecasts, activePage, closedPage, false,
    '_Check here once a question you\'ve forecasted on has resolved._',
    questionScores
  )
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
    questionScores.length > 0 ? {
      type: "image",
      image_url: `${baseUrl}/api/calibration_graph?user=${fatebookUserId}&r=${new Date().getTime()}`, // force refresh
      alt_text: "Your calibration graph",
    } : {type: "section", text: markdownBlock('_Check back to see how well calibrated you are once your first forecast has resolved._')},
    dividerBlock(),
    headerBlock('How to use this app'),
    {
      "type": "section",
      "text": markdownBlock(
        '1. Ask a question about the future by typing `/forecast` in any Slack channel\n' +
        '2. Record your prediction of how likely the question is to be answered \'yes\'\n' +
        '3. After time passes, resolve the question Yes, No or Ambiguous\n' +
        '4. Check back here to see your scores and watch your prediction skills improve over time!'
      )
    },
    dividerBlock(),
    headerBlock('What\'s new?'),
    {
      "type": "section",
      "text": markdownBlock(
        '• See how well calibrated you are with our new calibration graph. Perfect calibration means things you expect to happen X% of the time do in fact happen X% of the time. This is a skill you can train, e.g. using our <https://www.quantifiedintuitions.org/calibration|calibration app>!\n' +
        '• You can now hide other forecasters’ predictions on a question to prevent anchoring. Look for the new option when you use `/forecast`\n' +
        `• Create private forecasts by <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|DMing @Fatebook> - just type \`/forecast\``
      )
    },
    {
      "type": "section",
      "text": markdownBlock(
        `What do you want us to add next? <${feedbackFormUrl}|Let us know>!`
      )
    },
    dividerBlock(),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`_<https://fatebook.io|Fatebook> is built by Sage to help impactful teams seek the truth._`),
        markdownBlock(`_Want more Fatebook? <https://fatebook.io/for-slack|Add Fatebook to another Slack workspace>._`),
        markdownBlock(`_Find our other forecasting tools on <${quantifiedIntuitionsUrl}|Quantified Intuitions>._`),
      ]
    }

  ]
}
