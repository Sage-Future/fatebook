import { ChartBarIcon, ChatBubbleOvalLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/solid'
import { NextSeo } from 'next-seo'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import remarkGfm from 'remark-gfm'
import { webFeedbackUrl } from '../lib/web/utils'

const about = String.raw`
Fatebook aims to be the fastest way to make and track your predictions.

Fatebook was made by [Adam Binks](https://adambinks.me) at [Sage](https://forum.effectivealtruism.org/users/sage).

Want something changed or added? Send us feedback on [Discord](https://discord.gg/mt9YVB8VDE), to [hello@sage-future.org](mailto:hello@sage-future.org), or in this [form](${webFeedbackUrl}).

You can use Fatebook through [fatebook.io](https://fatebook.io) or in [Slack](/for-slack). If you want to use Fatebook somewhere else, [suggest another Fatebook integration](https://forms.gle/nRqUcj154oEVLxdZ9).

Fatebook is open source. You can find the code on [GitHub](https://github.com/Sage-Future/fatebook). Contributions welcome!`

export default function AboutPage() {

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="About" />
      <div className="prose mx-auto">
        <h2>
          About
        </h2>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {about}
        </ReactMarkdown>
        <div className="my-4">
          <h2>{"Why build a habit of forecasting?"}</h2>
          <ul className="list-none space-y-4 pl-0">
            <li className="flex items-center space-x-3"><RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Make better decisions"}</span></li>
            <li className="flex items-center space-x-3"><ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Communicate more clearly"}</span></li>
            <li className="flex items-center space-x-3"><ChartBarIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Build your track record"}</span></li>
          </ul>
        </div>
      </div>
    </div>
  )
}