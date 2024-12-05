import { ServerClient } from "postmark"
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
      notifications: {
        where: {
          emailSentAt: null,
        },
        include: {
          question: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  })

  for (const user of users) {
    const notifications = user.notifications
      .filter((notification) => notification.emailSentAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // oldest first
    const notificationsByQuestionId = notifications.reduce(
      (acc, notification) => {
        if (!notification.questionId) {
          // Collect notifications without questionId separately
          acc["no-question"] = acc["no-question"] || []
          acc["no-question"].push(notification)
        } else {
          acc[notification.questionId] = acc[notification.questionId] || []
          acc[notification.questionId].push(notification)
        }
        return acc
      },
      {} as Record<string, typeof notifications>,
    )

    await sendEmailWithTemplateUnbatched({
      templateAlias: "fatebook-new-activity",
      templateParams: {
        email_subject:
          notifications.length === 1
            ? notifications[0].title
            : "New activity on your predictions",
        questions: Object.values(notificationsByQuestionId).map(
          (notifications) => {
            const latestNotification = notifications[notifications.length - 1]
            return {
              url: latestNotification.url,
              header: latestNotification.question?.title || "Notifications",
              notifications: notifications.map((n) => ({
                title: n.title,
              })),
            }
          },
        ),
      },
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

export async function sendEmailWithTemplateUnbatched({
  templateAlias,
  templateParams,
  to,
  log = true,
}: {
  templateAlias: string
  templateParams: object
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
    response = await client.sendEmailWithTemplate({
      From: "reminders@fatebook.io",
      ReplyTo: "hello@sage-future.org",
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: {
        product_url: "https://fatebook.io",
        product_name: "Fatebook",
        ...templateParams,
      },
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
    log && console.log(`Sent email to ${to} with template: ${templateAlias}`)
    await backendAnalyticsEvent("email_sent", { platform: "web" })
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
    response = await client.sendEmailWithTemplate({
      From: "reminders@fatebook.io",
      ReplyTo: "hello@sage-future.org",
      To: to,
      TemplateAlias: "blank-transactional",
      TemplateModel: {
        product_url: "https://fatebook.io",
        product_name: "Fatebook",
        subject:
          subject.length >= 1999 ? `${subject.slice(0, 1995)}...` : subject,
        html_body: htmlBody,
        text_body: textBody,
      },
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
    log && console.log(`Sent email to ${to}`)
    await backendAnalyticsEvent("email_sent", { platform: "web" })
  }
}

export function fatebookEmailFooter() {
  return `\n
<p><i><a href="https://fatebook.io">Fatebook</a> helps you rapidly make and track predictions about the future.</i></p>
<p><a href=${webFeedbackUrl}>Give feedback on Fatebook</a></p>
`
}
