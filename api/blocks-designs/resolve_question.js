export const blocks = {
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ""
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
					"action_id": "yes_<qidhere>"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "No"
					},
					"action_id": "no_<qidhere>"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Ambiguous"
					},
					"action_id": "ambiguous_<qidhere>"
				}
			]
		}
	]
}
