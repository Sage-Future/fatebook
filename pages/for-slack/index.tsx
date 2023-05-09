import { ChartBarIcon, ChatBubbleOvalLeftIcon, CheckCircleIcon, RocketLaunchIcon, TrophyIcon } from "@heroicons/react/24/solid"
import { NextSeo } from "next-seo"
import Image from "next/image"
import { useRouter } from "next/router"
import { AddToSlack } from "../../components/AddToSlack"
import Faqs from "../../components/Faqs"
import { SlackCompose } from "../../components/SlackCompose"



export default function ForSlackPage() {
  const router = useRouter()
  const { installedTo } = router.query

  return (
    <div className="bg-gray-50 grow">
      <NextSeo title="Fatebook for Slack" titleTemplate="Fatebook for Slack" />
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

          <div className="my-4">
            <h2>{"Why build a culture of forecasting?"}</h2>
            <ul className="list-none space-y-4 pl-0">
              <li className="flex items-center space-x-3"><RocketLaunchIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Make better decisions"}</span></li>
              <li className="flex items-center space-x-3"><ChatBubbleOvalLeftIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Communicate more clearly"}</span></li>
              <li className="flex items-center space-x-3"><ChartBarIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Build your track record"}</span></li>
              <li className="flex items-center space-x-3"><TrophyIcon className="flex-shrink-0 mr-2 w-6 h-6 text-indigo-500 inline-block" /><span>{"Trust your most reliable forecasters"}</span></li>
            </ul>
          </div>

          <div className="my-8 p-1 bg-white hover:scale-[1.02] transition-transform">
            <Image src={"/question_screenshot.png"} className="mx-auto" alt="" width={600} height={200} />
          </div>

          <section className="">
            <div className="max-w-screen-xl px-4 py-8 mx-auto text-center lg:py-16 lg:px-6">
              <figure className="max-w-screen-md mx-auto">
                <svg className="h-12 mx-auto mb-3 text-gray-400" viewBox="0 0 24 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" fill="currentColor"/>
                </svg>
                <blockquote>
                  <p className="text-xl lg:text-2xl font-medium text-gray-900 ">{'"Fatebook offers a quick, clear view into predictions across the organization. It\'s not just informative, it\'s engaging too."'}</p>
                </blockquote>
                <figcaption className="flex items-center justify-center mt-6 space-x-3">
                  <Image width={25} height={25} className="rounded-full" src="/niel.jpeg" alt="profile picture" />
                  <div className="flex items-center">
                    <div className="pr-2 font-medium text-gray-900 ">Niel Bowerman</div>
                    <div className="pl-2 text-sm font-light text-gray-500">Director of Special Projects at 80,000 Hours</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="">
            <div className="max-w-screen-xl px-4 py-8 mx-auto text-center lg:py-16 lg:px-6">
              <figure className="max-w-screen-md mx-auto">
                <svg className="h-12 mx-auto mb-3 text-gray-400" viewBox="0 0 24 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" fill="currentColor"/>
                </svg>
                <blockquote>
                  <p className="text-xl font-medium text-gray-900 ">{'"We absolutely love this thing so far. It just came in handy today with "if we deploy XYZ as a beeta feature will we decide to deploy it universally?" Getting a quick sense of that probability is great for deciding whether to put in the work on the feature!"'}</p>
                </blockquote>
                <figcaption className="flex items-center justify-center mt-6 space-x-3">
                  <Image width={25} height={25} className="object-cover h-[25px] rounded-full" src="/daniel.png" alt="profile picture" />
                  <div className="flex items-center">
                    <div className="pr-2 font-medium text-gray-900 ">Daniel Reeves</div>
                    <div className="pl-2 text-sm font-light text-gray-500">Cofounder at Beeminder</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </section>
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
            question: "How can I stay up to date about Fatebook and Sage's other projects?",
            answer:
                "You can [join our mailing list](https://quantifiedintuitions.org) and [Discord](https://discord.gg/mt9YVB8VDE)."
          },
          {
            question: "How can I submit feedback about Fatebook?",
            answer: "You can email us at hello@sage-future.org or message us on [Discord](https://discord.gg/mt9YVB8VDE).",
          },
        ]} />
      </div>
    </div >
  )
}