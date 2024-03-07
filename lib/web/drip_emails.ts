import { User } from "@prisma/client"
import { getUnsubscribeUrl } from "../../pages/unsubscribe"
import { sendEmailUnbatched } from "./notifications"

export async function sendWelcomeEmail(user: User) {
  await sendEmailUnbatched({
    subject: "Welcome to Fatebook",
    htmlBody: `
    <p>Hi${" " + user.name || ""},</p>
    <p>Welcome to <a href="https://fatebook.io">Fatebook</a>: the fastest way to make and track predictions!</p>
    <p>Here are some things you could try using Fatebook for:</p>
    <ul>
      <li>Predict whether you'll complete your weekly goals in your weekly review. If the probability is low, consider ways to raise it!</li>
      <li>When your team starts a new project, forecast key assumptions and outcomes.</li>
      <li>Consider: what's the most important decision in your life right now, and how can breaking it down into concrete predictions help you make a good call?</li>
    </ul>
    <p>You can use Fatebook on <a href="https://fatebook.io">fatebook.io</a>, in <a href="https://fatebook.io/for-slack">Slack</a>, inside Google Docs, or anywhere on the web with the <a href="https://fatebook.io/extension">browser extension</a>, or via the <a href="https://fatebook.io/api">API</a>.</p>
    <p>You might also be interested in our forecasting training tools, <a href="https://quantifiedintuitions.org">Quantified Intuitions</a>.</p>
    <p>I want to make Fatebook as useful as possible, so I'd love to hear from you! What brought you here, and what would you like to get out of Fatebook?</p>
    <p>Thanks,<br/>Adam</p>
    <br/>
    <p><small><i>(Note - this email is automated, but if you reply, it will go straight to my inbox! You can unsubscribe from all emails from Fatebook <a href="${getUnsubscribeUrl(
      user.email,
      false,
    )}">here</a>.)</i></small></p>
  `,
    textBody: `Hi ${user.name},

Welcome to Fatebook: the fastest way to make and track predictions.

Here are some things people use Fatebook for:
- Predict which of your weekly goals you'll complete in your weekly review. If the probability is low, consider ways to raise it!
- When your team starts a new project, make forecasts on key assumptions and outcomes.
- Consider: what's the most important decision in your life right now, and how can breaking it down into concrete predictions help you make a good call?

You can use Fatebook on fatebook.io, in Slack, anywhere on the web with the browser extension, or via the API.

You might also be interested in our forecasting training tools, Quantified Intuitions.

I want to make Fatebook as useful as possible, so I'd love to hear from you. What brought you here, and what would you like to get out of Fatebook?

Thanks,
Adam

(Note - this email is automated, but if you reply, it will go straight to my inbox. You can unsubscribe from all emails from Fatebook here.)`,
    to: user.email,
  })
}
