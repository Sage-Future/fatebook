/* eslint-disable @typescript-eslint/no-misused-promises */
import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession()

  if (process.env.NODE_ENV === "development") {
    return (
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-gray-900">
                Fatebook
          </h2>
          <h3 className="text-gray-600">Track your predictions, make better decisions</h3>

          <Predict />
          <Questions />

          <div className="py-12"/>

          {sessionStatus === "loading" ? <p>Loading...</p> :
            (
              session ?
                <>
                Signed in as {session.user?.email} <br />
                  <button onClick={() => signOut()}>Sign out</button>
                </> :
                <>
                  Not signed in <br />
                  <button onClick={() => signIn()}>Sign in</button>
                </>
            )
          }

          <p><Link href="/for-slack"><b>Fatebook for Slack</b></Link>: out now.</p>

          <p><b>Fatebook for web</b>: coming soon.</p>

          <p>{"We'd love your feedback at"} <a href="mailto:hello@sage-future.org">hello@sage-future.org</a> or on <Link href="https://discord.gg/mt9YVB8VDE">Discord</Link>.</p>

          <h3 className="text-lg font-semibold mt-12">Check out Sage{"'"}s other tools on <Link href="https://www.quantifiedintuitions.org/">Quantified Intuitions</Link></h3>
        </div>
      </div>
    )
  }

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-gray-900">
              Fatebook
          </h2>
          <h3 className="text-gray-600">Track your predictions, make better decisions</h3>

          <p><Link href="/for-slack"><b>Fatebook for Slack</b></Link>: out now.</p>

          <p><b>Fatebook for web</b>: coming soon.</p>

          <p>{"We'd love your feedback at"} <a href="mailto:hello@sage-future.org">hello@sage-future.org</a> or on <Link href="https://discord.gg/mt9YVB8VDE">Discord</Link>.</p>

          <h3 className="text-lg font-semibold mt-12">Check out Sage{"'"}s other tools on <Link href="https://www.quantifiedintuitions.org/">Quantified Intuitions</Link></h3>
        </div>
      </div>
    )
  }
}