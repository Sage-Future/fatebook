import { XMarkIcon } from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { QuestionOrSignIn } from "../../components/QuestionOrSignIn"

export default function QuestionPage() {
  const router = useRouter()
  const { ext } = router.query

  const [showBox, setShowBox] = useState(true)

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        <QuestionOrSignIn alwaysExpand={true} embedded={false} />

        {ext && showBox && (
          <div className="bg-white rounded-xl shadow-sm outline-1 outline  outline-neutral-200 p-4 relative md:w-72 mt-8">
            <button
              className="absolute top-1 right-1"
              onClick={() => setShowBox(false)}
            >
              <XMarkIcon height={12} width={12} />
            </button>
            <h2 className="text-sm font-bold mb-1 mt-0">
              Created with Fatebook for Chrome
            </h2>
            <p className="text-xs mb-2">
              View and create embedded predictions anywhere on the web with the
              Fatebook Chrome extension
            </p>
            <span className="">
              <Link href="/extension">
                <button className="btn">Get the extension</button>
              </Link>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
