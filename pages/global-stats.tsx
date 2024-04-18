import { Resolution } from "@prisma/client"
import { bin } from "d3-array"
import { InferGetServerSidePropsType } from "next"
import { NextSeo } from "next-seo"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { FormattedDate } from "../components/ui/FormattedDate"
import { getDateYYYYMMDD, mean, round } from "../lib/_utils_common"
import prisma from "../lib/prisma"
import { getCsvIdPrefix, getPredictionBookIdPrefix } from "../lib/web/utils"

// fix for EMfile: too many open files error
import * as fs from "fs"
import gracefulFs from "graceful-fs"

export async function getStaticProps() {
  gracefulFs.gracefulify(fs)

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      userId: true,
      resolution: true,
      createdAt: true,
      resolvedAt: true,
      resolved: true,
      profileId: true,
      questionScores: {
        select: {
          relativeScore: true,
          absoluteScore: true,
          createdAt: true,
          userId: true,
          question: {
            select: {
              forecasts: {
                select: {
                  userId: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
      comments: {
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
      },
      forecasts: {
        select: {
          userId: true,
          createdAt: true,
          forecast: true,
        },
      },
    },
    where: {
      AND: [
        {
          id: {
            not: {
              startsWith: getPredictionBookIdPrefix(),
            },
          },
        },
        {
          id: {
            not: {
              startsWith: getCsvIdPrefix(),
            },
          },
        },
      ],
    },
  })

  function getActiveUsersByDay(qs: typeof questions) {
    let activeUserIdsByDay: Record<string, Set<string>> = {}

    function addActivity(userId: string, date: Date) {
      const dateString = getDateYYYYMMDD(date)
      if (!activeUserIdsByDay[dateString]) {
        activeUserIdsByDay[dateString] = new Set()
      }
      activeUserIdsByDay[dateString].add(userId)
    }

    qs.forEach((q) => {
      addActivity(q.userId, q.createdAt)
      q.resolvedAt && addActivity(q.userId, q.resolvedAt)
      q.forecasts.forEach((f) => {
        addActivity(f.userId, f.createdAt)
      })
      q.comments.forEach((c) => {
        addActivity(c.userId, c.createdAt)
      })
    })

    const dates = Object.keys(activeUserIdsByDay).sort()
    if (dates.length > 0) {
      const startDate = new Date(dates[0])
      const endDate = new Date()
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = getDateYYYYMMDD(d)
        if (!activeUserIdsByDay[dateString]) {
          activeUserIdsByDay[dateString] = new Set()
        }
      }
    }

    return activeUserIdsByDay
  }
  function activeUsersToData(
    activeUsers: Record<string, Set<string>>,
    nDays: number,
  ) {
    return Object.fromEntries(
      Object.entries(activeUsers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, users], index, arr) => {
          const superset = new Set(users)
          for (let i = Math.max(0, index - nDays + 1); i <= index; i++) {
            arr[i][1].forEach((user) => superset.add(user))
          }
          return [date, superset.size]
        }),
    )
  }
  function activeUsersToRetention(
    activeUsers: Record<string, Set<string>>,
    windowSize: number,
    prevWindowOffsetFromToday: number,
  ) {
    return Object.fromEntries(
      Object.entries(activeUsers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, users], index, arr) => {
          const activeUsersInWindow = new Set(users)
          for (let i = Math.max(0, index - windowSize + 1); i <= index; i++) {
            arr[i][1].forEach((user) => activeUsersInWindow.add(user))
          }

          const activeUsersInPrevWindow = new Set<string>()
          for (
            let i = Math.max(0, index - windowSize - prevWindowOffsetFromToday);
            i <= index - prevWindowOffsetFromToday;
            i++
          ) {
            arr[i][1].forEach((user) => activeUsersInPrevWindow.add(user))
          }

          // current users that were previously active too
          const retainedUsers = Array.from(activeUsersInWindow).filter((user) =>
            activeUsersInPrevWindow.has(user),
          )
          const retentionRate =
            retainedUsers.length / activeUsersInPrevWindow.size
          return [date, retentionRate]
        }),
    )
  }

  const forecasts = questions.flatMap((q) => q.forecasts)
  forecasts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const questionScores = questions.flatMap((q) => q.questionScores)

  // sort questionScores by that userId's average forecast time on that question
  questionScores.sort((a, b) => {
    const aAvgTime = mean(
      a.question.forecasts
        .filter((f) => f.userId === a.userId)
        .map((f) => f.createdAt.getTime()),
    )
    const bAvgTime = mean(
      b.question.forecasts
        .filter((f) => f.userId === b.userId)
        .map((f) => f.createdAt.getTime()),
    )
    return aAvgTime - bAvgTime
  })

  const questionScoresByUser = Object.values(
    questionScores.reduce(
      (acc, score) => {
        if (!acc[score.userId]) {
          acc[score.userId] = []
        }
        acc[score.userId].push(score)
        return acc
      },
      {} as { [userId: string]: (typeof questionScores)[0][] },
    ),
  )

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  })

  const workspaces = await prisma.workspace.findMany({
    select: {
      createdAt: true,
    },
  })

  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      createdAt: true,
    },
  })
  const teams = await prisma.userList.findMany({
    select: {
      id: true,
      createdAt: true,
    },
  })

  const accuracyN = 20

  const stats: Stats[] = [
    {
      header: "Global usage",
      datapoints: {
        Users: users.length,
        Questions: questions.length,
        Forecasts: forecasts.length,
        "Slack workspaces": workspaces.length,
        Tournaments: tournaments.length,
        Teams: teams.length,
      },
      chartData: [
        graphCreatedAt("New users", users),
        {
          type: "line over time",
          title: "Daily active users",
          data: activeUsersToData(getActiveUsersByDay(questions), 1),
        },
        {
          type: "line over time",
          title: "Weekly active users",
          data: activeUsersToData(getActiveUsersByDay(questions), 7),
          hideRollingAvg: true,
        },
        {
          type: "line over time",
          title: "Monthly active users",
          data: activeUsersToData(getActiveUsersByDay(questions), 31),
          hideRollingAvg: true,
        },
        {
          type: "line over time",
          title: "DAUs on questions created in Slack",
          data: activeUsersToData(
            getActiveUsersByDay(questions.filter((q) => !!q.profileId)),
            1,
          ),
        },
        {
          type: "line over time",
          title: "MAUs on questions created in Slack",
          data: activeUsersToData(
            getActiveUsersByDay(questions.filter((q) => !!q.profileId)),
            31,
          ),
          hideRollingAvg: true,
        },
        {
          type: "line over time",
          title:
            "1 day retention: What proportion of each day's active users are active the following day?",
          data: activeUsersToRetention(getActiveUsersByDay(questions), 1, 1),
        },
        {
          type: "line over time",
          title:
            "7 day retention: What proportion of each week's active users are active in the following week?",
          data: activeUsersToRetention(getActiveUsersByDay(questions), 7, 7),
          hideRollingAvg: true,
        },
        {
          type: "line over time",
          title:
            "30 day retention: What proportion of each month's active users are active in the following month?",
          data: activeUsersToRetention(getActiveUsersByDay(questions), 30, 30),
          hideRollingAvg: true,
        },
        graphCreatedAt("Questions created", questions),
        graphCreatedAt("Forecasts", forecasts),
        graphCreatedAt(
          "Comments",
          questions.flatMap((q) => q.comments),
        ),
        graphCreatedAt("New Slack workspaces", workspaces),
        graphCreatedAt("New tournaments", tournaments),
        graphCreatedAt("New teams", teams),
        {
          type: "histogram",
          title: "Questions created per user",
          data: Object.values(
            questions.reduce(
              (acc, q) => {
                if (acc[q.userId]) {
                  acc[q.userId]++
                } else {
                  acc[q.userId] = 1
                }
                return acc
              },
              users.reduce(
                (acc, user) => ({ ...acc, [user.id]: 0 }),
                {},
              ) as Record<string, number>,
            ),
          ),
          thresholds: [
            0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
            85, 90, 95, 100,
          ],
        },
        {
          type: "histogram",
          title: "Forecasts per user",
          data: Object.values(
            forecasts.reduce(
              (acc, q) => {
                if (acc[q.userId]) {
                  acc[q.userId]++
                } else {
                  acc[q.userId] = 1
                }
                return acc
              },
              users.reduce(
                (acc, user) => ({ ...acc, [user.id]: 0 }),
                {},
              ) as Record<string, number>,
            ),
          ),
          thresholds: [
            0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
            85, 90, 95, 100,
          ],
        },
        {
          type: "histogram",
          title: "Unique forecasters per question",
          data: Object.values(
            questions.reduce(
              (acc, question) => {
                const uniqueForecasters = new Set(
                  question.forecasts.map((forecast) => forecast.userId),
                )
                acc[question.id] = uniqueForecasters.size
                return acc
              },
              {} as Record<string, number>,
            ),
          ),
          thresholds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
        {
          type: "histogram",
          title: "Forecasts per question",
          data: questions.map((question) => question.forecasts.length),
          thresholds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 50, 100],
        },
      ],
    },
    {
      header: "Accuracy",
      datapoints: {
        "Questions resolved as YES": questions.filter(
          (q) => q.resolution === Resolution.YES,
        ).length,
        "Questions resolved as NO": questions.filter(
          (q) => q.resolution === Resolution.NO,
        ).length,
        "Questions resolved as AMBIGUOUS": questions.filter(
          (q) => q.resolution === Resolution.AMBIGUOUS,
        ).length,
        [`Avg Brier for first ${accuracyN} resolved questions forecasted (where resolved questions >${
          accuracyN * 2
        })`]: round(
          mean(
            questionScoresByUser
              .filter((userScores) => userScores.length > accuracyN * 2)
              .map((userScores) =>
                mean(
                  userScores
                    .slice(0, accuracyN) // first N
                    .map((score) => score.absoluteScore.toNumber()),
                ),
              ),
          ),
          2,
        ),
        [`Avg Brier for last ${accuracyN} resolved questions forecasted (where resolved questions >${
          accuracyN * 2
        })`]: round(
          mean(
            questionScoresByUser
              .filter((userScores) => userScores.length > accuracyN * 2)
              .map((userScores) =>
                mean(
                  userScores
                    .slice(-accuracyN) // last N
                    .map((score) => score.absoluteScore.toNumber()),
                ),
              ),
          ),
          2,
        ),
        [`Users with >${accuracyN * 2} resolved questions`]:
          questionScoresByUser.filter(
            (userScores) => userScores.length > accuracyN * 2,
          ).length,
      },
      chartData: [
        {
          type: "data over index",
          title: "Avg score for nth resolved question",
          lines: [
            {
              label: "Brier score",
              data: Array.from(
                { length: 100 },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                (_, i) => i,
              ).map((index) => {
                const scores = questionScoresByUser
                  .filter(
                    (userScores) =>
                      userScores[index]?.absoluteScore !== undefined,
                  )
                  .map((userScores) =>
                    userScores[index].absoluteScore.toNumber(),
                  )
                return {
                  index: index,
                  value: round(mean(scores), 2),
                  rollingAvg: 0,
                }
              }),
              hideRollingAvg: true,
            },
            {
              label: "Relative Brier score",
              data: Array.from(
                { length: 100 },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                (_, i) => i,
              ).map((index) => {
                const scores = questionScoresByUser
                  .filter(
                    (userScores) =>
                      userScores[index]?.relativeScore?.toNumber() !==
                      undefined,
                  )
                  .map((userScores) =>
                    userScores[index].relativeScore!.toNumber(),
                  )
                return {
                  index: index,
                  value: round(mean(scores), 2),
                  rollingAvg: 0,
                }
              }),
              hideRollingAvg: true,
            },
          ],
        },
      ],
    },
  ]
  return {
    props: {
      stats,
      lastUpdated: new Date().toISOString(),
    },
    revalidate: 3600,
  }
}

interface Stats {
  header: string
  datapoints: Record<string, number>
  chartData: (
    | {
        type: "line over time"
        title: string
        data: Record<string, number>
        hideRollingAvg?: boolean
      }
    | {
        type: "data over index"
        title: string
        lines: {
          label: string
          data: { index: number; value: number; rollingAvg: number }[]
          hideRollingAvg?: boolean
        }[]
      }
    | {
        type: "histogram"
        title: string
        data: number[]
        thresholds: number[]
      }
  )[]
}

export default function GlobalStatsPage({
  stats,
  lastUpdated,
}: InferGetServerSidePropsType<typeof getStaticProps>) {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title="Stats"
        description="Global usage and accuracy trends for Fatebook"
      />
      <div className="mx-auto">
        {stats.map((stat, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{stat.header}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stat.datapoints).map(([key, value]) => {
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center bg-neutral-100 p-4 rounded-lg"
                  >
                    <span className="text-neutral-600">{key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                )
              })}
              {stat.chartData &&
                stat.chartData.map((chart) => {
                  if (chart.type === "line over time") {
                    return (
                      <div
                        key={chart.title}
                        className="flex flex-col bg-neutral-100 p-4 rounded-lg"
                      >
                        <h3 className="text-lg font-medium mb-4">
                          {chart.title}
                        </h3>
                        {chart.data && Object.keys(chart.data).length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getDateData(chart.data)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                dot={false}
                              />
                              {!chart.hideRollingAvg && (
                                <Line
                                  type="monotone"
                                  dataKey="Rolling average"
                                  stroke="#006400" // Dark green
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center p-4">
                            No data available
                          </div>
                        )}
                      </div>
                    )
                  } else if (chart.type === "data over index") {
                    return (
                      <div
                        key={chart.title}
                        className="flex flex-col bg-neutral-100 p-4 rounded-lg"
                      >
                        <h3 className="text-lg font-medium mb-4">
                          {chart.title}
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={chart.lines.reduce(
                              (acc, line) => {
                                line.data.forEach((point) => {
                                  if (!acc[point.index]) {
                                    acc[point.index] = {
                                      index: point.index,
                                    }
                                  }
                                  acc[point.index][line.label] = point.value
                                  acc[point.index][
                                    `${line.label} Rolling Avg`
                                  ] = point.rollingAvg
                                })
                                return acc
                              },
                              [] as { index: number; [key: string]: number }[],
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {chart.lines.flatMap((line, index) => [
                              <Line
                                key={line.label}
                                type="linear"
                                dataKey={line.label}
                                stroke={`hsl(${(index * 36) % 360}, 90%, 60%)`}
                                dot={false}
                              />,
                              ...(!line.hideRollingAvg
                                ? [
                                    <Line
                                      key={`${line.label} Rolling Avg`}
                                      type="linear"
                                      dataKey={`${line.label} Rolling Avg`}
                                      stroke={`hsl(${
                                        (index * 36 + 180) % 360
                                      }, 90%, 40%)`}
                                      dot={false}
                                    />,
                                  ]
                                : []),
                            ])}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  } else if (chart.type === "histogram") {
                    return (
                      <div
                        key={chart.title}
                        className="flex flex-col bg-neutral-100 p-4 rounded-lg"
                      >
                        <h3 className="text-lg font-medium mb-4">
                          {chart.title}
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={bin()
                              .thresholds(chart.thresholds)(chart.data)
                              .map((bin) => ({
                                name:
                                  bin.x0 !== undefined && bin.x0 + 1 === bin.x1
                                    ? bin.x0
                                    : bin.x0 +
                                      "-" +
                                      (bin.x1 !== undefined
                                        ? bin.x1 - 1
                                        : bin.x1),
                                value: bin.length,
                              }))}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  } else {
                    return <>Unknown chart type</>
                  }
                })}
            </div>
          </div>
        ))}
        <div className="mt-8 prose">
          <h2>Notes</h2>
          <ul className="prose-sm">
            <li>
              Activity on questions imported from{" "}
              <Link href="/import-from-prediction-book">PredictionBook</Link> or{" "}
              <Link href="/import-from-spreadsheet">spreadsheets</Link> is not
              included
            </li>
            <li>
              Active users are those who created or resolved a question, made a
              forecast, or made a comment
            </li>
            <li>
              Tournaments includes special{" "}
              <Link href="predict-your-year">Predict your Year</Link>{" "}
              tournaments
            </li>
            <li>
              Data last updated:{" "}
              <FormattedDate
                className="font-semibold"
                date={new Date(lastUpdated)}
              />
            </li>
            <li>Rolling averages are calculated over the previous 7 days</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// adds zeroes for dates with no data and calculates 7 day rolling average
function getDateData(data: Record<string, number>) {
  const dates = Object.keys(data)
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime())
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const dateArray: {
    date: string
    value: number
    "Rolling average": number
  }[] = []

  let rolling = []

  for (
    let dt = new Date(startDate);
    dt <= endDate;
    dt.setDate(dt.getDate() + 1)
  ) {
    const formattedDate = dt.toISOString().split("T")[0]
    const value = data[formattedDate] ?? 0

    rolling.unshift(value) // add to start
    if (rolling.length > 7) rolling.pop()
    const rollingAverage =
      rolling.length == 7
        ? rolling.reduce((a, b) => a + b, 0) / rolling.length
        : null

    dateArray.push({
      date: getDateYYYYMMDD(new Date(dt)),
      value,
      "Rolling average": round(rollingAverage ?? 0, 2),
    })
  }

  return dateArray
}

function graphCreatedAt(title: string, entities: { createdAt: Date }[]) {
  return {
    type: "line over time" as "line over time",
    title,
    data: entities.reduce((acc: Record<string, number>, curr) => {
      const date = curr.createdAt.toISOString().split("T")[0]
      if (acc[date]) {
        acc[date]++
      } else {
        acc[date] = 1
      }
      return acc
    }, {}),
  }
}
