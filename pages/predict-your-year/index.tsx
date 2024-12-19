import {
  ArrowRightIcon,
  ChatBubbleOvalLeftIcon,
  RocketLaunchIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/solid"
import clsx from "clsx"
import { useSession } from "next-auth/react"
import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { Tournaments } from "../../components/Tournaments"
import { generateRandomId } from "../../lib/_utils_common"
import { api } from "../../lib/web/trpc"
import { signInToFatebook } from "../../lib/web/utils"

export default function PredictYourYearLandingPage() {
  const router = useRouter()

  const createTournament = api.tournament.create.useMutation()

  const upcomingYear = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 60,
  ).getFullYear() // 60 days from now
  const user = useSession()?.data?.user

  const tournamentsQ = api.tournament.getAll.useQuery()

  const handleGetStarted = async ({ teamMode }: { teamMode: boolean }) => {
    if (!user) {
      return void signInToFatebook()
    }
    const tournamentId = generateRandomId()
    const baseName = teamMode
      ? `Your team's predictions for ${upcomingYear}`
      : `${user?.name}'s predictions for ${upcomingYear}`

    let name = baseName
    let counter = 2
    while (tournamentsQ.data?.some((tournament) => tournament.name === name)) {
      name = `${baseName} (${counter})`
      counter++
    }

    await createTournament.mutateAsync({
      id: tournamentId,
      name,
      predictYourYear: upcomingYear,
    })
    void router.push(
      `/predict-your-year/${tournamentId}${teamMode ? "?team=1" : ""}`,
    )
  }

  const actionButton =
    "flex flex-col items-start sm:flex-row sm:items-center text-left justify-between px-4 py-3 rounded-lg border-none shadow-md transition-all hover:shadow-lg hover:scale-[1.02] no-underline btn"

  const primaryStyles =
    "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/50 hover:glow-indigo-500/50"

  const previousYearsNonEmptyTournaments = tournamentsQ.data?.filter(
    (tournament) =>
      tournament.predictYourYear !== upcomingYear &&
      tournament.predictYourYear &&
      tournament.questions.length > 0,
  )

  const hasExistingPredictions =
    (tournamentsQ.data?.filter(
      (tournament) => tournament.predictYourYear === upcomingYear,
    ).length || 0) > 0

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto prose">
      <NextSeo
        title={`Predict your ${upcomingYear}`}
        description="What will the new year hold for you? Write down your predictions and review at the end of the year."
        canonical="https://fatebook.io/predict-your-year"
        openGraph={{
          url: "https://fatebook.io/predict-your-year",
          title: `Predict your ${upcomingYear}`,
          description:
            "What will the new year hold for you? Write down your predictions and review at the end of the year.",
          images: [
            {
              url: "https://fatebook.io/telescope_future_1200_white.png",
              width: 1200,
              height: 686,
              alt: "",
            },
          ],
          siteName: "Fatebook",
        }}
      />
      <h2 className="text-4xl font-bold mb-4">Predict your year</h2>
      <p className="text-lg mb-0">
        What will the new year hold for you? Write down your predictions and
        review at the end of the year.
      </p>

      {(tournamentsQ.data?.filter(
        (tournament) => tournament.predictYourYear === upcomingYear,
      ).length || 0) > 0 && (
        <div className="flex gap-2 flex-col mt-8">
          {tournamentsQ.data
            ?.filter(
              (tournament) => tournament.predictYourYear === upcomingYear,
            )
            .map((tournament) => (
              <Link
                key={tournament.id}
                href={`/predict-your-year/${tournament.id}`}
                className={clsx(actionButton, primaryStyles)}
              >
                <span className="text-lg font-medium">{tournament.name}</span>
                <div className="flex items-center gap-2 text-purple-50">
                  <span className="text-sm">Predict</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </Link>
            ))}
        </div>
      )}
      <div
        className={clsx(
          "rounded-xl p-6 mb-8 mt-4 group",
          hasExistingPredictions
            ? "bg-base-200"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl",
        )}
      >
        <h2
          className={clsx(
            "font-bold mb-4 mt-0 text-center select-none",
            hasExistingPredictions ? "text-base" : "text-2xl text-white",
          )}
        >
          {hasExistingPredictions
            ? `Or make another page of ${upcomingYear} predictions`
            : `Predict your ${upcomingYear}`}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[false, true].map((isTeam) => (
            <button
              key={isTeam ? "team" : "personal"}
              className={clsx(
                "btn transition-all hover:scale-[1.02] group-hover:scale-[1.008]",
                hasExistingPredictions
                  ? "bg-neutral-100 hover:bg-neutral-300"
                  : "bg-white/10 hover:bg-white/20 text-white",
              )}
              disabled={createTournament.isLoading}
              onClick={() => {
                void handleGetStarted({ teamMode: isTeam })
              }}
            >
              {isTeam ? (
                <UsersIcon className="h-5 w-5" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              <span>{isTeam ? "Team" : "Personal"} predictions</span>
            </button>
          ))}
        </div>
      </div>

      {(previousYearsNonEmptyTournaments?.length || 0) > 0 && (
        <>
          <h2 className="text-base font-bold mb-4">
            Review your previous predictions
          </h2>
          <div className="flex gap-2 flex-col mt-4">
            {previousYearsNonEmptyTournaments
              ?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by most recent first
              .map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/predict-your-year/${tournament.id}`}
                  className={clsx(actionButton)}
                >
                  <span className="text-md font-medium">{tournament.name}</span>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <span className="text-sm">Reflect</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </Link>
              ))}
          </div>
        </>
      )}

      <div className="my-6">
        <h2 className="text-2xl font-bold mb-4">{"Why predict your year?"}</h2>
        <ul className="list-none space-y-4 pl-0">
          <li className="flex items-center space-x-3">
            <RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span>
              <span className="font-semibold">{"Plan your future"}</span>
              <br />
              Get a clearer view of the upcoming year by thinking about your
              goals and expectations.
            </span>
          </li>
          <li className="flex items-center space-x-3">
            <ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span>
              <span className="font-semibold">
                {"Make your predictions concrete"}
              </span>
              <br />
              {
                "Write down your forecast as a probability. 'Probably' is ambiguous, '80%' isn't."
              }
            </span>
          </li>
          <li className="flex items-center space-x-3">
            <TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span>
              <span className="font-semibold">
                {"Reflect at the end of the year"}
              </span>
              <br />
              Resolve your predictions as YES, NO or AMBIGUOUS. Reconnect with
              yourself from a year ago, and discover {"what's"} changed.
            </span>
          </li>
        </ul>
      </div>
      {/* Show public predictions for upcoming year and each year back to 2024, when PYY began */}
      {Array.from(
        { length: upcomingYear - 2023 },
        (_, i) => upcomingYear - i,
      ).map((year) => (
        <div key={year}>
          <Tournaments
            title={`Public predictions for ${year}`}
            predictYourYear={year}
            includePublic={true}
            showCreateButton={false}
          />
        </div>
      ))}

      <Image
        src="/telescope_future_1200_white.png"
        width={1200}
        height={686}
        alt=""
      />
    </div>
  )
}
