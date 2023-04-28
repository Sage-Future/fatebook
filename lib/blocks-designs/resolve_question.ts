import { QuestionWithAuthorAndQuestionMessages } from "../../prisma/additional"
import { conciseDateTime } from "../_utils"
import { ResolveQuestionActionParts, feedbackOverflow, getQuestionTitleLink, markdownBlock, textBlock, toActionId } from "./_block_utils"

export async function buildResolveQuestionBlocks(teamId: string, question: QuestionWithAuthorAndQuestionMessages) {
  const answerLabels = ['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]
  const questionTitle     = await getQuestionTitleLink(question)
  const resolutionDateStr = conciseDateTime(question.resolveBy, false)
  return [
    {
      "type": "section",
      "text": question.resolvedAt == null ?
        (markdownBlock(`Hey ${question?.profile.slackId ? `<@${question.profile.slackId}>` : "there"}, you asked:\n ${questionTitle}\n You said it should resolve on ${resolutionDateStr}. How should this resolve?`))
        :
        markdownBlock(`_You resolved ${questionTitle} as ${question.resolution}_`),
      "accessory": feedbackOverflow()
    },
    {
      "type": "actions",
      "elements": [
        ...(question.resolvedAt == null ?
          (answerLabels.map((answer) => ({
            "type": "button",
            "text": textBlock(answer![0].toUpperCase() + answer!.slice(1)), // capitalize
            ...(answer != 'ambiguous') && {"style": answer == 'yes' ? "primary" : "danger"},
            "action_id": toActionId({
              action: "resolve",
              questionId: question.id,
              answer: answer
            })
          })))
          :
          [
            {
              "type":"button",
              "text": textBlock("Undo resolution"),
              "action_id": toActionId({
                action: "undoResolve",
                questionId: question.id
              })
            }
          ]
        )
      ]
    }
  ]
}
