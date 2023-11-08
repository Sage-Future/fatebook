import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export default function ExtensionPage() {
  const router = useRouter()
  const justInstalled = router.query.installed
  const [isArc, setIsArc] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsArc(!!getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-background'))
    }, 1000)
  }, [])

  return (
    <div className="bg-neutral-50 grow">
      <NextSeo title="Fatebook Chrome extension" titleTemplate="Fatebook Chrome extension" />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
              Fatebook Chrome extension
          </h2>
          <h3 className="text-neutral-600">Make and embed Fatebook predictions anywhere on the web</h3>
          {justInstalled && (
            <div className="prose">
              <p>
                {"Thanks for installing Fatebook for Chrome!"}
              </p>

              <p>
                Try <Link href="https://doc.new">creating a Google Doc</Link> and press <span className="font-semibold whitespace-nowrap">
                  Ctrl-Shift-F
                </span> to make a prediction.
              </p>
              <p>
                Or customise the keyboard shortcut at <span className="font-semibold">
                  chrome://extensions/shortcuts
                </span>
              </p>
              {isArc && <p className="mx-2 bg-indigo-50 p-4">
                👋 Hey Arc user! We recommend changing the keyboard shortcut to <span className="font-semibold whitespace-nowrap">
                  Cmd-Shift-F
                </span> - the default <span className="font-semibold whitespace-nowrap">
                  Ctrl-Shift-F
                </span> {"doesn't"} work in Google Docs on Arc.
              </p>}
            </div>
          )}

          <div className="my-14 mx-auto" suppressHydrationWarning={true}>
            <div className="text-center text-xl" suppressHydrationWarning={true}>
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>ctrl</span>
              <span>{"+"}</span>
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>shift</span>
              <span>{"+"}</span>
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>F</span>
            </div>

            <video autoPlay muted loop controls={false} className="shadow-xl">
              <source src="/extension_demo.webm" />
            </video>
          </div>

          <div className="flex mb-20">
            <div className="m-auto">
            <Link href="https://fatebook.io">
              <button className="inline-flex items-center border border-transparent rounded-md my-4 text-2xl py-4 px-6 shadow-2xl shadow-indigo-500 hover:scale-105 transition-transform bg-white text-black font-semibold hover:bg-white">
                <>
                  <Image src="/chrome.svg" width={40} height={40} className="m-4" alt="" />
                  <span>Get the Chrome extension</span>
                </>
              </button>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}