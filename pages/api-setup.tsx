import { Disclosure, DisclosurePanel } from "@headlessui/react"
import { ChevronDownIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
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
        description="Use the API to create, get, and resolve Fatebook questions from other applications"
      />
      <div className="mx-auto prose">
        <h2>Fatebook API</h2>
        <p>
          You can use the API to create, get, and resolve Fatebook questions
          from other applications.
        </p>
        <p>
          Get help on using the API in our{" "}
          <Link href="https://discord.gg/mt9YVB8VDE" target="_blank">
            Discord
          </Link>
          . You might also be interested in <Link href="/embed">embedding</Link>{" "}
          Fatebook questions in your own website .
        </p>
        {!userId && (
          <div className="flex w-full p-4">
            <button
              className="btn btn-lg btn-primary mx-auto"
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
                    className="input w-full pr-10 font-mono text-sm"
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
        <div className="not-prose">
          <SwaggerUI url="/api/openapi.json" />
        </div>
        <h3>API Versions</h3>
        <p>
          The latest version of the API is <code>v1</code>. New users should use
          the <code>v1</code> API, which offers improved functionality and
          stability. The <code>v0</code> documentation is preserved here for
          users who have already adopted that version.
        </p>

        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <span>Examples of specific v0 endpoints (legacy)</span>
                <ChevronDownIcon
                  className={clsx(
                    "h-5 w-5 text-gray-500",
                    open && "rotate-180 transform",
                  )}
                />
              </Disclosure.Button>
              <DisclosurePanel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                <b>GET /v0/createQuestion</b>

                <p>
                  You can use your API key to create Fatebook questions just by
                  going this URL (separated onto multiple lines for
                  readability):
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

                <p>
                  You can use this to integrate Fatebook with other tools, like
                  iOS shortcuts. If you create an integration, let us know and
                  we can tell other Fatebook users about it!
                </p>

                <p>
                  Having trouble? Ask for help in{" "}
                  <Link href="https://discord.gg/mt9YVB8VDE" target="_blank">
                    Discord
                  </Link>
                  .
                </p>

                <b>GET /v0/getQuestion</b>
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
              </DisclosurePanel>
            </>
          )}
        </Disclosure>

        <h3>
          Integrations that other Fatebook users have created using the API
        </h3>
        <ul>
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
      </div>
    </div>
  )
}
