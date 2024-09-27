import { VercelRequest, VercelResponse } from "@vercel/node"
import { installGlobalCommands } from "../../../lib/discord/utils"

enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.DISCORD_APP_ID) {
    res.status(500).send("Missing DISCORD_APP_ID")
    return
  }

  await installGlobalCommands(process.env.DISCORD_APP_ID, [
    {
      name: "forecast",
      description: "Make a forecast on Fatebook",
      type: 1,
      options: [
        {
          name: "question",
          description: "The question to forecast on",
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: "resolve_by",
          description: "The date to resolve the question by",
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: "prediction",
          description: "Your prediction (0-100%)",
          type: ApplicationCommandOptionType.NUMBER,
          required: true,
          min_value: 0,
          max_value: 100,
        },
        {
          name: "share_with_lists",
          description: "The lists to share the forecast with (comma-separated)",
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ])

  res.send("Installed!")
}
