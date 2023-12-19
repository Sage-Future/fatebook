import { CheckIcon, PlusIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { ScaleIcon } from '@heroicons/react/24/outline'
import { BriefcaseIcon, GlobeAsiaAustraliaIcon, HeartIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { useEffect, useState } from 'react'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Predict } from '../components/Predict'
import { Questions } from '../components/Questions'
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
      if (questionDrafts.length > 2) {
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
        <div className="prose mx-auto lg:w-[650px] flex flex-col gap-10">
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
            <QuestionSuggestionsByCategory
              suggestions={personalSuggestions(year)}
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
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
          className="w-full bg-white shadow-inner rounded-b-md px-6 pt-2 pb-4 mb-6 flex flex-col items-start gap-2 z-10"
        >
          <h4 className="select-none pl-4">{"Here are a few ideas..."}</h4>
          {suggestions.find(s => s.category === selectedCategory)?.questions.map((question, index) => (
            <motion.div
              key={question.q || question.label}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * (index + 1), duration: 0.2 }}
            >
              {question.label && <ReactMarkdown className='text-sm ml-4 italic text-neutral-500'>{question.label}</ReactMarkdown>}
              {question.q && <button
                className={clsx(
                  "btn btn-ghost text-left font-normal leading-normal",
                  clickedSuggestions.includes(question.q) ? "text-neutral-400" : "text-neutral-500"
                )}
                onClick={() => {
                  onSuggestionSelect((question.q))
                  setClickedSuggestions(prev => [...prev, (question.q)])
                }}
              >
                <span className="ml-4">
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
    category: "Health",
    icon: <HeartIcon className="w-6 h-6" />,
    questions: [
      {
        q: `Will I track 100 runs on Strava in ${year}?`
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
        q: `Will I have a depressive episode in ${year}?`,
      },
      {
        q: `Will >99% of the food I eat be vegan for at least four months during ${year}?`,
      },
      {
        q: `Will I be able to do >=30 push-ups at some point in ${year}?`
      },
      {
        q: `Will I get a cold in ${year}?`,
      },
      {
        q: `Will I go on a meditation retreat during ${year}?`,
      },
    ]
  },
  {
    category: "Goals",
    icon: <TrophyIcon className="w-6 h-6" />,
    questions: [
      {
        label: "We recommend:\n1) Think soberly about the probability that you achieve your goal\n2) Is the probability lower than 90%? Why so, what strategies will you implement to increase it?\n3) Repeat until you are confident that you'll achieve your goal! (Or you think the costs of actually achieving it outweigh the benefits)",
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
        q: `Will my manager's assessment of my work performance in ${year} be higher than this year?`,
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