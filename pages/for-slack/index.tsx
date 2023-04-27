import { AddToSlack } from "../../components/AddToSlack"
import Faqs from "../../components/Faqs"
import Footer from "../../components/Footer"
import { SlackCompose } from "../../components/SlackCompose"

export default function ForSlackPage() {
  return (
    <div className="flex flex-col min-h-screen ">
      {/* <NavbarGeneric /> */}
      <div className="bg-gray-50 grow">
        <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-4xl">
          <div className="prose mx-auto">
            <h2 className="text-3xl mb-2 font-extrabold text-gray-900">
              Fatebook for Slack
            </h2>
            <h3 className="text-gray-600">Track your predictions, right where your team works</h3>

            <div className="my-14">
              <SlackCompose />
            </div>

            <div className="flex mb-20">
              <div className="m-auto">
                <AddToSlack />
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
            {
              question: "How do I make private predictions?",
              answer:
                "Use the /forecast command in a direct message with @Fatebook.",
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