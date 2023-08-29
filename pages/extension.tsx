import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"

export default function ExtensionPage() {
  const isOnMac = typeof window !== 'undefined' && window.navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="bg-neutral-50 grow">
      <NextSeo title="Fatebook Chrome extension" titleTemplate="Fatebook Chrome extension" />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
              Fatebook Chrome extension
          </h2>
          <h3 className="text-neutral-600">Make and embed Fatebook predictions anywhere on the web</h3>

          <div className="my-14 mx-auto">
            <div className="text-center text-xl">
              <kbd className="kbd kbd-lg mx-1" suppressHydrationWarning={true}>
                {
                 isOnMac ? "cmd" : "ctrl"
                }
              </kbd>
              +
              <kbd className="kbd kbd-lg mx-1">shift</kbd>
              +
              <kbd className="kbd kbd-lg mx-1">F</kbd>
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