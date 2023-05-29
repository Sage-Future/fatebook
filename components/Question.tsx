import clsx from "clsx"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { getQuestionUrl } from "../pages/q/[id]"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages } from "../prisma/additional"
import { FormattedDate } from "./FormattedDate"
import { ResolveButton } from "./ResolveButton"
import { SharePopover } from "./SharePopover"
import { Username } from "./Username"

export function Question({
  question
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  const session = useSession()
  const userId = session.data?.user.id

  const latestForecast = question.forecasts.filter(f => f.userId === userId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )?.[0]

  return (
    <div className="grid grid-cols-1 gap-1 bg-white p-4 rounded-md" key={question.id}>
      <span className="col-span-2 flex gap-4 justify-between">
        <span className="font-semibold" key={`${question.id}title`}>
          <Link href={getQuestionUrl(question)} key={question.id} className="no-underline hover:underline">
            {question.title}
          </Link>
        </span>
        <span className="font-bold text-2xl mr-2 text-indigo-800">
          {latestForecast?.forecast ?
            ((latestForecast.forecast as unknown as number) * 100).toString() + "%"
            : ""
          }
        </span>
      </span>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <span className="text-sm my-auto" key={`${question.id}author`}>
          <Username user={question.user} />
        </span>
        <SharePopover question={question} />
        {
          question.resolvedAt ? (
            <span className="text-sm text-gray-400 my-auto" key={`${question.id}resolve`}>
              <span>Resolved</span> <FormattedDate date={question.resolvedAt} />
            </span>
          ) : (
            <span className={clsx(
              "text-sm text-gray-400 my-auto",
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