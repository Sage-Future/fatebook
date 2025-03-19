import { NextSeo } from "next-seo"
import dynamic from "next/dynamic"
import Link from "next/link"
import "swagger-ui-react/swagger-ui.css"
import { CopyToClipboard } from "../components/ui/CopyToClipboard"
import { api } from "../lib/web/trpc"
import { signInToFatebook, useUserId } from "../lib/web/utils"

// eslint-disable-next-line @typescript-eslint/naming-convention
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })

export default function ApiPage() {
  const userId = useUserId()
  const utils = api.useContext()

  const apiKey = api.getApiKey.useQuery()
  const regenerateApiKey = api.regenerateApiKey.useMutation({
    async onSuccess() {
      await utils.getApiKey.invalidate()
    },
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title="API"
        description="Use the API to create Fatebook questions from a URL"
      />
      <div className="mx-auto prose">
        <h2>Fatebook API</h2>
        <h3>Use the API to create Fatebook questions from a URL</h3>
        {!userId && (
          <div className="flex w-full p-4">
            <button
              className="button primary mx-auto"
              onClick={() => void signInToFatebook()}
            >
              Sign in to set up your API key
            </button>
          </div>
        )}
        {userId && (
          <div className="flex flex-col w-full gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="label whitespace-nowrap font-semibold">
                Your API key
              </label>
              <div className="flex flex-grow gap-2">
                <div className="relative flex-grow">
                  <input
                    className="input w-full pr-10"
                    type="text"
                    value={apiKey.data ?? ""}
                    readOnly
                    disabled={!apiKey.data || regenerateApiKey.isLoading}
                  />
                  {apiKey.data && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <CopyToClipboard
                        textToCopy={apiKey.data ?? ""}
                        buttonLabel="Copy"
                      />
                    </div>
                  )}
                </div>
                <button
                  className="button primary whitespace-nowrap"
                  onClick={() => {
                    if (regenerateApiKey.isLoading) return
                    if (apiKey.data) {
                      if (
                        confirm(
                          "Are you sure you want to regenerate your API key? This will invalidate your old API key.",
                        )
                      ) {
                        regenerateApiKey.mutate()
                      }
                    } else {
                      void regenerateApiKey.mutate()
                    }
                  }}
                >
                  {apiKey.data ? "Regenerate" : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}
        <p>
          You can use your API key to create Fatebook questions just by going
          this URL (separated onto multiple lines for readability):
        </p>

        <p className="bg-neutral-100 outline outline-neutral-300 outline-1 p-2 rounded-md break-words">
          {"https://fatebook.io/api/v0/createQuestion"}
          {"?apiKey="}
          {apiKey.data || "YOUR_API_KEY"}
          <br />
          {"&title="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"YOUR_QUESTION_TITLE"}
          </span>
          <br />
          {"&resolveBy="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"RESOLUTION_DATE_YYYY-MM-DD"}
          </span>
          <br />
          {"&forecast="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"FORECAST_BETWEEN_0_AND_1"}
          </span>
          <br />
        </p>

        <p>{"Note: a date by itself will default to a time of 00:00 in the UTC timezone, which may not be the date you intended in your local timezone.  You can pass an ISO 8601 datetime for localization; for example, 2025-01-01T00:00+00:00.  You can also add some optional parameters, here's an example:"}</p>

        <p className="bg-neutral-100 outline outline-neutral-300 outline-1 p-2 rounded-md break-words">
          {"https://fatebook.io/api/v0/createQuestion"}
          {"?apiKey="}
          {apiKey.data || "YOUR_API_KEY"}
          <br />
          {"&title="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"YOUR_QUESTION_TITLE"}
          </span>
          <br />
          {"&resolveBy="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"RESOLUTION_DATE_YYYY-MM-DD"}
          </span>
          <br />
          {"&forecast="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"FORECAST_BETWEEN_0_AND_1"}
          </span>
          <br />
          {"&tags="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"TAG_1"}
          </span>
          <br />
          {"&tags="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"TAG_2"}
          </span>
          <br />
          {"&sharePublicly="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"yes"}
          </span>
          <br />
          {"&shareWithLists="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"LIST_NAME_1"}
          </span>
          <br />
          {"&shareWithLists="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"LIST_NAME_2"}
          </span>
          <br />
          {"&shareWithEmail="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"EMAIL_1"}
          </span>
          <br />
          {"&shareWithEmail="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"EMAIL_2"}
          </span>
          <br />
          {"&hideForecastsUntil="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"HIDE_FORECASTS_UNTIL_DATE_YYYY-MM-DD"}
          </span>
          <br />
        </p>

        <p>
          You can use this to integrate Fatebook with other tools, like iOS
          shortcuts. If you create an integration, let us know and we can tell
          other Fatebook users about it!
        </p>

        <p>
          Having trouble? Ask for help in{" "}
          <Link href="https://discord.gg/mt9YVB8VDE" target="_blank">
            Discord
          </Link>
          .
        </p>

        <h3>Integrations that other Fatebook users have created:</h3>
        <ul>
          <li>
            <Link href="https://github.com/GarretteBaker/obsidian-fatebook">
              An Obsidian plugin to create and preview Fatebook questions right
              inside your editor
            </Link>
            {" - by D0TheMath"}
          </li>
          <li>
            <Link href="https://www.icloud.com/shortcuts/25903acfcd3d4fd5bed31c2f50322928">
              An iOS shortcut to create a Fatebook question
            </Link>
            {
              " - by @JasperGo. You can add it to your homescreen or use Siri to create a question!"
            }
          </li>
          <li>
            <Link href="https://github.com/sonofhypnos/fatebook.el">
              An Emacs plugin to create Fatebook questions
            </Link>
            {" - by @sonofhypnos"}
          </li>
          <li>
            <Link href="https://github.com/Calebp98/alfred-fatebook-workflow">
              An Alfred workflow to create Fatebook questions
            </Link>
            {" - by Caleb Parikh"}
          </li>
        </ul>
        <h3>Use the API to get Fatebook questions by ID</h3>
        <p>
          {
            "You can also use the API to get Fatebook questions by ID, here's an example:"
          }
        </p>

        <p className="bg-neutral-100 outline outline-neutral-300 outline-1 p-2 rounded-md break-words">
          {"https://fatebook.io/api/v0/getQuestion"}
          {"?apiKey="}
          {apiKey.data || "YOUR_API_KEY"}
          <br />
          {"&questionId="}
          <span className="bg-indigo-100 text-indigo-800 font-semibold">
            {"QUESTION_ID"}
          </span>
          <br />
        </p>

        <p>
          {
            "To get the question ID, go to the question page and copy the ID from the URL. The ID is the part after the --, e.g. for this question:"
          }{" "}
          <span className="bg-neutral-100 outline outline-neutral-300 outline-1 p-0.5 rounded-md">
            https://fatebook.io/q/will-adam-win-the-next-aoe-game---clkqtczp00001l008qcrma6s7
          </span>{" "}
          the ID is{" "}
          <span className="bg-neutral-100 outline outline-neutral-300 outline-1 p-0.5 rounded-md">
            {"clkqtczp00001l008qcrma6s7"}
          </span>
          .
        </p>

        <p>
          Click{" "}
          <a
            href={`https://fatebook.io/api/v0/getQuestion?apiKey=${
              apiKey.data || "YOUR_API_KEY"
            }&questionId=clkqtczp00001l008qcrma6s7`}
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>{" "}
          to see an example of the getQuestion endpoint in action.
        </p>
      </div>
      <SwaggerUI url="/api/openapi.json" />
    </div>
  )
}
