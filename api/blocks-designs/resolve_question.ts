import { QuestionWithAuthor } from "../../prisma/additional";
import { Blocks, markdownBlock, textBlock, toActionId } from "./_block_utils.js";

export function buildResolveQuestionBlocks(question: QuestionWithAuthor): Blocks {
	return [
		{
			"type": "section",
			"text": markdownBlock(`Hey ${question?.profile.user?.name || "there"}, you asked:\n ${question.title}\n How should this resolve?`)
		},
		{
			"type": "actions",
			"elements": ["yes", "no", "ambiguous"].map((answer) => ({
				"type": "button",
				"text": textBlock(answer[0].toUpperCase() + answer.slice(1)), // capitalize
				"action_id": toActionId({
					action: "resolve",
					questionId: question.id,
					answer: "yes"
				})
			}))
		}
	]
}
