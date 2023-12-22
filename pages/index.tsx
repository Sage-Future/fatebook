import { useSession } from "next-auth/react"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"
import { Tournaments } from "../components/Tournaments"
import { TrackRecord } from "../components/TrackRecord"
import { WhyForecastInfo } from '../components/WhyForecastInfo'
import { useUserId } from "../lib/web/utils"
import { UserLists } from "../components/UserLists"

export default function HomePage() {
  const { status: sessionStatus } = useSession()
  const userId = useUserId()

  return (
    <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto lg:w-[650px]">
        {!userId && sessionStatus !== "loading" && <>
          <h3 className="text-neutral-600">Track your predictions, make better decisions</h3>
        </>}

        <Predict />
        <Questions />

        {
          sessionStatus !== "loading" && !userId && <WhyForecastInfo />
        }

      </div>
      <Sidebar />
    </div>
  )
}

function Sidebar() {
  const userId = useUserId()

  // NB: hidden on mobile, stats.tsx is shown instead
  return (
    <div className="pt-28 lg:w-[320px] max-sm:hidden flex flex-col gap-12">
      {userId && <TrackRecord trackRecordUserId={userId} />}
      {userId && <Tournaments />}
      {userId && <UserLists />}
    </div>
  )
}
