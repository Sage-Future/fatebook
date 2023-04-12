import { QuestionWithAuthorAndSlackMessages } from "../../prisma/additional"
import { markdownBlock, textBlock, toActionId, ResolveQuestionActionParts, getQuestionTitleLink } from "./_block_utils.js"
import { conciseDateTime } from "../_utils.js"

export async function buildResolveQuestionBlocks(teamId: string, question: QuestionWithAuthorAndSlackMessages) {
  const answerLabels = ['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]
  const questionTitle     = await getQuestionTitleLink(teamId, question)
  const resolutionDateStr = conciseDateTime(question.resolveBy, false)
  return [
    {
      "type": "section",
      "text": markdownBlock(`Hey ${question?.profile.user?.name || "there"}, you asked:\n ${questionTitle}\n You said it should resolve on ${resolutionDateStr}. How should this resolve?`),
      "accessory": {
        "type": "overflow",
        "options": [
          {
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Give feedback about this app"
            },
            "value": "value-0",
            "url": "https://www.quantifiedintuitions.org/"
          }
        ]
      }
    },
    {
      "type": "actions",
      "elements": answerLabels.map((answer) => ({
        "type": "button",
        "text": textBlock(answer![0].toUpperCase() + answer!.slice(1)), // capitalize
        ...(answer != 'ambiguous') && {"style": answer == 'yes' ? "primary" : "danger"},
        "action_id": toActionId({
          action: "resolve",
          questionId: question.id,
          answer: answer
        })
      }))
    }
  ]
}
