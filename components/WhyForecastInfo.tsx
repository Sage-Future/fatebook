import { ChatBubbleOvalLeftIcon, RocketLaunchIcon, TrophyIcon } from '@heroicons/react/24/solid'

export function WhyForecastInfo() {
  return (
    <div className="my-6">
      <h2>{"Why build a habit of forecasting?"}</h2>
      <ul className="list-none space-y-4 pl-0">
        <li className="flex items-center space-x-3"><RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Make better decisions"}</span><br />Get a clearer view of the consequences by thinking about the important questions.</span></li>
        <li className="flex items-center space-x-3"><ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Communicate more clearly"}</span><br />{"Write down your prediction as a probability. 'Probably' is ambiguous, '80%' isn't."}</span></li>
        <li className="flex items-center space-x-3"><TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span><span className='font-semibold'>{"Build your track record"}</span><br />Resolve your predictions as YES, NO or AMBIGUOUS. A feedback loop to develop powerful habits of mind.</span></li>
      </ul>
    </div>
  )
}
