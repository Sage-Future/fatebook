import { ForecastWithQuestionWithSlackMessagesAndForecasts } from "../../prisma/additional.js"
import { buildGetForecastsBlocks } from "./get_forecasts.js"
import { Blocks, textBlock, dividerBlock, headerBlock, markdownBlock } from "./_block_utils.js"
import { formatDecimalNicely } from '../../lib/_utils.js'

export async function buildHomeTabBlocks(teamId: string, allUserForecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[], activePage : number = 0, closedPage : number = 0): Promise<Blocks> {
  const details = {
    brierScore: 0.5,
    rBrierScore: 0.5,
    ranking: 1,
    totalParticipants: 1,
  }
  const myRecentScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(details.brierScore, 6)}`),
        markdownBlock(`*Relative Brier score*\n ${formatDecimalNicely(details.rBrierScore, 6)}`),
        markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks
  const myOverallScoreBlock     = [
    {
      type: 'section',
      'fields': [
        markdownBlock(`*Overall Brier score* _(<https://en.wikipedia.org/wiki/Brier_score|Lower is better>)_\n ${formatDecimalNicely(details.brierScore, 6)}`),
        markdownBlock(`*Overall Relative Brier score*\n ${formatDecimalNicely(details.rBrierScore, 6)}`),
        markdownBlock(`*Ranking*\n *${details.ranking}*/${details.totalParticipants}`),
      ]
    }
  ] as Blocks

  const activeForecasts = allUserForecasts.filter(f => f.question.resolution == null)
  const closedForecasts = allUserForecasts.filter(f => f.question.resolution != null)

  const myActiveForecastsBlock : Blocks = await buildGetForecastsBlocks(teamId, activeForecasts, activePage, closedPage, true)
  const myClosedForecastsBlock : Blocks = await buildGetForecastsBlocks(teamId, closedForecasts, activePage, closedPage, false)
  return [
    headerBlock('Your Score for this Quarter'),
    ...(myRecentScoreBlock),
    dividerBlock(),
    headerBlock('Your Active Forecasts'),
    ...(myActiveForecastsBlock),
    dividerBlock(),
    headerBlock('Your Resolved Forecasts'),
    ...(myClosedForecastsBlock),
    dividerBlock(),
    headerBlock('Your Overall Score'),
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
  ]
}
