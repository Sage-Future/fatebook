import { ChartBarIcon, ChatBubbleOvalLeftIcon, CheckCircleIcon, RocketLaunchIcon, TrophyIcon } from "@heroicons/react/24/solid"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { AddToSlack } from "../../components/AddToSlack"
import Faqs from "../../components/Faqs"
import Footer from "../../components/Footer"
import { SlackCompose } from "../../components/SlackCompose"
import Image from "next/image"



export default function ForSlackPage() {
  const router = useRouter()
  const { installedTo } = router.query

  return (
    <div className="flex flex-col min-h-screen ">
      <NextSeo title="Fatebook for Slack" titleTemplate="Fatebook for Slack" />
      <div className="bg-gray-50 grow">
        <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
          <div className="prose mx-auto">
            <h2 className="text-3xl mb-2 font-extrabold text-gray-900">
              Fatebook for Slack
            </h2>
            <h3 className="text-gray-600">Track your predictions, right where your team works</h3>

            {installedTo && <>
              <h2 className="my-16 text-3xl text-center">
                <CheckCircleIcon className="inline mr-4" color="green" height={52}/>
                {`Added to your workspace ${installedTo}!`}
              </h2>
            </>}

            <div className="my-14">
              <SlackCompose />
            </div>

            <div className="flex mb-20">
              <div className="m-auto">
                <AddToSlack buttonText={installedTo ? "Add to another Slack workspace" : "Add to Slack"} />
              </div>
            </div>

            <div className="my-8 p-1 bg-white">
              <Image src={"/question_screenshot.png"} className="mx-auto" alt="" width={600} height={200} />
            </div>

            <div className="my-4">
              <h2>{"Why build a culture of forecasting?"}</h2>
              <ul className="list-none space-y-4 pl-0">
                <li className="flex items-center space-x-3"><RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Make better decisions"}</span></li>
                <li className="flex items-center space-x-3"><ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Communicate more clearly"}</span></li>
                <li className="flex items-center space-x-3"><ChartBarIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Build your track record"}</span></li>
                <li className="flex items-center space-x-3"><TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Trust your most reliable forecasters"}</span></li>
              </ul>
            </div>
          </div>

          <Faqs faqs={[
            {
              question: "When I ask a question using /forecast, who can make a prediction?",
              answer:
                "Anyone in the channel where you asked the question can forecast.",
            },
            {
              question: "Where can I use /forecast?",
              answer:
                "You can use /forecast in any channel."
            },
            {
              question: "Does the app have access to my team's Slack messages?",
              answer:
                "The app only receives messages where you use the /forecast command or mention @Fatebook."
            },
            // {
            //   question: "Are my team's forecasts private?",
            //   answer:
            //     "Yes, only your team can see forecasts made in your Slack workspace."
            // },
            {
              question: "How do I make personal predictions that aren't shared with other members of my team?",
              answer:
                "Use the /forecast command in a direct message with @Fatebook.",
            },
            {
              question: "How can I get better at forecasting?",
              answer:
                "Try our rapid-feedback training tools on [Quantified Intuitions](https://quantifiedintuitions.org).",
            },
            {
              question: "How can I submit feedback about Fatebook?",
              answer: "You can email us at hello@sage-future.org or message us on [Discord](https://discord.gg/mt9YVB8VDE).",
            },
          ]} />
        </div>
      </div>
      <Footer />
    </div >
  )
}