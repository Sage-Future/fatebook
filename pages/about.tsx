import { NextSeo } from "next-seo"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { WhyForecastInfo } from "../components/WhyForecastInfo"
import { webFeedbackUrl } from "../lib/web/utils"

const about = String.raw`
Fatebook aims to be the fastest way to make and track your predictions.

Fatebook was made by [Sage](https://sage-future.org), a 501(c)(3) charity building tools to make sense of the future. You can [donate](https://www.every.org/sage-future?utm_campaign=donate-link&method=card%2Cbank%2Cpaypal%2Cpay%2Cvenmo%2Cstocks%2Cdaf%2Ccrypto#/donate) to support our work.

Want something changed or added? Send us feedback on [Discord](https://discord.gg/mt9YVB8VDE), to [hello@sage-future.org](mailto:hello@sage-future.org), or in this [form](${webFeedbackUrl}).

You can use Fatebook through [fatebook.io](https://fatebook.io) or in [Slack](/for-slack). If you want to use Fatebook somewhere else, [suggest another Fatebook integration](https://forms.gle/nRqUcj154oEVLxdZ9).

Fatebook is open source. You can find the code on [GitHub](https://github.com/Sage-Future/fatebook). Contributions welcome!`

export default function AboutPage() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="About" />
      <div className="prose mx-auto">
        <h2>About</h2>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{about}</ReactMarkdown>
        <div className="my-4">
          <WhyForecastInfo />
        </div>

        <Image
          src="/telescope_future_1200_white.png"
          width={1200}
          height={686}
          alt=""
        />
      </div>
    </div>
  )
}
