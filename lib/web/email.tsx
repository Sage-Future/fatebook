import { ServerClient } from "postmark"
import { renderToString } from 'react-dom/server'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getUnsubscribeUrl } from "../../pages/unsubscribe"
import { postmarkApiToken } from "../_constants"
import prisma, { backendAnalyticsEvent } from "../_utils_server"
import { webFeedbackUrl } from "./utils"

export async function createNotification({
  content,
  url,
  tags,
  userId,
}: {
  content: string
  url: string
  tags: string[]
  userId: string
}) {
  return await prisma.notification.create({
    data: {
      content,
      url,
      tags,
      userId,
    },
  })
}

export async function sendBatchedEmails() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          notifications: {
            some: {
              emailSentAt: null
            }
          }
        },
        {
          notifications: {
            none: {
              emailSentAt: {
                gte: twoHoursAgo,
              }
            }
          }
        }
      ],
    },
    include: {
      notifications: true,
    },
  })

  for (const user of users) {
    const notifications = user.notifications
      .filter(notification => notification.emailSentAt === null)
      .map((notification) => {
        return renderToString(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notification.content}
          </ReactMarkdown>
        )
      }).join('<br/><br/>')

    await sendEmail({
      subject: 'Your Notifications',
      htmlBody: notifications,
      textBody: notifications,
      to: user.email,
    })

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        emailSentAt: new Date(),
      },
    })
  }
}

export async function sendEmail({
  subject,
  htmlBody,
  textBody,
  to,
}: {
  subject: string
  htmlBody: string
  textBody: string
  to: string
}) {
  const user = await prisma.user.findUnique({
    where: {
      email: to,
    },
  })
  if (user?.unsubscribedFromEmailsAt) {
    console.log(`Not sending email to ${to} because they unsubscribed`)
    return
  }

  console.log("Sending email...")
  const client = new ServerClient(postmarkApiToken)
  const response = await client.sendEmail({
    "From": "reminders@fatebook.io",
    "ReplyTo": "hello@sage-future.org",
    "To": to,
    "Subject": subject,
    "HtmlBody": htmlBody,
    "TextBody": textBody,
    "MessageStream": "outbound"
  })

  if (response.ErrorCode) {
    console.error(`Error sending email: ${JSON.stringify(response)}`)
  } else {
    console.log(`Sent email to ${to} with subject: ${subject}`)
    await backendAnalyticsEvent("email_sent", { platform: "web" })
  }
}

export function fatebookEmailFooter(userEmailAddress: string) {
  return `\n
<br/>
<p><i><a href="https://fatebook.io">Fatebook</a> helps you rapidly make and track predictions about the future.</i></p>
<br/>
<p><a href=${webFeedbackUrl}>Give feedback on Fatebook</a></p>
<p><a href=${getUnsubscribeUrl(userEmailAddress)}>Unsubscribe from all emails from Fatebook</a></p>
`
}