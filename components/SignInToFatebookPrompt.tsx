import { signInToFatebook } from "../lib/web/utils";

export default function SignInToFatebookPrompt() {
  
  return (
    <div className="text-center">
      <button
        className="button primary mx-auto"
        onClick={() => void signInToFatebook()}
      >
        Sign in to see all questions and add your own predictions
      </button>
    </div>
  )
}