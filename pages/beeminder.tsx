import { NextSeo } from "next-seo"
import { CopyToClipboard } from "../components/ui/CopyToClipboard"
import { signInToFatebook, useUserId } from "../lib/web/utils"

export default function BeeminderPage() {
  const userId = useUserId()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title="Beeminder"
        description="Use Beeminder to track your Fatebook forecasts"
      />
      <div className="mx-auto prose">
        <h2>Fatebook Beeminder integration</h2>
        <p>
          Want to build an ironclad habit of forecasting? Commit to making
          regular forecasts on Fatebook using{" "}
          <a
            href="https://www.beeminder.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Beeminder
          </a>
          &apos;s proven commitment system!
        </p>
        <div className="flex flex-col gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="mt-0 mb-2">How it works</h4>
            <ol className="mt-0 mb-0">
              <li>Copy your Fatebook user ID below</li>
              <li>
                <a
                  href="https://www.beeminder.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create a new goal on Beeminder
                </a>
                , and choose the Fatebook integration
              </li>
              <li>Paste your ID when setting up the goal</li>
              <li>Choose how many forecasts you want to make per week</li>
              <li>Beeminder will help you hit your goal!</li>
            </ol>
          </div>
          <p className="text-sm text-neutral-600">
            Having problems? Join our{" "}
            <a
              href="https://discord.gg/K7V8jGCw9D"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>{" "}
            for support.
          </p>
        </div>
        {!userId && (
          <div className="flex w-full p-4">
            <button
              className="button primary mx-auto"
              onClick={() => void signInToFatebook()}
            >
              Sign in to view your user ID
            </button>
          </div>
        )}
        {userId && (
          <div className="flex flex-col w-full gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="label whitespace-nowrap font-semibold">
                Your user ID
              </label>
              <div className="flex flex-grow gap-2">
                <div className="relative flex-grow">
                  <input
                    className="input w-full pr-10 text-sm font-mono"
                    type="text"
                    value={userId}
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <CopyToClipboard textToCopy={userId} buttonLabel="Copy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
