import { QuestionOrSignIn } from "../../components/QuestionOrSignIn"

export default function QuestionPage() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        <QuestionOrSignIn />
      </div>
    </div>
  )
}