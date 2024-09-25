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
import { PredictProvider } from "../components/predict-form/PredictProvider"

export default function HomePage() {
  const { status: sessionStatus } = useSession()
  const userId = useUserId()

  return (
    <div className="max-md:flex-col gap-8 lg:gap-12 flex justify-center px-4 lg:pt-4 mx-auto max-w-6xl">
      <PredictProvider>
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
      </PredictProvider>
    </div>
  )
}

function Sidebar() {
  const userId = useUserId()

  // NB: hidden on mobile, stats.tsx is shown instead
  return (
    <div className="max-md:hidden flex flex-col gap-12 max-w-[400px]">
      <div className="min-h-28">{userId && <OnboardingChecklist />}</div>
      <div className="max-w-[320px] flex flex-col gap-12 ml-auto lg:w-[320px]">
        {userId && <TrackRecord trackRecordUserId={userId} />}
        {userId && <Tournaments />}
        {userId && <UserLists />}
        {userId && (
          <QuickFeedback
            type="Fatebook feedback"
            placeholder="Give feedback on Fatebook..."
            style="textarea"
          />
        )}
      </div>
    </div>
  )
}
