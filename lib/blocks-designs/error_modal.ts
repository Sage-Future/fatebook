import { ModalView } from "@slack/types"
import { slackAppId } from "../_constants"
import { markdownBlock, textBlock } from "./_block_utils"

function displayCommand(input: string) {
  return {
    type: "context",
    elements: [markdownBlock(`You said: \`/forecast ${input}\``)],
  }
}

export function buildWrongConversationModalView(
  teamId: string,
  channelId: string,
  input: string,
): ModalView {
  return {
    type: "modal",
    title: textBlock("Add Fatebook to channel"),
    blocks: [
      {
        type: "section",
        text: markdownBlock(
          `To use /forecast here, first invite <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|@Fatebook> to this channel! Do this by mentioning or inviting <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|@Fatebook>.`,
        ),
      },
      {
        type: "context",
        elements: [
          markdownBlock(
            `Note: if you want to add Fatebook to a DM, you'll need to create a new chat (that's just how Slack works, sadly!)\n\nOr if you want to make a private forecast just for you, <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|message @Fatebook directly>.`,
          ),
        ],
      },
      ...(input && input.trim().length > 0 ? [displayCommand(input)] : []),
    ],
  }
}
