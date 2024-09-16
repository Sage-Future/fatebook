import { QuestionWithStandardIncludes } from "../../prisma/additional"
import { getDateTimeYYYYMMDDHHMMSS } from "../_utils_common"
import prisma from "../prisma"

export async function questionsToCsv(
  questions: QuestionWithStandardIncludes[],
  userId: string,
) {
  const forecasts = questions.flatMap((q) => q.forecasts)

  if (!forecasts || forecasts.length === 0) return ""

  const questionScores = await prisma.questionScore.findMany({
    where: {
      userId: userId,
    },
  })

  const csv = jsonToCsv(
    forecasts.map((f) => {
      const question = questions.find((q) => q.id === f.questionId)
      const questionScore = questionScores.find(
        (qs) => qs.questionId === f.questionId,
      )
      const mcqOption = question?.options?.find((o) => o.id === f.optionId)

      return {
        "Question title": question?.title,
        "Multiple choice option": mcqOption?.text,
        "Forecast created by": f.user?.name,
        "Forecast (scale = 0-1)": f.forecast,
        "Forecast created at": f.createdAt,
        "Question created by": question?.user?.name,
        "Question created at": question?.createdAt,
        "Question resolve by": question?.resolveBy,
        Resolution: mcqOption?.resolution || question?.resolution,
        "Resolved at": mcqOption?.resolvedAt || question?.resolvedAt,
        "Your Brier score for this question": questionScore?.absoluteScore,
        "Your relative Brier score for this question":
          questionScore?.relativeScore,
        "Question notes": question?.notes,
        "Question shared with": question?.sharedWith
          ?.map((u) => u?.name)
          .join("; "),
        "Question shared publicly": question?.sharedPublicly,
        "Question comments": question?.comments
          ?.map((c) => `${c.user?.name}: ${c.comment}`)
          .join("; "),
      }
    }),
  )

  return csv
}

function jsonToCsv(json: any) {
  if (!json) return ""

  const keys = Object.keys(json[0])
  const csv =
    keys.join(",") +
    "\n" +
    json
      .map((row: any) => keys.map((key) => printForCsv(row[key])).join(","))
      .join("\n")
  return csv
}

function printForCsv(val: any) {
  if (typeof val === "string") {
    return `"${val.replace(/"/g, '""')}"`
  } else if (val instanceof Date) {
    return `${getDateTimeYYYYMMDDHHMMSS(val)}`
  } else {
    return val
  }
}
