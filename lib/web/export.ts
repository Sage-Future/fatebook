import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments } from "../../prisma/additional"
import { getDateTimeYYYYMMDDHHMMSS } from "../_utils_common"
import prisma from "../_utils_server"

export async function questionsToCsv(questions: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments[], userId: string) {
  const forecasts = questions.flatMap(q => q.forecasts)

  const questionScores = await prisma.questionScore.findMany({
    where: {
      userId: userId
    },
  })

  const csv = jsonToCsv(forecasts.map(f => {
    const question = questions.find(q => q.id === f.questionId)
    const questionScore = questionScores.find(qs => qs.questionId === f.questionId)

    return ({
      "Question title": question?.title,
      "Forecast created by": f.user.name,
      "Forecast (scale = 0-1)": f.forecast,
      "Forecast created at": f.createdAt,
      "Question created by": question?.user?.name,
      "Question created at": question?.createdAt,
      "Question resolution": question?.resolution,
      "Question resolve by": question?.resolveBy,
      "Question resolved at": question?.resolvedAt,
      "Your Brier score for this question": questionScore?.absoluteScore,
      "Your relative Brier score for this question": questionScore?.relativeScore,
      "Question notes": question?.notes,
      "Question shared with": question?.sharedWith?.map(u => u.name).join("; "),
      "Question shared publicly": question?.sharedPublicly,
      "Question comments": question?.comments?.map(c => `${c.user.name}: ${c.comment}`).join("; "),
    })
  }))

  return csv
}

function jsonToCsv(json: any) {
  const keys = Object.keys(json[0])
  const csv = keys.join(",") + "\n"
    + json.map((row: any) => keys.map(
      key => printForCsv(row[key])
    ).join(",")).join("\n")
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