import clsx from "clsx"
import Link from "next/link"
import { getQuestionUrl } from "../pages/q/[id]"
import { QuestionWithUserAndForecastsWithUser } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { ResolveButton } from "./ResolveButton"
import { Username } from "./Username"

export function Question({
  question
} : {
  question: QuestionWithUserAndForecastsWithUser
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-1" key={question.id}>
      <span className="col-span-2 xl:col-span-1 font-semibold" key={`${question.id}title`}>
        <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
          {question.title}
        </Link>
      </span>
      <div className="grid grid-cols-3">
        <span className="text-sm" key={`${question.id}author`}>
          <Username user={question.user} />
        </span>
        {
          question.resolvedAt ? (
            <span className="text-sm text-gray-400" key={`${question.id}resolve`}>
              <span>Resolved</span> <FormattedDate date={question.resolvedAt} />
            </span>
          ) : (
            <span className={clsx(
              "text-sm text-gray-400",
              question.resolveBy < new Date() && "text-indigo-300"
            )} key={`${question.id}resolve`}>
              <span>Resolves</span> <FormattedDate date={question.resolveBy} />
            </span>
          )
        }
        <ResolveButton question={question} />
      </div>
    </div>
  )
}