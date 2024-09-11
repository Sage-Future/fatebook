import { useSession } from "next-auth/react"
import { Questions } from "../components/Questions"
import { Tournaments } from "../components/Tournaments"
import { TrackRecord } from "../components/TrackRecord"
import { UserLists } from "../components/UserLists"
import { WhyForecastInfo } from "../components/WhyForecastInfo"
import { Predict } from "../components/predict-form/Predict"
import { QuickFeedback } from "../components/ui/QuickFeedback"
import { useUserId } from "../lib/web/utils"
import { OnboardingChecklist } from "../components/OnboardingChecklist"

export default function HomePage() {
  const { status: sessionStatus } = useSession()
  const userId = useUserId()

  return (
    <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 lg:pt-4 mx-auto max-w-6xl">
      <div className="prose mx-auto pt-12 lg:w-[650px]">
        {!userId && sessionStatus !== "loading" && (
          <>
            <h3 className="text-neutral-600">
              Track your predictions, make better decisions
            </h3>
          </>
        )}

        <Predict />
        <Questions />

        {sessionStatus !== "loading" && !userId && <WhyForecastInfo />}
      </div>
      <Sidebar />
    </div>
  )
}

function Sidebar() {
  const userId = useUserId()

  // TODO include a check for userId in this
  const showOnboardingChecklist = false

  // NB: hidden on mobile, stats.tsx is shown instead
  return (
    <div className="max-sm:hidden flex flex-col gap-12 max-w-[400px]">
      {showOnboardingChecklist ? (
        <OnboardingChecklist />
      ) : (
        // Line up the rest of the sidebar below the main <Predict> input
        <div className="h-28" />
      )}
      <div className="max-w-[320px] flex flex-col gap-12 ml-auto lg:w-[320px]">
        {userId && (
          <>
            <TrackRecord trackRecordUserId={userId} />
            <Tournaments />
            <UserLists />
            <QuickFeedback
              type="Fatebook feedback"
              placeholder="Give feedback on Fatebook..."
              style="textarea"
            />
          </>
        )}
      </div>
    </div>
  )
}
