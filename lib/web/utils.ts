import { Question, Tournament, User, UserList } from "@prisma/client"
import { toZonedTime } from "date-fns-tz"
import isWebview from "is-ua-webview"
import { signIn, useSession } from "next-auth/react"
import { Fragment, ReactNode, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { QuestionWithForecasts } from "../../prisma/additional"
import { getQuestionUrl } from "./question_url"
import { getClientBaseUrl } from "./trpc"

export function useUserId() {
  const session = useSession()
  return session.data?.user.id
}

export async function signInToFatebook() {
  if (isWebview(window.navigator.userAgent)) {
    toast(
      "Open Fatebook in Safari or Chrome to sign in.\n\nGoogle does not support this browser.",
      {
        duration: 10000,
      },
    )
    return
  }
  await signIn("google", { redirect: true })
}

export function getChartJsParams(
  buckets: number[],
  bucketedForecasts: { bucket: number; mean: number; count: number }[],
  interactive = false,
  hideTitles = false,
  isThisUser = true,
) {
  const pronoun = isThisUser ? "Your" : "Their"
  return {
    type: "line",
    data: {
      labels: buckets.map((b) => (b * 100).toFixed(0) + "%"),
      datasets: [
        {
          backgroundColor: "#4e46e59c",
          borderColor: "#4e46e59c",
          data: bucketedForecasts.map((f) => f.mean * 100),
          label: `${pronoun} calibration`,
          borderWidth: 1,
          fill: false,
          showLine: false,
        },
        {
          backgroundColor: "#22c55e",
          borderColor: "#22c55e",
          data: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          label: "Perfect calibration",
          fill: false,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: true,
      spanGaps: false,
      elements: {
        line: {
          tension: 0.000001,
        },
      },
      plugins: interactive
        ? {
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.dataset.label || ""
                  if (label) {
                    const resolvedForecasts =
                      bucketedForecasts?.[context?.dataIndex]?.count

                    return `${label}: ${context.parsed.y.toFixed(0)}%${
                      resolvedForecasts !== undefined &&
                      ` (on ${resolvedForecasts} forecast${
                        resolvedForecasts > 1 ? "s" : ""
                      })`
                    }`
                  }
                  return ""
                },
              },
            },
            legend: {
              maxWidth: 100,
              labels: {
                usePointStyle: true,
              },
              onClick: () => {}, // overwrite default behaviour of hiding points
            },
          }
        : {
            legend: {
              labels: {
                usePointStyle: true,
              },
            },
          },
      scales: interactive
        ? {
            y: {
              title: {
                display: true,
                text: "% of questions that resolved Yes",
                color: hideTitles ? "transparent" : "gray",
              },
              ticks: {
                // Include a dollar sign in the ticks
                callback: (value: any) => value + "%",
              },
            },
            x: {
              title: {
                display: true,
                text: `${pronoun} forecast (bucketed by nearest 10%)`,
                color: hideTitles ? "transparent" : "gray",
              },
            },
          }
        : {
            xAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: `${pronoun} forecast (bucketed by nearest 10%)`,
                },
                gridLines: {
                  color: "#1e1e1e",
                },
              },
            ],
            yAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: "% of questions that resolved Yes",
                },
                gridLines: {
                  color: "#1e1e1e",
                },
              },
            ],
          },
    },
  }
}

export function getHtmlLinkQuestionTitle(question: Question) {
  return `<a href="${getQuestionUrl(question, false)}">${question.title}</a>`
}

export function getMarkdownLinkQuestionTitle(question: Question) {
  return `[${question.title}](${getQuestionUrl(question, false)})`
}

export function getPredictionBookIdPrefix() {
  return "pb_"
}

export function getCsvIdPrefix() {
  return "cs_"
}

export function ifEmpty<T>(value: Array<T>, defaultValue: ReactNode) {
  return !value || value?.length === 0 ? defaultValue : value
}

export async function invalidateQuestion(
  utils: any,
  question: Question | { id: string },
) {
  await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate(
    {},
    {
      refetchPage: (page: any) =>
        page.items.some((item: any) => item.id === question.id),
    },
  )
  await utils.question.getQuestion.invalidate({ questionId: question.id })
}

export function truncateString(
  str: string | undefined,
  length: number,
  includeEllipsis = true,
) {
  if (!str) return ""

  if (str.length <= length) return str

  // split on words
  const words = str.split(" ")

  if (words.length === 1)
    return str.substring(0, length) + (includeEllipsis ? "..." : "")

  let truncated = ""
  for (const word of words) {
    if (truncated.length + word.length > length) break
    truncated += word + " "
  }
  return truncated.trim() + (includeEllipsis ? "..." : "")
}

export const webFeedbackUrl = "https://forms.gle/mfyCqLG4pLoEqYfy9"

export function downloadBlob(
  content: any,
  filename: string,
  contentType: string,
) {
  // Create a blob
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)

  // Create a link to download it
  var pom = document.createElement("a")
  pom.href = url
  pom.setAttribute("download", filename)
  pom.click()
}

export function transitionProps() {
  return {
    as: Fragment,
    className: "z-10",
    enter: "transition ease-out duration-100",
    enterFrom: "transform opacity-0 scale-98 translate-y-[-0.5rem]",
    enterTo: "transform opacity-100 scale-100 translate-y-0",
    leave: "transition ease-in duration-75",
    leaveFrom: "transform opacity-100 scale-100 translate-y-0 ",
    leaveTo: "transform opacity-0 scale-98 translate-y-[-0.5rem]",
  }
}

export function hashString(str: string) {
  var hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    // Convert to 32bit integer
    hash |= 0
  }
  return hash
}

export function utcDateStrToLocalDate(utcDateStr: string) {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localDate = toZonedTime(utcDateStr, localTimezone)

  return localDate
}

export function matchesAnEmailDomain(user: User | null) {
  return {
    emailDomains: {
      hasSome: user?.email.split("@").slice(-1) || ["NO MATCH"],
    },
  }
}

export function getSlug(string: string | undefined) {
  return string
    ? encodeURIComponent(
        truncateString(string, 40, false)
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase(),
      )
    : ""
}

export function getTournamentUrl(
  tournament: Tournament,
  useRelativePath: boolean,
) {
  const fullSlug = `${getSlug(tournament.name)}--${tournament.id}`
  if (tournament.predictYourYear) {
    return `${getClientBaseUrl(useRelativePath)}/predict-your-year/${fullSlug}`
  } else {
    return `${getClientBaseUrl(useRelativePath)}/tournament/${fullSlug}`
  }
}

export function getUserListUrl(list: UserList, useRelativePath: boolean) {
  const fullSlug = `${getSlug(list.name)}--${list.id}`
  return `${getClientBaseUrl(useRelativePath)}/team/${fullSlug}`
}

export function createPostgresSearchString(query: string) {
  // Split the query into words
  const words = query
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())

  // Join the words with the & operator and return
  return words.join(" & ")
}

export function getSearchedPredictionBounds(searchString: string | undefined) {
  const searchForPredictionPercent = searchString?.match(
    /^(\d+(?:\.\d+)?)%?\s?-?\s?(\d+(?:\.\d+)?)?%$/, // e.g. "20% - 80%" or "30.5%"
  )
  if (searchForPredictionPercent) {
    const lowerBound = parseFloat(searchForPredictionPercent[1])
    const upperBound = searchForPredictionPercent[2]
      ? parseFloat(searchForPredictionPercent[2])
      : lowerBound
    return {
      lowerBound,
      upperBound,
    }
  }
}

export function searchMatches(
  question: QuestionWithForecasts,
  userId: string | undefined,
  searchString: string,
) {
  const bounds = getSearchedPredictionBounds(searchString)
  if (bounds) {
    return question.forecasts
      .filter((f) => f.userId === userId)
      .some((f) => {
        const userForecastPercent = f.forecast.toNumber() * 100
        return (
          userForecastPercent >= bounds.lowerBound &&
          userForecastPercent <= bounds.upperBound
        )
      })
  }

  const words = searchString
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
  return words.every((word) =>
    question.title.toLowerCase().includes(word.toLowerCase()),
  )
}

export function useBrowser() {
  const [browser, setBrowser] = useState<
    "Chrome" | "Arc" | "Firefox" | "Brave" | "Edge"
  >("Chrome")

  useEffect(() => {
    setTimeout(() => {
      if (
        getComputedStyle(document.documentElement).getPropertyValue(
          "--arc-palette-background",
        )
      ) {
        setBrowser("Arc")
      }
    }, 300)
    if (navigator.userAgent.includes("Firefox")) {
      setBrowser("Firefox")
    } else if (navigator.userAgent.includes("Edg/")) {
      setBrowser("Edge")
    }
    if ((navigator as any).brave && (navigator as any).brave.isBrave()) {
      setBrowser("Brave")
    }
  }, [setBrowser])

  return browser
}

export function useFatebookForChrome() {
  const browser = useBrowser()
  return `Fatebook for ${browser}`
}
