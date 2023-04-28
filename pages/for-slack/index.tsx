import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { AddToSlack } from "../../components/AddToSlack"
import Faqs from "../../components/Faqs"
import Footer from "../../components/Footer"
import { SlackCompose } from "../../components/SlackCompose"



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
          </div>

          <Faqs faqs={[
            {
              question: "When I ask a question using /forecast, who can make a prediction?",
              answer:
                "Anyone in the channel where you asked the question can forecast.",
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