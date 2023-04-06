import { QuestionWithAuthor } from "../../prisma/additional"
import { Blocks, markdownBlock, textBlock, toActionId, ResolveQuestionActionParts } from "./_block_utils.js"

export function buildResolveQuestionBlocks(question: QuestionWithAuthor): Blocks {
  const answerLabels = ['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]
  return [
    {
      "type": "section",
      "text": markdownBlock(`Hey ${question?.profile.user?.name || "there"}, you asked:\n ${question.title}\n How should this resolve?`)
    },
    {
      "type": "actions",
      "elements": answerLabels.map((answer) => ({
        "type": "button",
        "text": textBlock(answer[0].toUpperCase() + answer.slice(1)), // capitalize
        "action_id": toActionId({
          action: "resolve",
          questionId: question.id,
          answer: answer
        })
      }))
    }
  ]
}
