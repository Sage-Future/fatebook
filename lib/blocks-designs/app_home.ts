import { ForecastWithQuestionWithSlackMessagesAndForecasts } from "../../prisma/additional.js"
import { buildGetForecastsBlocks } from "./get_forecasts.js"
import { Blocks, textBlock } from "./_block_utils.js"

export async function buildHomeTabBlocks(teamId: string, allUserForecasts: ForecastWithQuestionWithSlackMessagesAndForecasts[]): Promise<Blocks> {
  const myForecastsBlock = await buildGetForecastsBlocks(teamId, allUserForecasts)
  return [
    ...(myForecastsBlock),
    {
      "type": "header",
      "text": textBlock(`How to use this app`)
    },
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
