import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { useBrowser } from "../lib/web/utils"
import { DemoVideoDisplay } from "../components/DemoVideoDisplay"

const demoVideos = [
  {
    src: "/gdocs2x.webm",
    caption: "Instantly create and embed predictions in Google Docs",
    text: "...in Google Docs",
  },
  {
    src: "/meet.webm",
    caption: "Instantly create and embed predictions in Google Meet",
    text: "...in Google Meet",
  },
  {
    src: "/asana2x.webm",
    caption: "Instantly create and embed predictions in your todo list",
    text: "...in your todo list",
  },
  {
    src: "/notion2x.webm",
    caption: "Instantly create and embed predictions in Notion",
    text: "...in Notion",
  },
  {
    src: "/twitter2x.webm",
    caption:
      "Instantly create and embed predictions anywhere on the web",
    text: "...and anywhere else on the web",
  },
]
export default function ExtensionPage() {
  const router = useRouter()
  const justInstalled = router.query.installed
  const browser = useBrowser()
  return (
    <div className="bg-neutral-50 grow">
      <NextSeo
        title={`Fatebook for ${browser}`}
        titleTemplate={`Fatebook for ${browser}`}
        description="Make and embed Fatebook predictions, anywhere on the web."
      />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          {justInstalled && (
            <div className="prose mb-12 mx-2 bg-indigo-50 p-4 rounded-xl">
              <p>{`👋 Thanks for installing Fatebook for ${browser}!`}</p>

              {browser === "Firefox" && (
                <p>
                  <b>
                    To finish installing, click the jigsaw button, click on
                    Fatebook for {browser}, and accept additional permissions.
                  </b>
                </p>
              )}

              <p>
                Try <Link href="https://doc.new">creating a Google Doc</Link>{" "}
                and press{" "}
                <span className="font-semibold whitespace-nowrap">
                  Ctrl+Shift+F
                </span>{" "}
                to make a prediction.
              </p>
              {browser === "Firefox" ? (
                <p>
                  You can customise the keyboard shortcut by following{" "}
                  <Link href="https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox">
                    these instructions
                  </Link>
                </p>
              ) : (
                <p>
                  You can customise the keyboard shortcut at{" "}
                  <span className="font-semibold">
                    chrome://extensions/shortcuts
                  </span>
                </p>
              )}
              {browser === "Arc" && (
                <p className="bg-indigo-50 pt-4">
                  {
                    "😎 Hello Arc user! We recommend changing the keyboard shortcut to "
                  }
                  <span className="font-semibold whitespace-nowrap">
                    Cmd-Shift-F
                  </span>{" "}
                  - the default{" "}
                  <span className="font-semibold whitespace-nowrap">
                    Ctrl+Shift+F
                  </span>{" "}
                  {"doesn't"} work in Google Docs on Arc.
                </p>
              )}
              {browser === "Brave" && (
                <div>
                  <h2>Final install step </h2>
                  <p className="bg-indigo-50">
                    {
                      "Brave blocks the cookies that this extension uses to find out if you're logged in to Fatebook. To disable Brave's cookie blocking, you can go to "
                    }
                    <span className="font-semibold">
                      brave://settings/cookies
                    </span>
                    {' and select "Allow third party cookies".'}
                  </p>
                  <p>
                    Alternatively for a more fine-grained way, you can allow
                    cookies on certain sites (e.g. doc.google.com) via{" "}
                    <span className="font-semibold">
                      brave://settings/cookies
                    </span>
                    , and then you can use the extension on only those websites.
                  </p>
                </div>
              )}
            </div>
          )}

          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
            Fatebook for {browser}
          </h2>
          <h3 className="text-neutral-600">
            Make and embed Fatebook predictions anywhere on the web
          </h3>

          <div className="flex mb-20">
            <div className="m-auto">
              <Link
                href={
                  browser === "Firefox"
                    ? "https://addons.mozilla.org/en-US/firefox/addon/fatebook-for-firefox/"
                    : "https://chrome.google.com/webstore/detail/fatebook-for-chrome/bbmkpfopjckjieficoddmcjmlkggillm"
                }
              >
                <button className="inline-flex items-center border border-transparent rounded-md my-4 text-2xl py-4 px-6 shadow-2xl shadow-indigo-500 hover:scale-105 transition-transform bg-white text-black font-semibold hover:bg-white">
                  <>
                    {browser === "Firefox" ? (
                      <Image
                        src="/firefox.svg"
                        width={40}
                        height={40}
                        className="m-4"
                        alt=""
                      />
                    ) : (
                      <Image
                        src="/chrome.svg"
                        width={40}
                        height={40}
                        className="m-4"
                        alt=""
                      />
                    )}
                    <span>Get the {browser} extension</span>
                  </>
                </button>
              </Link>
              <p className="text-sm text-center text-neutral-400 mt-4">
                Also available for{" "}
                {browser === "Firefox" ? (
                  <Link
                    href="https://chrome.google.com/webstore/detail/fatebook-for-chrome/bbmkpfopjckjieficoddmcjmlkggillm"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Chrome
                  </Link>
                ) : (
                  <Link
                    href="https://addons.mozilla.org/en-US/firefox/addon/fatebook-for-firefox/"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Firefox
                  </Link>
                )}
              </p>
            </div>
          </div>

          <div className="my-14 mx-auto" suppressHydrationWarning={true}>
            <div
              className="text-center text-xl"
              suppressHydrationWarning={true}
            >
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>
                ctrl
              </span>
              <span>{"+"}</span>
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>
                shift
              </span>
              <span>{"+"}</span>
              <span className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>
                F
              </span>
            </div>
          </div>
        </div>

        <DemoVideoDisplay videos={demoVideos} />
      </div>
    </div>
  )
}


