import { QuestionWithAuthorAndQuestionMessages } from "../../prisma/additional"
import { getResolutionEmoji } from "../_utils_common"
import { getUserNameOrProfileLink } from "../_utils_server"
import { Blocks, feedbackOverflow, getQuestionTitleLink, markdownBlock } from "./_block_utils"

export async function buildQuestionResolvedBroadcastBlocks(question: QuestionWithAuthorAndQuestionMessages, teamId: string): Promise<Blocks> {
  return [
    {
      "type": "section",
      "text": markdownBlock(`${getUserNameOrProfileLink(teamId, question.user)} has resolved ${await getQuestionTitleLink(question)} as ${
        getResolutionEmoji(question.resolution)} *${question.resolution}*`),
      "accessory": feedbackOverflow(),
    },
  ]
}