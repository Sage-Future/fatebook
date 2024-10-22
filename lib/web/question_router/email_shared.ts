import { QuestionWithUserAndSharedWith } from "../../../prisma/additional"
import prisma from "../../prisma"
import {
  createNotification,
  fatebookEmailFooter,
  sendEmailUnbatched,
} from "../notifications"
import { getQuestionUrl } from "../question_url"
import { getHtmlLinkQuestionTitle } from "../utils"

export async function emailNewlySharedWithUsers(
  newlySharedWith: string[],
  question: QuestionWithUserAndSharedWith,
) {
  await Promise.all(
    newlySharedWith.map(async (email) => {
      const author = question.user.name || question.user.email
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        await createNotification({
          userId: user.id,
          title: `${author} shared a prediction with you`,
          content: `${author} shared a prediction with you`,
          url: getQuestionUrl(question),
          tags: ["shared_prediction", question.id],
          questionId: question.id,
        })
      } else {
        await sendEmailUnbatched({
          to: email,
          subject: `${author} shared a prediction with you`,
          textBody: `"${question.title}"`,
          htmlBody: `<p>${author} shared a prediction with you: <b>${getHtmlLinkQuestionTitle(
            question,
          )}</p>
<p><a href=${getQuestionUrl(
            question,
          )}>See ${author}'s prediction and add your own on Fatebook.</a></p>
${fatebookEmailFooter()}`,
        })
      }
    }),
  )
}
