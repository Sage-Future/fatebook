import { ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts } from "../../prisma/additional"
import { maxDecimalPlacesForecastForecastListing } from "../_constants"
import {
  Blocks,
  buildForecastQuestionText,
  buildPredictOptions,
  dividerBlock,
  historyAndFeedbackFooter,
  markdownBlock,
  textBlock,
  toActionId,
} from "./_block_utils"

export async function buildStaleForecastsReminderBlock(
  forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[],
  slackTeamId: string,
) {
  return [
    {
      type: "section",
      text: markdownBlock(
        `You've got some forecasts that are two weeks old today! Would you like to update them?`,
      ),
    },
    ...(await buildListForecastsBlock(forecasts)),
    dividerBlock(),
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: textBlock("Never remind me again"),
          action_id: toActionId({
            action: "cancelStaleReminder",
          }),
          value: "reminder_cancel_all",
          confirm: {
            title: textBlock("Are you sure?"),
            text: textBlock(
              "You will not be reminded about stale forecasts again.",
            ),
            confirm: textBlock("Yes, do not remind me again"),
            deny: textBlock("No, take me back"),
          },
        },
      ],
    },
    historyAndFeedbackFooter(slackTeamId),
  ]
}

async function buildListForecastsBlock(
  forecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[],
) {
  let blocks: Blocks = []
  for (const forecast of forecasts) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    blocks = blocks.concat([
      {
        type: "section",
        text: markdownBlock(
          await buildForecastQuestionText(
            forecast,
            undefined,
            maxDecimalPlacesForecastForecastListing,
          ),
        ),
      },
      buildPredictOptions(
        forecast.question,
        forecasts.map((f) => f.id),
      ),
    ])
  }
  return blocks
}
