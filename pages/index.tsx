import { useSession } from "next-auth/react"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"
import { Tournaments } from "../components/Tournaments"
import { TrackRecord } from "../components/TrackRecord"
import { UserLists } from "../components/UserLists"
import { WhyForecastInfo } from "../components/WhyForecastInfo"
import { QuickFeedback } from "../components/ui/QuickFeedback"
import { useUserId } from "../lib/web/utils"
import { DemoVideoDisplay } from "../components/DemoVideoDisplay"

const demoVideos = [
  {
    src: "/for_personal_goals.webm",
    text: "...For personal goals",
  },
  {
    src: "/for_project_planning.webm",
    text: "...For project planning",
  },
  {
    src: "/for_research.webm",
    text: "...For research",
  },
  {
    src: "/for_teams.webm",
    text: "...For teams",
  },
]

export default function HomePage() {
  const { status: sessionStatus } = useSession()
  const userId = useUserId()

  return (
    <>
      <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
        <div className="prose mx-auto lg:w-[650px]">
          {!userId && sessionStatus !== "loading" && (
            <>
              <h3 className="text-neutral-600">
                Track your predictions, make better decisions
              </h3>
            </>
          )}

          <Predict />
          <Questions />

          {sessionStatus !== "loading" && !userId &&
            <div>
              <WhyForecastInfo />
              <DemoVideoDisplay videos={demoVideos} />
            </div>
          }
        </div>
      </div>
      <Sidebar />
    </>
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
      {userId && <QuickFeedback
        type="Fatebook feedback"
        placeholder="Give feedback on Fatebook..."
        style="textarea"
      />}
    </div>
  )
}
