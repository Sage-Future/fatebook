import { ChatBubbleOvalLeftIcon, RocketLaunchIcon, TrophyIcon, UserIcon, UsersIcon } from '@heroicons/react/24/solid'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { generateRandomId } from '../../lib/_utils_common'
import { api } from '../../lib/web/trpc'

export default function PredictYourYearLandingPage() {
  const router = useRouter()

  const createTournament = api.tournament.create.useMutation()

  const year = 2024
  const user = useSession()?.data?.user

  const handleGetStarted = async ({teamMode}: {teamMode: boolean}) => {
    const tournamentId = generateRandomId()
    await createTournament.mutateAsync({
      id: tournamentId,
      name: teamMode ? 'Your team\'s predictions for 2024' : `${user?.name}'s predictions for 2024`,
      predictYourYear: year,
    })
    void router.push(`/predict-your-year/${tournamentId}${teamMode ? '?team=1' : ''}`)
  }

  const tournamentsQ = api.tournament.getAll.useQuery()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto prose">
      <NextSeo
        title={`Predict your ${year}`}
        description="What will the new year hold for you? Write down your predictions and review at the end of the year."
        canonical='https://fatebook.io/predict-your-year'
        openGraph={{
          url: 'https://fatebook.io/predict-your-year',
          title: `Predict your ${year}`,
          description: "What will the new year hold for you? Write down your predictions and review at the end of the year.",
          images: [
            {
              url: 'https://fatebook.io/telescope_future_1200_white.png',
              width: 1200,
              height: 686,
              alt: '',
            },
          ],
          siteName: 'Fatebook',
        }}
      />
      <h2 className="text-4xl font-bold mb-4">Predict your year</h2>
      <p className="text-lg mb-8">What will the new year hold for you? Write down your predictions and review at the end of the year.</p>

      {(tournamentsQ.data?.filter(tournament => tournament.predictYourYear).length || 0) > 0 && (
        <div className="my-4 flex gap-2 flex-col">
          <h2 className="text-2xl font-bold mb-4">Pick up where you left off</h2>
          {tournamentsQ.data?.filter(tournament => tournament.predictYourYear).map(tournament => (
            <Link key={tournament.id} href={`/predict-your-year/${tournament.id}`} className="btn flex justify-start">
              {tournament.name}
            </Link>
          ))}
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">
      {(tournamentsQ.data?.filter(tournament => tournament.predictYourYear).length || 0) > 0 ?
        "Or make a new page of predictions"
        :
        "Let's get started"
      }</h2>
      <div className="flex gap-4 flex-wrap">
        <button className="btn btn-lg max-sm:btn-md py-4 flex items-center gap-2" disabled={createTournament.isLoading} onClick={() => { void handleGetStarted({teamMode: false}) }}>
          <UserIcon className="h-5 w-5 mr-1" />
          Predict your 2024: Personal predictions
        </button>
        <button className="btn btn-lg max-sm:btn-md py-4 flex items-center gap-2" disabled={createTournament.isLoading} onClick={() => { void handleGetStarted({teamMode: true}) }}>
          <UsersIcon className="h-5 w-5 mr-1" />
          Predict your 2024: Team predictions
        </button>
      </div>

      <div className="my-6">
        <h2 className="text-2xl font-bold mb-4">{"Why predict your year?"}</h2>
        <ul className="list-none space-y-4 pl-0">
          <li className="flex items-center space-x-3">
            <RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span><span className='font-semibold'>{"Plan your future"}</span><br />Get a clearer view of the upcoming year by thinking about your goals and expectations.</span>
          </li>
          <li className="flex items-center space-x-3">
            <ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span><span className='font-semibold'>{"Make your predictions concrete"}</span><br />{"Write down your forecast as a probability. 'Probably' is ambiguous, '80%' isn't."}</span>
          </li>
          <li className="flex items-center space-x-3">
            <TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
            <span><span className='font-semibold'>{"Reflect at the end of the year"}</span><br />Resolve your predictions as YES, NO or AMBIGUOUS. Reconnect with yourself from a year ago, and discover {"what's"} changed.</span>
          </li>
        </ul>
      </div>

      <Image src="/telescope_future_1200_white.png" width={1200} height={686} alt="" />
    </div>
  )
}
