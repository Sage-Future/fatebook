import { CheckIcon, PlusIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { ScaleIcon } from '@heroicons/react/24/outline'
import { BriefcaseIcon, ChartBarIcon, CurrencyDollarIcon, GlobeAsiaAustraliaIcon, HeartIcon, LifebuoyIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { useEffect, useState } from 'react'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Predict } from '../components/Predict'
import { Questions } from '../components/Questions'
import { ShareTournament } from '../components/ShareTournament'
import { generateRandomId } from '../lib/_utils_common'
import { api } from '../lib/web/trpc'
import { signInToFatebook } from '../lib/web/utils'

export default function PredictYourYearPage() {
  const user = useSession()?.data?.user
  const userId = user?.id

  // eslint-disable-next-line no-unused-vars
  const [teamMode, setTeamMode] = useState(false)

  const year = 2024
  const tournamentId = `predict-your-year-${year}-${teamMode ? "team" : "personal"}-${userId}`

  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
    createIfNotExists: userId ? {
      name: `Your predictions for ${year}`,
    } : undefined,
  })
  const utils = api.useContext()

  const [questionDrafts, setQuestionDrafts] = useState<{key: string, defaultTitle?: string}[]>([{
    key: 'default',
  }])

  useEffect(() => {
    // NB: doesn't work for <Link>s, just tab close/reload etc
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (questionDrafts.length > 1) {
        e.preventDefault()
        e.returnValue = "You have unsaved predictions. Are you sure you want to leave?"
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [questionDrafts])

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title={tournamentQ.data?.name || `Predict your life in ${year}`}
        description='What will the new year hold for you? Write down your predictions and review at the end of the year.'
        canonical='https://fatebook.io/predict-your-year'
      />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px] flex flex-col gap-10 relative">
          <button
            className="btn ml-auto max-sm:-mt-8 -mb-10 sm:absolute right-0 top-4"
            onClick={()=>(document?.getElementById('tournament_share_modal') as any)?.showModal()}
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
              <ShareTournament tournamentId={tournamentId} />
            </div>
          </dialog>
          {
            !userId && <div className='text-center'>
              <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
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
              <h3 className="text-neutral-600">{tournamentQ.isLoading ? "Loading..." : ""}</h3>
          }
          <div className='flex flex-col gap-8'>
            {questionDrafts.map((draft) =>
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
                />
                <button
                  className="absolute top-0 right-0 mr-2 mt-2"
                  onClick={() => setQuestionDrafts(drafts => drafts.filter(d => d.key !== draft.key))}
                >
                  <XCircleIcon className="w-6 h-6 text-neutral-300 hover:text-neutral-400" />
                </button>
              </div>
            )}
            <div className="flex justify-center">
              <button
                className="btn btn-circle py-2.5"
                onClick={() => setQuestionDrafts(drafts => [...drafts, {key: generateRandomId(), defaultTitle: ''}])}
              >
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className='max-w-full'>
            <div className='text-center'>
              <div className="join">
                <button
                  className={clsx(
                    "btn join-item rounded-b-none",
                    !teamMode ? "btn-active" : "text-neutral-500"
                  )}
                  onClick={() => setTeamMode(false)}
                >
                  Personal predictions
                </button>
                <button
                  className={clsx(
                    "btn join-item rounded-b-none",
                    teamMode ? "btn-active" : "text-neutral-500"
                  )}
                  onClick={() => setTeamMode(true)}
                >
                  Team predictions
                </button>
              </div>
            </div>
            <QuestionSuggestionsByCategory
              key={teamMode ? "team" : "personal"}
              suggestions={teamMode ? teamSuggestions(year) : personalSuggestions(year)}
              onSuggestionSelect={(title) => {
                setQuestionDrafts(drafts => [...drafts, {key: generateRandomId(), defaultTitle: title}])
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionSuggestionsByCategory({
  suggestions,
  onSuggestionSelect,
}: {
  suggestions: ReturnType<typeof personalSuggestions>
  onSuggestionSelect: (title: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState(suggestions[0].category)
  const [clickedSuggestions, setClickedSuggestions] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-2 bg-white rounded-xl shadow-sm py-4">
      <h4 className="select-none pl-4 mt-0">{"Here are a few ideas..."}</h4>
      <div className="flex gap-2 flex-wrap px-4">
        {suggestions.map((category) => (
          <div className="relative" key={category.category}>
            <button
              key={category.category}
              className={clsx(
                "btn flex flex-col items-center py-2 px-3 text-xs",
                selectedCategory === category.category && "btn-primary",
              )}
              onClick={() => setSelectedCategory(category.category)}
            >
              {category.icon}
              <span>{category.category}</span>
            </button>
          </div>
        ))}
      </div>
      {selectedCategory !== null && (
        <motion.div
          className="w-full rounded-b-md px-6 pt-2 pb-4 mb-6 flex flex-col items-start gap-2 z-10"
        >
          {suggestions.find(s => s.category === selectedCategory)?.questions.map((question, index) => (
            <motion.div
              key={question.q || question.label}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * (index + 1), duration: 0.2 }}
              className='w-full'
            >
              {question.label && <div className='bg-neutral-50 px-2 py-1 rounded-lg w-full'>
                <ReactMarkdown className='text-sm ml-4 italic text-neutral-500 w-full'>{question.label}</ReactMarkdown>
              </div>}
              {question.q && <button
                className={clsx(
                  "btn btn-ghost text-left font-normal leading-normal w-full",
                  clickedSuggestions.includes(question.q) ? "text-neutral-400" : "text-neutral-500"
                )}
                onClick={() => {
                  onSuggestionSelect((question.q))
                  setClickedSuggestions(prev => [...prev, (question.q)])
                }}
              >
                <span className="mr-auto">
                  {clickedSuggestions.includes(question.q) ? (
                    <CheckIcon className="text-neutral-400 w-4 h-4 inline mr-1 -ml-5" />
                  ) : (
                    <span className="text-neutral-500 font-semibold mr-2 -ml-4">+</span>
                  )}
                  <span>{question.q}</span>
                </span>
              </button>}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

const personalSuggestions = (year: number) => [
  {
    category: "Goals",
    icon: <TrophyIcon className="w-6 h-6" />,
    questions: [
      {
        label: "We recommend:\n1) Think soberly about the probability that you achieve your goal\n2) What strategies will you implement to raise the probability?\n3) Repeat until you are satisfied!",
      },
      {
        q: `Will I achieve my goal <x> in ${year}?`
      },
      {
        q: `Will I implement strategy <y> to help achieve my goal <x> in ${year}?`
      },
      {
        q: `Will I still think goal <x> is a top priority for me to pursue at the end of ${year}?`
      },
      {
        q: `Will I still be maintaining my existing habit <z> at the end of ${year}?`
      },
    ],
  },
  {
    category: "Health",
    icon: <HeartIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I exercise on 100 days (around twice a week) in ${year}?`
      },
      {
        q: `Will illness cause me to lose 3 or more weeks of productivity in ${year}?`,
      },
      {
        q: `If I get a flu jab, will illness cause me to lose 3 or more weeks of productivity in ${year}?`,
      },
      {
        q: `Will I track 50 runs on Strava in ${year}?`
      },
      {
        q: `Will I get COVID in ${year}?`,
      },
      {
        q: `Will my total steps in ${year} be higher than in the previous year?`,
      },
      {
        q: `Will I play pickleball in ${year}?`
      },
      {
        q: `Will I be able to do >=30 push-ups at some point in ${year}?`
      },
      {
        q: `Will I get a cold in ${year}?`,
      },
      {
        q: `Will >99% of the food I eat be vegan for at least four months during ${year}?`,
      },
      {
        q: `Will I meditate 20 times during ${year}?`,
      },
    ]
  },
  {
    category: "Relationships",
    icon: <UserGroupIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I be in a relationship at the end of ${year}?`,
      },
      {
        q: `Will I make a new close friend in ${year}?`,
      },
      {
        q: `Will <a> and <b> break up in ${year}?`,
      },
      {
        q: `Will I want to have kids within the next two years at the end of ${year}?`,
      },
      {
        q: `Will I or my partner get pregnant in ${year}?`,
      },
      {
        q: `Will I have a new mentor at the end of ${year}?`,
      },
      {
        q: `Will I reconnect with a friend from my past who I haven't spoken to in over a year, in ${year}?`,
      },
      {
        q: `Will I establish a weekly boardgame night meet-up in ${year}?`,
      },
    ]
  },
  {
    category: "Work",
    icon: <BriefcaseIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I get a raise in ${year}?`,
      },
      {
        q: `Will I spend 5 hours journalling about my career reflections and plans in ${year}?`,
      },
      {
        q: `Will I get a new job in ${year}?`,
      },
      {
        q: `Will I donate at least 10% of my salary to charity in ${year}?`,
      },
      {
        q: `Will I attend a conference in ${year}?`,
      },
      {
        q: `Will my manager's assessment of my work performance in ${year} be higher than the previous year?`,
      },
      {
        q: `Will I publish 3 papers in ${year}?`,
      },
      {
        q: `Will I use AI tools for >1 hour a day in my last work week of ${year}?`,
      },
    ]
  },
  {
    category: "Adventure",
    icon: <GlobeAsiaAustraliaIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I visit a new country in ${year}?`,
      },
      {
        q: `Will I try a new creative pursuit in ${year}?`,
      },
      {
        q: `Will I stay up all night in ${year}?`,
      },
      {
        q: `At the end of ${year}, will I think that the best experience of my life so far happened during ${year}?`,
      },
      {
        q: `Will I write a novel in ${year}?`,
      },
      {
        q: `Will I conquer my fear of <x> in ${year}?`,
      },
      {
        q: `Will I be bitten by a venomous snake in ${year}?`,
      },
      {
        q: `Will I climb more than 3 mountains in ${year}?`,
      },
    ]
  },
  {
    category: "Meta",
    icon: <ScaleIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I resolve all of my yearly ${year} predictions at the end of the year?`,
      },
      {
        q: `Will I use Fatebook to predict the *next* year at the end of ${year}?`,
      },
      {
        q: `Will >5 of my ${year} predictions be too ambiguous to resolve as YES or NO?`,
      },
      {
        q: `Will I consider having made yearly predictions a valuable use of my time at the end of ${year}?`,
      },
      {
        q: `Will I write down 100 predictions during ${year}?`,
      },
      {
        q: `Will my predictions about my life in ${year} be more accurate than any of my friends?`,
      },
    ]
  },
]

const teamSuggestions = (year: number) => [
  {
    category: "Performance",
    icon: <ChartBarIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will we achieve a customer satisfaction score above <target> by the end of ${year}?`
      },
      {
        q: `Will our team's work be featured in a major media outlet in ${year}?`
      },
      {
        q: `Will we pivot to a new product in ${year}?`
      },
      {
        q: `Will we retire any of our current products in ${year}?`
      },
      {
        q: `Will ${year} be our team's best year of all time (according to a poll of team members at the end of the year)?`
      },
      {
        q: `Will we expand our market presence to a new region or demographic in ${year}?`
      },
    ]
  },
  {
    category: "Finance",
    icon: <CurrencyDollarIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will we exceed our target revenue in ${year}?`
      },
      {
        q: `Will we find a new major investor or donor in ${year}?`
      },
      {
        q: `Will our spending be higher or lower than our mainline ${year} budget?`
      },
      {
        q: `Will we reduce operational costs by at least <x>% in ${year}?`
      },
      {
        q: `At the end of ${year}, will our runway be >12 months?`
      },
    ]
  },
  {
    category: "Goals",
    icon: <TrophyIcon className="w-6 h-6" />,
    questions: [
      {
        label: "We recommend:\n1) Think soberly about the probability that you achieve your goal\n2) What strategies will you implement to raise the probability?\n3) Repeat until you are satisfied!",
      },
      {
        q: `Will we achieve our goal <x> in ${year}?`
      },
      {
        q: `Will we implement strategy <y> to help achieve our goal <x> in ${year}?`
      },
      {
        q: `Will we still think goal <x> is a top priority for us to pursue at the end of ${year}?`
      },
      {
        q: `Will we still be maintaining our existing process <z> at the end of ${year}?`
      },
    ],
  },
  {
    category: "Team",
    icon: <UserGroupIcon className="w-6 h-6" />,
    questions: [
      {
        "q": `Will our team's average satisfaction score improve in the ${year} internal survey compared to the previous year?`
      },
      {
        q: `Will we grow the total team size in ${year}?`,
      },
      {
        q: `Will we hire a new <role> in ${year}?`,
      },
      {
        q: `Will we fire any team members in ${year}?`,
      },
      {
        q: `Will we have a team off-site in ${year}?`,
      },
      {
        q: `Will our team off-site be in <location> in ${year}?`,
      },
      {
        q: `Will our team still exist at the end of ${year}?`,
      },
      {
        q: `Will any potential new hires reject offers because our salary offer is too low in ${year}?`
      }
    ]
  },
  {
    category: "Black Swans",
    icon: <LifebuoyIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will an unforeseen leadership crisis occur within our team in ${year}?`
      },
      {
        q: `Will a new technology emerge in ${year} that fundamentally disrupts our business model?`
      },
      {
        q: `Will there be a cybersecurity breach that significantly impacts our data security in ${year}?`
      },
      {
        q: `Will there be a sudden loss of a key team member that critically affects our projects in ${year}?`
      },
      {
        q: `Will a sudden and significant economic downturn drastically affect our industry in ${year}?`
      },
      {
        q: `Will new, unexpected trade restrictions or tariffs be imposed that significantly impact our supply chain in ${year}?`
      },
      {
        q: `Will a significant natural disaster directly impact our main operating regions in ${year}?`
      },
      {
        q: `Will there be a major geopolitical event that affects a team member's ability to work for us in ${year}?`
      },
      {
        q: `Will a competitor launch a product in ${year} that changes the competitive landscape?`
      },
      {
        q: `Will there be a sudden shift in consumer behavior or preferences relating to our products in ${year}?`
      },
      {
        q: `If new technology creates an opportunity for us to pivot to a new product in ${year}, will we pursue it?`
      },
      {
        q: `Will there be an unexpected change in industry regulation that significantly affects our operations in ${year}?`
      },
      {
        q: `Will a major policy change regarding data privacy come into effect in ${year}?`
      },
    ]
  },
  {
    category: "Meta",
    icon: <ScaleIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will we resolve all of our yearly ${year} predictions at the end of the year?`,
      },
      {
        q: `Will we use Fatebook to predict the *next* year at the end of ${year}?`,
      },
      {
        q: `Will >5 of our ${year} predictions be too ambiguous to resolve as YES or NO?`,
      },
      {
        q: `Will we make a notable decision or change in plans based on these team predictions for ${year}?`,
      },
      {
        q: `Will we consider having made yearly predictions a valuable use of our time at the end of ${year}?`,
      },
      {
        q: `Will we write down 100 predictions during ${year}?`,
      },
      {
        q: `Will <x>'s predictions about our team in ${year} be more accurate than any other team member?`,
      },
    ]
  },
]