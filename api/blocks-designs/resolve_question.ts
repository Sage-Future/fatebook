import { QuestionWithAuthor } from "../../prisma/additional";
import { Blocks, toActionId } from "./_block_utils.js";

export function buildResolveQuestionBlocks(question: QuestionWithAuthor): Blocks {
	return [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `Hey ${question?.profile.user?.name || "there"}, you asked:\n ${question.title}\n How should this resolve?`
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Yes"
					},
					"action_id": toActionId({
						action: "resolve",
						questionId: question.id,
						answer: "yes"
					})
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "No"
					},
					"action_id": toActionId({
						action: "resolve",
						questionId: question.id,
						answer: "no"
					})
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Ambiguous"
					},
					"action_id": toActionId({
						action: "resolve",
						questionId: question.id,
						answer: "ambiguous"
					})
				}
			]
		}
	]
}
