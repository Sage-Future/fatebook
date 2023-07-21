import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { api } from '../lib/web/trpc'
import { signInToFatebook, useUserId } from '../lib/web/utils'

export default function ApiPage() {
  const userId = useUserId()
  const utils = api.useContext()

  const apiKey = api.getApiKey.useQuery()
  const regenerateApiKey = api.regenerateApiKey.useMutation({
    async onSuccess() {
      await utils.getApiKey.invalidate()
    }
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="API" />
      <div className="mx-auto prose">
        <h2>
          Use the API to create Fatebook questions from a URL
        </h2>
        {!userId &&
          <div className="flex w-full p-4">
            <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
              Sign in to set up your API key
            </button>
          </div>}
        {userId &&
          <div className="flex flex-wrap gap-2">
            <label className="label">Your API key</label>
            <input
              className="input"
              type="text"
              value={apiKey.data ?? ""}
              readOnly
              disabled={!apiKey.data || regenerateApiKey.isLoading}
            />
            <button
              className="button primary"
              onClick={() => {
                if (regenerateApiKey.isLoading) return
                if (apiKey.data) {
                  if (confirm("Are you sure you want to regenerate your API key? This will invalidate your old API key.")) {
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
        }
        <p>
          You can use your API key to create Fatebook questions just by going to:
        </p>

        <p className="bg-neutral-200 p-2 rounded-md break-words">
          {"https://fatebook.io/api/v0/createQuestion"}
          {"?apiKey="}{apiKey.data || "YOUR_API_KEY"}
          {"&title="}<span className='bg-neutral-300 font-semibold'>{"YOUR_QUESTION_TITLE"}</span>
          {"&resolveBy="}<span className='bg-neutral-300 font-semibold'>{"RESOLUTION_DATE_YYYY-MM-DD"}</span>
          {"&forecast="}<span className='bg-neutral-300 font-semibold'>{"FORECAST_BETWEEN_0_AND_1"}</span>
        </p>

        <p>
          You can use this to integrate Fatebook with other tools, like iOS shortcuts.
          If you create an integration, let us know and we can tell other Fatebook users about it!
        </p>

        <p>Having trouble? Ask for help in <Link href="https://discord.gg/mt9YVB8VDE" target='_blank'>Discord</Link>.</p>

        <h3>
          Integrations that other Fatebook users have created:
        </h3>
        <ul>
          <li>
            <Link href="https://www.icloud.com/shortcuts/25903acfcd3d4fd5bed31c2f50322928">
              An iOS shortcut to create a Fatebook question
            </Link>
            {" - by @JasperGo. You can add it to your homescreen or use Siri to create a question!"}
          </li>
        </ul>
      </div>
    </div>
  )
}
