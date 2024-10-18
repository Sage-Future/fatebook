import { QuestionWithForecasts } from "../../../prisma/additional"
import { forecastsAreHidden } from "../../_utils_common"

export function scrubHiddenForecastsAndSensitiveDetailsFromQuestion<
  QuestionX extends QuestionWithForecasts,
>(question: QuestionX, userId: string | undefined) {
  question = scrubApiKeyPropertyRecursive(question, ["email", "discordUserId"])

  if (!forecastsAreHidden(question, userId)) {
    return question
  }

  return {
    ...question,
    forecasts: question.forecasts.map((f) => {
      const hideForecast = f.userId !== userId || !userId
      return {
        ...f,
        ...(hideForecast
          ? {
              forecast: null,
              userId: null,
              user: null,
              profileId: null,
              profile: null,
              options: null,
            }
          : {}),
      }
    }),
  }
}

export function scrubApiKeyPropertyRecursive<T>(
  obj: T,
  otherKeysToScrub?: string[],
) {
  // warning - this mutates the object
  for (const key in obj) {
    if (key === "apiKey" || otherKeysToScrub?.includes(key)) {
      ;(obj as any)[key] = undefined
    } else if (typeof obj[key] === "object") {
      obj[key] = scrubApiKeyPropertyRecursive(obj[key], otherKeysToScrub)
    }
  }
  return obj
}
