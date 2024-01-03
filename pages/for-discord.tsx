import {
  ChartBarIcon,
  ChatBubbleOvalLeftIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid"
import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"
import { DiscordCompose } from "../components/DiscordCompose"
import Faqs from "../components/Faqs"
import { Layout } from "../components/Layout"

export default function ForDiscordPage() {
  const router = useRouter()
  const { installedTo } = router.query

  return (
    <div className="bg-neutral-50 grow">
      <NextSeo
        title="Fatebook for Discord"
        titleTemplate="Fatebook for Discord"
        description="Rapidly share your predictions with your community"
      />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
            Fatebook for Discord
            <span className="text-2xl font-semibold text-indigo-900 ml-4 bg-indigo-100 px-2 py-1 rounded-md">
              BETA
            </span>
          </h2>
          <h3 className="text-neutral-600">
            Share your predictions with your community
          </h3>

          {installedTo && (
            <>
              <h2 className="my-16 text-3xl text-center">
                <CheckCircleIcon
                  className="inline mr-4"
                  color="green"
                  height={52}
                />
                {`Added to your workspace ${installedTo}!`}
              </h2>
            </>
          )}

          <div className="my-14">
            <DiscordCompose />
          </div>

          <div className="flex mb-20">
            <div className="m-auto">
              <Link href="https://fatebook.io/api/discord/install">
                <button className="inline-flex items-center border border-transparent rounded-md my-4 text-2xl py-4 px-6 shadow-2xl shadow-indigo-500 hover:scale-105 transition-transform bg-white text-black font-semibold hover:bg-white">
                  <>
                    <Image
                      src="/discord-logo.svg"
                      width={30}
                      height={30}
                      className="my-5 mr-4 !fill-indigo-500"
                      alt=""
                    />
                    <span>Add to Discord</span>
                  </>
                </button>
              </Link>
            </div>
          </div>

          <div className="my-4">
            <h2>{"Why build a culture of forecasting?"}</h2>
            <ul className="list-none space-y-4 pl-0">
              <li className="flex items-center space-x-3">
                <RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
                <span>{"Make better decisions"}</span>
              </li>
              <li className="flex items-center space-x-3">
                <ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
                <span>{"Communicate more clearly"}</span>
              </li>
              <li className="flex items-center space-x-3">
                <ChartBarIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
                <span>{"Build your track record"}</span>
              </li>
              <li className="flex items-center space-x-3">
                <TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" />
                <span>{"Trust your most reliable forecasters"}</span>
              </li>
            </ul>
          </div>

          <div className="my-8 px-1 py-0.5 bg-[#26272B] hover:scale-[1.02] transition-transform">
            <Image
              src={"/discord-question-screenshot-1600-1008.png"}
              className="mx-auto"
              alt=""
              width={600}
              height={200}
            />
          </div>
        </div>

        <Faqs
          faqs={[
            {
              question:
                "When I ask a question using /forecast, who can make a prediction?",
              answer:
                "Questions added using the Discord bot are accessible to anyone with the link, so anyone in your server can see them.",
            },
            {
              question: "Where can I use /forecast?",
              answer: "You can use /forecast in any Discord channel.",
            },
            {
              question:
                "Does the app have access to my community's Discord messages?",
              answer:
                "The app only receives messages where you use the /forecast command.",
            },
            {
              question: "I don't use Discord, can I still use Fatebook?",
              answer:
                "[Fatebook.io](https://fatebook.io) lets you make rapid predictions on the web, or you can use [Fatebook for Slack](/for-slack). [Suggest a Fatebook integration for another platform.](https://forms.gle/nRqUcj154oEVLxdZ9)",
            },
            {
              question: "How can I get better at forecasting?",
              answer:
                "Try our rapid-feedback training tools on [Quantified Intuitions](https://quantifiedintuitions.org).",
            },
            {
              question:
                "How can I stay up to date about Fatebook and Sage's other projects?",
              answer:
                "You can [join our mailing list](https://quantifiedintuitions.org) and [Discord](https://discord.gg/mt9YVB8VDE).",
            },
            {
              question: "How can I submit feedback about Fatebook?",
              answer:
                "You can email us at hello@sage-future.org or message us on [Discord](https://discord.gg/mt9YVB8VDE).",
            },
          ]}
        />
      </div>
    </div>
  )
}

ForDiscordPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout showForSlackButton={true} showCreateAccountButton={false}>
      {page}
    </Layout>
  )
}
