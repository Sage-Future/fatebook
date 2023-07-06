/* eslint-disable @typescript-eslint/no-misused-promises */
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"
import { TrackRecord } from "../components/TrackRecord"

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession()

  return (
    <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto lg:w-[650px]">
        {!session?.user?.id && sessionStatus !== "loading" && <>
          <h3 className="text-gray-600">Track your predictions, make better decisions</h3>
        </>}

        <Predict />
        <Questions />

        <div className="py-12"/>

        <p>{"We'd love your feedback at"} <a href="mailto:hello@sage-future.org">hello@sage-future.org</a> or on <Link href="https://discord.gg/mt9YVB8VDE">Discord</Link>.</p>

        <h3 className="text-lg font-semibold mt-12">Check out Sage{"'"}s other tools on <Link href="https://www.quantifiedintuitions.org/">Quantified Intuitions</Link></h3>
      </div>
      <div className="pt-28 lg:w-[320px] max-sm:hidden">
        <TrackRecord />
      </div>
    </div>
  )
}