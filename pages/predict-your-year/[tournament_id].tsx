import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { BoltIcon, CogIcon } from '@heroicons/react/24/solid'
import { Tournament } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Predict } from '../../components/Predict'
import { Questions } from '../../components/Questions'
import { ShareTournament } from '../../components/ShareTournament'
import { TabbedQuestionSuggestions } from '../../components/TabbedQuestionSuggestions'
import { TournamentAdminPanel } from '../../components/TournamentAdminPanel'
import { TournamentLeaderboard } from '../../components/TournamentLeaderboard'
import { generateRandomId } from '../../lib/_utils_common'
import { api } from '../../lib/web/trpc'
import { signInToFatebook } from '../../lib/web/utils'

export default function PredictYourYearPage() {
  const router = useRouter()
  const user = useSession()?.data?.user
  const userId = user?.id

  // eslint-disable-next-line no-unused-vars
  const [teamMode, setTeamMode] = useState(router.query.team === '1')
  useEffect(() => {
    if (router.query.team === '1') {
      setTeamMode(true)
    }
  }, [router.query.team])

  const year = 2024

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.tournament_id && (router.query.tournament_id as string).match(/(.*)--(.*)/)
  const tournamentId = parts ? parts[2] : (router.query.tournament_id as string) || ""

  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  }, {
    retry: false
  })
  const utils = api.useContext()

  const isAdmin = userId && tournamentQ.data?.authorId === userId
    || (tournamentQ.data?.anyoneInListCanEdit && tournamentQ.data?.userList?.users.find(u => u.id === userId))

  const [questionDrafts, setQuestionDrafts] = useState<{key: string, defaultTitle?: string}[]>([{
    key: 'default',
  }])

  useEffect(() => {
    // Handle the case where user clicks a <Link>
    const handleRouteChange = () => {
      if (questionDrafts.length > 1) {
        const userConfirmed = window.confirm("You have unsaved predictions. Are you sure you want to leave?")
        if (!userConfirmed) {
          router.events.emit('routeChangeError')
          throw 'routeChange aborted.'
        }
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)

    // Handle tab close/reload etc
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (questionDrafts.length > 1) {
        e.preventDefault()
        e.returnValue = "You have unsaved predictions. Are you sure you want to leave?"
      }
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [questionDrafts, router])

  return (
    <div className="px-4 pt-6 mx-auto max-w-6xl">
      <NextSeo
        title={tournamentQ.data?.name || `Predict your ${year}`}
        description='What will the new year hold for you? Write down your predictions and review at the end of the year.'
      />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px] flex flex-col gap-10 relative">
          {userId && tournamentQ.data && <SettingsButtons teamMode={teamMode} tournament={tournamentQ.data} />}

          {
            !userId && <div className='text-center'>
              <button className="btn btn-primary mx-auto btn-lg text-lg" onClick={() => void signInToFatebook()}>
                {"Sign up to start predicting your year"}
              </button>
            </div>
          }
          {
            tournamentQ.data ?
              <Questions
                title={tournamentQ.data?.name ? `${tournamentQ.data.name}` : "Loading..."}
                noQuestionsText=' '
                filterTournamentId={tournamentId}
                description={tournamentQ.data?.description || undefined}
                showFilterButtons={false}
              />
              :
              <h3 className="text-neutral-600">
                {tournamentQ.error ? "You don't have access or this page of predictions doesn't exist." : (tournamentQ.isLoading ? "Loading..." : "")}
              </h3>
          }
          <div className='flex flex-col gap-8'>
            {isAdmin && questionDrafts.map((draft) =>
              <div className="relative" key={draft.key}>
                <Predict
                  questionDefaults={{
                    title: draft.defaultTitle,
                    tournamentId,
                    resolveBy: new Date(`${year + 1}-01-01`),
                  }}
                  onQuestionCreate={() => {
                    void utils.tournament.get.invalidate({ id: tournamentId })
                    setQuestionDrafts(drafts => drafts.filter(d => d.key !== draft.key))
                  }}
                  resolveByButtons={[
                    {
                      label: "3 months",
                      date: new Date(`${year}-04-01`),
                    },
                    {
                      label: "6 months",
                      date: new Date(`${year}-07-01`),
                    },
                    {
                      label: "9 months",
                      date: new Date(`${year}-10-01`),
                    },
                    {
                      label: "End of year",
                      date: new Date(`${year + 1}-01-01`),
                    },
                  ]}
                  placeholder="Will I move house in 2024?"
                  showQuestionSuggestionsButton={false}
                  small={true}
                  smartSetDates={false}
                />
                {questionDrafts.length > 1 && <button
                  className="btn btn-xs absolute -bottom-2 right-0"
                  onClick={() => setQuestionDrafts(drafts => drafts.filter(d => d.key !== draft.key))}
                >
                  Cancel
                </button>}
              </div>
            )}
            {questionDrafts.length > 1 &&
              <button
                className="btn btn-lg hover:scale-105 ml-auto"
                onClick={() => {
                  const predictAllEvent = new CustomEvent('predictAll')
                  window.dispatchEvent(predictAllEvent)
                }}
              >
                <BoltIcon className='w-4 h-4' />
                Submit all predictions
              </button>
            }
            {isAdmin && <div className="flex justify-center">
              <button
                className="btn btn-circle py-2.5 -mt-2"
                onClick={() => setQuestionDrafts(drafts => [...drafts, {key: generateRandomId(), defaultTitle: ''}])}
              >
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>}
          </div>
          <TabbedQuestionSuggestions
            teamMode={teamMode}
            setTeamMode={setTeamMode}
            year={year}
            setQuestionDrafts={(drafts) => isAdmin ?
              setQuestionDrafts(drafts)
            :
            toast(
              <span>
                {tournamentQ.data?.author.name || "This page's creator"}{" hasn't given you access to add questions. "}
                <Link href="/predict-your-year" target="_blank" className='hover:underline font-semibold block text-sm mt-4'>
                  Create your own set of predictions for {year}
                </Link>
              </span>,
              {
                duration: 10000,
              }
            )
          }
          />
          {tournamentQ.data?.showLeaderboard && <div className='overflow-x-auto max-w-[90vw]'>
            <TournamentLeaderboard tournamentId={tournamentId} />
          </div>}

          {userId !== tournamentQ.data?.authorId && <div className='text-sm mt-4 mx-auto'>
            <button onClick={() => void router.push("/predict-your-year")} className='btn font-semibold'>
              Create your own set of predictions for {year}, for yourself or with your team
            </button>
          </div>}
        </div>
      </div>
    </div>
  )
}

function SettingsButtons({teamMode, tournament}: { teamMode: boolean, tournament: Tournament }) {
  return <div
    className='ml-auto max-sm:-mt-4 -mb-10 sm:absolute right-0 top-4 flex gap-2'
  >
    <button
      className="btn btn-primary"
      onClick={() => (document?.getElementById('tournament_share_modal') as any)?.showModal()}
    >
      Share with your {teamMode ? "team" : "friends"}
    </button>
    <dialog id="tournament_share_modal" className="modal max-sm:modal-top">
      <div className="modal-box overflow-visible">
        <form method="dialog" className="modal-backdrop">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <XMarkIcon className="w-6 h-6 text-neutral-500" />
          </button>
        </form>
        <h3 className="font-bold text-lg mt-0">Share</h3>
        <ShareTournament tournamentId={tournament.id} />
      </div>
    </dialog>

    <button
      className="btn"
      onClick={() => (document?.getElementById('tournament_admin_panel') as any)?.showModal()}
    >
      <CogIcon className="w-6 h-6 text-neutral-500" />
    </button>
    <dialog id="tournament_admin_panel" className="modal max-sm:modal-top">
      <div className="modal-box max-w-[100vw] sm:max-w-prose">
        <form method="dialog" className="modal-backdrop">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <XMarkIcon className="w-6 h-6 text-neutral-500" />
          </button>
        </form>
        <TournamentAdminPanel
          tournamentId={tournament.id}
          includeAddNewQuestion={false}
          includeShareTournament={false}
          collapsible={false} />
      </div>
    </dialog>
  </div>
}

