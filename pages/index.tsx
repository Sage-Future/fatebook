import { ChatBubbleOvalLeftIcon, RocketLaunchIcon, TrophyIcon } from '@heroicons/react/24/solid'
import { useSession } from "next-auth/react"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"
import { TrackRecord } from "../components/TrackRecord"

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession()

  return (
    <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto lg:w-[650px]">
        {!session?.user?.id && sessionStatus !== "loading" && <>
          <h3 className="text-neutral-600">Track your predictions, make better decisions</h3>
        </>}

        <Predict />
        <Questions />

        {
          sessionStatus !== "loading" && !session?.user?.id && <SignedOutInfo />
        }

      </div>
      <div className="pt-28 lg:w-[320px] max-sm:hidden">
        <TrackRecord />
      </div>
    </div>
  )
}

function SignedOutInfo() {
  return (
    <div className="my-6">
      <h2>{"Why build a habit of forecasting?"}</h2>
      <ul className="list-none space-y-4 pl-0">
        <li className="flex items-center space-x-3"><RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Make better decisions"}</span><br/>Get a clearer view of the consequences by thinking about the important questions.</span></li>
        <li className="flex items-center space-x-3"><ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Communicate more clearly"}</span><br/>{"Write down your prediction as a probability. 'Probably' is ambiguous, '80%' isn't."}</span></li>
        <li className="flex items-center space-x-3"><TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Build your track record"}</span><br/>Resolve your predictions as YES, NO or AMBIGUOUS. A feedback loop to develop powerful habits of mind.</span></li>
      </ul>
    </div>
  )
}