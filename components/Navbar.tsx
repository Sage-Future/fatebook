import { Bars3Icon, ScaleIcon } from "@heroicons/react/24/outline"
import { ChevronDownIcon, SparklesIcon } from "@heroicons/react/24/solid"
import clsx from "clsx"
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode } from "react"
import { toast } from "react-hot-toast"
import { api } from "../lib/web/trpc"
import {
  downloadBlob,
  signInToFatebook,
  useFatebookForChrome,
  useUserId,
  webFeedbackUrl,
} from "../lib/web/utils"
import Footer from "./Footer"
import NotificationsPopover from "./NotificationsPopover"

export function Navbar({
  // eslint-disable-next-line no-unused-vars
  showForSlackButton = true,
  showCreateAccountButton = true,
  children,
}: {
  showForSlackButton?: boolean
  showCreateAccountButton?: boolean
  children: ReactNode
}) {
  const userId = useUserId()
  const exportData = api.question.exportAllQuestions.useMutation({
    onSuccess(data) {
      if (!data || data === "") {
        alert("Nothing to export! Make some forecasts first?")
        return
      }
      downloadBlob(data, "fatebook-forecasts.csv", "text/csv;charset=utf-8;")
    },
  })

  const fatebookForChrome = useFatebookForChrome()

  const moreMenuItems = (
    <>
      <li>
        <Link href="/about">About</Link>
      </li>
      <li>
        <Link href="/public">Public predictions</Link>
      </li>
      <li>
        <Link href="https://discord.gg/mt9YVB8VDE">Discord</Link>
      </li>
      <li>
        <Link href="/predict-your-year">Predict your year</Link>
      </li>
      <li className="text-gray-500 font-normal md:font-semibold ml-4 mt-4 mb-2 cursor-default">
        Integrations
      </li>
      <li>
        <Link href="/extension">{fatebookForChrome}</Link>
      </li>
      <li>
        <Link href="/for-slack">Fatebook for Slack</Link>
      </li>
      <li>
        <Link href="/for-discord">Fatebook for Discord</Link>
      </li>
      <li>
        <Link href="/api-setup">
          Create forecasts by API <NewDot />
        </Link>
      </li>
      <li>
        <Link href="/embed">Embed in your website</Link>
      </li>
      <li className="text-gray-500 font-normal md:font-semibold pl-4 pt-4 pb-2 cursor-default">
        Your forecasts
      </li>
      <li>
        <Link href="/import-from-prediction-book">
          Import from PredictionBook
        </Link>
      </li>
      <li>
        <Link href="/import-from-spreadsheet">Import from spreadsheet</Link>
      </li>
      <li>
        <a onClick={() => !exportData.isLoading && exportData.mutate()}>
          {exportData.isLoading ? "Exporting..." : "Export all your forecasts"}
        </a>
      </li>
      <li className="text-gray-500 font-normal md:font-semibold ml-4 mt-4 mb-2 cursor-default">
        Feedback
      </li>
      <li>
        <Link href={webFeedbackUrl}>Submit feedback</Link>
      </li>
      <li>
        <Link href={"/impact-survey"}>Take the impact survey</Link>
      </li>
      <li>
        <Link href={"https://forms.gle/TvG4AShfEBoGogEF9"}>
          Report a problem
        </Link>
      </li>
    </>
  )

  const menuItems = (
    <>
      {/* {showForSlackButton && ( */}
      <li>
        <Link href="/extension">{fatebookForChrome}</Link>
      </li>
      {/* )} */}
      <li>
        <Link href="https://quantifiedintuitions.org">
          Quantified Intuitions
        </Link>
      </li>
      <li className="hidden lg:block">
        <div className="dropdown dropdown-hover dropdown-bottom dropdown-end active:bg-neutral-200 active:text-black">
          <label className="flex gap-1" tabIndex={0}>
            <ChevronDownIcon width={16} /> More <NewDot />
            <div className="div my-auto ml-0.5"></div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[9999] menu p-2 shadow-lg bg-base-100 rounded-box w-64"
            onClick={() => {
              ;(document.activeElement as HTMLElement)?.blur()
            }}
          >
            {moreMenuItems}
          </ul>
        </div>
      </li>
      {userId && (
        <li className="hidden lg:block">
          <NotificationsPopover />
        </li>
      )}
    </>
  )

  return (
    <div className="drawer grow">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="navbar max-w-5xl mx-auto">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
              <Bars3Icon height={24} width={24} />
            </label>
          </div>
          <div className="flex-1 -ml-4 flex gap-0">
            <Link
              href="/"
              className="btn btn-ghost normal-case text-xl flex gap-2"
            >
              <ScaleIcon className="w-6 h-6 text-indigo-600" />
              Fatebook
            </Link>
            {/* {userId && (
              <SpecialButton
                url="/extension"
                label={<span className="">{"Get the"}</span>}
              />
            )} */}
          </div>
          <div className="flex-none hidden lg:block">
            <ul className="menu menu-horizontal">{menuItems}</ul>
          </div>
          <div className="">{AccountMenu(showCreateAccountButton)}</div>
        </div>
        {children}
      </div>

      <Drawer menuItems={menuItems} moreMenuItems={moreMenuItems} />
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
function SpecialButton({ url, label }: { url: string; label: ReactNode }) {
  const userId = useUserId()

  return (
    <Link href={url}>
      <button
        className={clsx(
          "btn btn-sm relative max-sm:btn-xs max-sm:w-24 max-sm:h-full ml-2 max-sm:ml-auto mr-2 py-2",
          !userId && "max-sm:hidden", // not enough space otherwise
        )}
      >
        {label}
        <div className="absolute -top-2 -right-2">
          <SparklesIcon className="w-5 h-5 text-indigo-500 opacity-60 animate-pulse" />
        </div>
      </button>
    </Link>
  )
}

function Drawer({
  menuItems,
  moreMenuItems,
}: {
  menuItems: ReactNode
  moreMenuItems: ReactNode
}) {
  return (
    <div className="drawer-side z-[9999] mt-16 lg:hidden">
      <label htmlFor="my-drawer" className="drawer-overlay"></label>
      <ul className="menu flex flex-col flex-nowrap p-4 w-80 overflow-auto bg-neutral-100 h-full text-md text-neutral-600 font-semibold">
        <div className="overflow-y-auto flex-shrink pb-8">
          {menuItems}
          <div className="divider" />
          {moreMenuItems}
        </div>
        <div className="grow" />
        <div className="-m-4 mb-8 z-10">
          <Footer />
        </div>
      </ul>
    </div>
  )
}

function AccountMenu(showCreateAccountButton: boolean) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    imageUrl: session?.user?.image ?? "/default_avatar.png",
  }

  const editName = api.editName.useMutation()

  // loading skeleton
  if (status === "loading") {
    return (
      <details className="dropdown dropdown-end">
        <summary
          tabIndex={0}
          className="btn btn-ghost btn-circle avatar hover:bg-opacity-0 hover:scale-[1.03]"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-500 opacity-50" />
        </summary>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content mt-1 p-2 shadow bg-base-100 rounded-box w-52"
        >
          <li className="px-3 py-2 text-neutral-500 select-none">Loading...</li>
        </ul>
      </details>
    )
  }

  return user.email ? (
    <details className="dropdown dropdown-end z-[9999]">
      <summary
        tabIndex={0}
        className="btn btn-ghost btn-circle avatar hover:bg-opacity-0 hover:scale-[1.03]"
      >
        <div className="w-10 rounded-full">
          <Image src={user.imageUrl} width={40} height={40} alt={user.name} />
        </div>
      </summary>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-1 p-2 shadow bg-base-100 rounded-box w-64"
      >
        <li className="px-3 py-2 text-neutral-500 select-none break-all">
          Signed in as {user.email}
        </li>
        <li
          onClick={() => {
            const newName = prompt("Enter your new username:", user.name)
            if (newName) {
              editName.mutate({ newName })
              router.reload()
            }
          }}
        >
          <a>Change your username</a>
        </li>
        <li
          onClick={() => {
            const newImage = prompt(
              "Enter the URL of your new profile picture. You can upload it to a site like imgur.com.",
              user.imageUrl,
            )
            if (newImage) {
              editName.mutate({ newImage })
              toast.success(
                "Profile picture updated! Sign in again to see the change.",
              )
              setTimeout(() => {
                void signOut()
              }, 2000)
            }
          }}
        >
          <a>Change your profile picture</a>
        </li>
        <li onClick={() => void signOut({ redirect: true })}>
          <a>Logout</a>
        </li>
      </ul>
    </details>
  ) : (
    showCreateAccountButton && (
      <button className="btn" onClick={() => void signInToFatebook()}>
        Log in or sign up
      </button>
    )
  )
}

// eslint-disable-next-line no-unused-vars
function NewDot() {
  return <div className="w-2 h-2 ml-0.5 my-auto bg-indigo-400 rounded-full" />
}
