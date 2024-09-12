import { ServerClient } from "postmark"
import { renderToString } from "react-dom/server"
import ReactMarkdown from "react-markdown"
import { getUnsubscribeUrl } from "../../pages/unsubscribe"
import { postmarkApiToken } from "../_constants"
import { backendAnalyticsEvent } from "../_utils_server"
import prisma from "../prisma"
import { webFeedbackUrl } from "./utils"

export async function createNotification({
  title,
  content,
  url,
  questionId,
  tags,
  userId,
}: {
  title: string
  content: string
  url: string
  questionId: string
  tags: string[]
  userId: string
}) {
  await backendAnalyticsEvent("notification_created", { platform: "web" })
  return await prisma.notification.create({
    data: {
      title,
      content,
      url,
      tags,
      userId,
      questionId,
    },
  })
}

export async function sendBatchedEmails() {
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const users = await prisma.user.findMany({
    where: {
      // user has some unsent emails and no emails sent in the last 5 hours
      AND: [
        {
          notifications: {
            some: {
              emailSentAt: null,
            },
          },
        },
        {
          notifications: {
            none: {
              emailSentAt: {
                gte: fiveHoursAgo,
              },
            },
          },
        },
      ],
    },
    include: {
      notifications: true,
    },
  })

  for (const user of users) {
    const notifications = user.notifications
      .filter((notification) => notification.emailSentAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // oldest first
    const notificationsHtml = notifications
      .map((notification) => {
        return renderToString(
          <ReactMarkdown>{notification.content}</ReactMarkdown>,
        )
      })
      .join("<br/><br/>")

    await sendEmailUnbatched({
      subject:
        notifications.length === 1
          ? notifications[0].title
          : "New activity on your predictions",
      htmlBody: notificationsHtml + fatebookEmailFooter(user.email),
      textBody: `${notifications.length} new notification${
        notifications.length === 1 ? "" : "s"
      }`,
      to: user.email,
    })

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notifications.map((notification) => notification.id),
        },
      },
      data: {
        emailSentAt: new Date(),
      },
    })
  }
}

export async function sendEmailUnbatched({
  subject,
  htmlBody,
  textBody,
  to,
  log = true,
}: {
  subject: string
  htmlBody: string
  textBody: string
  to: string
  log?: boolean
}) {
  const user = await prisma.user.findUnique({
    where: {
      email: to,
    },
  })
  if (user?.unsubscribedFromEmailsAt) {
    log && console.log(`Not sending email to ${to} because they unsubscribed`)
    return
  }

  log && console.log("Sending email...")
  const client = new ServerClient(postmarkApiToken)
  let response
  try {
    response = await client.sendEmail({
      From: "reminders@fatebook.io",
      ReplyTo: "hello@sage-future.org",
      To: to,
      Subject:
        subject.length >= 1999 ? `${subject.slice(0, 1995)}...` : subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: "outbound",
    })
  } catch (error: any) {
    if (
      error.message.includes(
        "You tried to send to recipient(s) that have been marked as inactive.",
      )
    ) {
      log &&
        console.warn(
          `Warning: Attempted to send to inactive recipient(s). Continuing...`,
        )
    } else {
      throw error
    }
  }

  if (response?.ErrorCode) {
    log && console.error(`Error sending email: ${JSON.stringify(response)}`)
  } else {
    log && console.log(`Sent email to ${to} with subject: ${subject}`)
    await backendAnalyticsEvent("email_sent", { platform: "web" })
  }
}

export function fatebookEmailFooter(userEmailAddress: string) {
  return `\n
<br/>
<p><i><a href="https://fatebook.io">Fatebook</a> helps you rapidly make and track predictions about the future.</i></p>
<br/>
<p><a href=${webFeedbackUrl}>Give feedback on Fatebook</a></p>
<p><a href=${getUnsubscribeUrl(
    userEmailAddress,
  )}>Unsubscribe from all emails from Fatebook</a></p>
`
}
