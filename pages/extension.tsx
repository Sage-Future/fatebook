import clsx from "clsx"
import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

export default function ExtensionPage() {
  const router = useRouter()
  const justInstalled = router.query.installed
  const [isArc, setIsArc] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsArc(
        !!getComputedStyle(document.documentElement).getPropertyValue(
          "--arc-palette-background",
        ),
      )
    }, 1000)
  }, [])

  return (
    <div className="bg-neutral-50 grow">
      <NextSeo
        title="Fatebook for Chrome"
        titleTemplate="Fatebook for Chrome"
        description="Make and embed Fatebook predictions, anywhere on the web."
      />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
            Fatebook for Chrome
          </h2>
          <h3 className="text-neutral-600">
            Make and embed Fatebook predictions anywhere on the web
          </h3>
          {justInstalled && (
            <div className="prose mb-12">
              <p>{"Thanks for installing Fatebook for Chrome!"}</p>

              <p>
                Try <Link href="https://doc.new">creating a Google Doc</Link>{" "}
                and press{" "}
                <span className="font-semibold whitespace-nowrap">
                  Ctrl+Shift+F
                </span>{" "}
                to make a prediction.
              </p>
              <p>
                Or customise the keyboard shortcut at{" "}
                <span className="font-semibold">
                  chrome://extensions/shortcuts
                </span>
              </p>
              {isArc && (
                <p className="mx-2 bg-indigo-50 p-4">
                  👋 Hey Arc user! We recommend changing the keyboard shortcut
                  to{" "}
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
            </div>
          )}

          <div className="flex mb-20">
            <div className="m-auto">
              <Link href="https://chrome.google.com/webstore/detail/fatebook-for-chrome/bbmkpfopjckjieficoddmcjmlkggillm">
                <button className="inline-flex items-center border border-transparent rounded-md my-4 text-2xl py-4 px-6 shadow-2xl shadow-indigo-500 hover:scale-105 transition-transform bg-white text-black font-semibold hover:bg-white">
                  <>
                    <Image
                      src="/chrome.svg"
                      width={40}
                      height={40}
                      className="m-4"
                      alt=""
                    />
                    <span>Get the Chrome extension</span>
                  </>
                </button>
              </Link>
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

        <DemoVideoDisplay />
      </div>
    </div>
  )
}

function DemoVideoDisplay() {
  const [selectedVideo, setSelectedVideo] = useState({
    src: "/gdocs2x.webm",
    caption: "Instantly create and embed predictions in Google Docs",
  })

  return (
    <div className="flex flex-row gap-4 max-sm:flex-col-reverse">
      <div className="flex flex-col gap-2 my-auto">
        {[
          {
            src: "/gdocs2x.webm",
            caption: "Instantly create and embed predictions in Google Docs",
            text: "...in Google Docs",
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
        ].map((video) => (
          <button
            key={video.src}
            onClick={() => setSelectedVideo(video)}
            className={clsx(
              "btn",
              selectedVideo.src === video.src && "btn-primary",
            )}
          >
            {video.text}
          </button>
        ))}
      </div>
      <div className="md:w-2/3">
        <DemoVideo
          src={selectedVideo.src}
          caption={selectedVideo.caption}
          key={selectedVideo.src}
        />
      </div>
    </div>
  )
}

function DemoVideo({ src, caption }: { src: string; caption: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  return (
    <div
      className={clsx(
        "flex flex-col items-center md:max-w-[80vw] mx-auto relative",
      )}
      ref={ref}
    >
      <h2 className="text-center text-xl font-semibold mb-4 mt-12">
        {caption}
      </h2>
      <video
        muted
        playsInline
        loop
        autoPlay={true}
        controls={false}
        width={992}
        height={576}
        className={clsx("transition-all rounded-lg shadow-2xl")}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
      >
        <source src={src} />
      </video>
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="loading loading-spinner loading-lg translate-y-full opacity-90"></span>
        </div>
      )}
    </div>
  )
}
