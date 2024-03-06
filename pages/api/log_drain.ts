import crypto from "crypto"
import { NextApiRequest, NextApiResponse } from "next"
import { sendEmailUnbatched } from "../../lib/web/notifications"

export default async function logDrain(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const triggers = ["error", "timed out"]
  const ignoreIfIncludes = ["oauth_callback_error state cookie was missing"]

  for (const log of req.body) {
    // console.log({ log })
    if (log?.message) {
      if (
        triggers.some((trigger) =>
          (log?.message as string).toLowerCase().includes(trigger),
        ) &&
        !ignoreIfIncludes.some((ignore) =>
          (log?.message as string).toLowerCase().includes(ignore),
        )
      ) {
        // console.log("sending email")
        await sendEmailUnbatched({
          subject: `Fatebook log drain: error`,
          htmlBody: `<p><pre>Message: ${log?.message}</pre></p>\n\n<p><pre>${JSON.stringify(
            req.body,
            null,
            2,
          )}</pre></p>`,
          to: "jellyberg@gmail.com",
          textBody: req.body.message,
          log: false,
        })
      }
    }
    // } else {
    // console.warn("no message")
    // }
  }

  res.setHeader("x-vercel-verify", "cca3372a201087e19bcb9bf245e7dc741541e2f7")
  res.status(200).json({})
}

function verifySignature(req: any) {
  if (!process.env.LOG_DRAIN_SECRET) {
    return true
  }

  const signature = crypto
    .createHmac("sha1", process.env.LOG_DRAIN_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex")
  return signature === req.headers["x-vercel-signature"]
}
