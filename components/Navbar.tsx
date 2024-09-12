import { Bars3Icon, ScaleIcon } from "@heroicons/react/24/outline"
import { ChevronDownIcon, SparklesIcon } from "@heroicons/react/24/solid"
import clsx from "clsx"
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode } from 'react';
import { toast } from "react-hot-toast"
import { api } from "../lib/web/trpc"
import {
  downloadBlob,
  signInToFatebook,
  useFatebookForChrome,
  useUserId,
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
  const fatebookForChrome = useFatebookForChrome()
  const menuItems = <MenuItems userId={userId ?? null} fatebookForChrome={fatebookForChrome} />

  return (
    <div className="drawer grow">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <NavbarContent
          userId={userId ?? null}
          menuItems={menuItems}
          showCreateAccountButton={showCreateAccountButton}
        />
        {children}
      </div>
      <Drawer />
    </div>
  )
}

function SpecialButton({ url, label }: { url: string; label: ReactNode }) {
  const userId = useUserId()

  return (
    <Link href={url}>
      <button
        className={clsx(
          "btn btn-sm relative max-sm:btn-xs max-sm:w-24 max-sm:h-full ml-2 max-sm:ml-auto mr-2 py-2",
          !userId && "max-sm:hidden",
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

function NavbarContent({ userId, menuItems, showCreateAccountButton }: {
  userId: string | null;
  menuItems: ReactNode;
  showCreateAccountButton: boolean;
}) {
  return (
    <div className="navbar max-w-5xl mx-auto">
      <div className="flex-none lg:hidden">
        <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
          <Bars3Icon height={24} width={24} />
        </label>
      </div>
      <div className="flex-1 -ml-4 flex gap-0">
        <Link href="/" className="btn btn-ghost normal-case text-xl flex gap-2">
          <ScaleIcon className="w-6 h-6 text-indigo-600" />
          Fatebook
        </Link>
        {userId && (
          <SpecialButton
            url="https://sage-future.org/jobs"
            label={<span className="">{"We're hiring!"}</span>}
          />
        )}
      </div>
      <div className="flex-none hidden lg:block">
        <ul className="menu menu-horizontal">{menuItems}</ul>
      </div>
      <div className="">{AccountMenu(showCreateAccountButton)}</div>
    </div>
  )
}

function MenuItems({ userId, fatebookForChrome, isDrawer = false }: {
  userId: string | null;
  fatebookForChrome: ReactNode;
  isDrawer?: boolean;
}) {
  return (
    <>
      {isDrawer ? (
        <>
          <li className="menu-title">Integrations</li>
          <IntegrationsItems fatebookForChrome={fatebookForChrome} />
          <li className="menu-title">Learn</li>
          <LearnItems />
        </>
      ) : (
        <>
          <li>
            <IntegrationsDropdown fatebookForChrome={fatebookForChrome} />
          </li>
          <li>
            <LearnDropdown />
          </li>
        </>
      )}
      <li>
        <Link href="/public">Public predictions</Link>
      </li>
      <li>
        <Link href="/about">About</Link>
      </li>
      {userId && (
        <li className="hidden lg:block">
          <NotificationsPopover />
        </li>
      )}
    </>
  )
}

function IntegrationsDropdown({ fatebookForChrome }: { fatebookForChrome: ReactNode }) {
  return (
    <div className="dropdown dropdown-hover dropdown-bottom dropdown-end">
      <label className="flex gap-1" tabIndex={0}>
        <ChevronDownIcon width={16} /> Integrations
      </label>
      <ul tabIndex={0} className="dropdown-content z-[9999] menu p-2 shadow-lg bg-base-100 rounded-box w-64">
        <IntegrationsItems fatebookForChrome={fatebookForChrome} />
      </ul>
    </div>
  )
}

function IntegrationsItems({ fatebookForChrome }: { fatebookForChrome: ReactNode }) {
  const exportData = useExportData()

  return (
    <>
      <li className="menu-title">Rapid predictions, anywhere</li>
      {fatebookForChrome && <li><Link href="/extension">{fatebookForChrome}</Link></li>}
      <li><Link href="/for-slack">Fatebook for Slack</Link></li>
      <li><Link href="/for-discord">Fatebook for Discord</Link></li>
      <li><Link href="/api-setup">Fatebook API</Link></li>
      <li><Link href="/embed">Embed in your website</Link></li>
      <li className="menu-title">Your prediction data</li>
      <li><Link href="/import-from-prediction-book">Import from PredictionBook</Link></li>
      <li><Link href="/import-from-spreadsheet">Import from spreadsheet</Link></li>
      <li><a onClick={() => !exportData.isLoading && exportData.mutate()}>
        {exportData.isLoading ? "Exporting..." : "Export all your predictions"}
      </a></li>
    </>
  )
}

function LearnDropdown() {
  return (
    <div className="dropdown dropdown-hover dropdown-bottom dropdown-end">
      <label className="flex gap-1" tabIndex={0}>
        <ChevronDownIcon width={16} /> Learn
      </label>
      <ul tabIndex={0} className="dropdown-content z-[9999] menu p-2 shadow-lg bg-base-100 rounded-box w-64">
        <LearnItems />
      </ul>
    </div>
  )
}

function LearnItems() {
  return (
    <>
      <li className="menu-title">Training tools</li>
      <li><Link href="/calibration-training">Calibration training</Link></li>
      <li><Link href="/pastcasting">Pastcasting</Link></li>
      <li><Link href="/estimation-game">The Estimation Game</Link></li>
      <li><Link href="/anki-with-uncertainty">Anki with Uncertainty</Link></li>
      <li className="menu-title">More resources</li>
      <li><Link href="/tips-on-writing-questions">Tips on writing questions</Link></li>
      <li><Link href="/predict-your-year">Predict your year</Link></li>
    </>
  )
}

function Drawer() {
  return (
    <div className="drawer-side z-[9999] mt-16 lg:hidden">
      <label htmlFor="my-drawer" className="drawer-overlay"></label>
      <ul className="menu flex flex-col flex-nowrap p-4 w-80 overflow-auto bg-neutral-100 h-full text-md text-neutral-600 font-semibold">
        <div className="overflow-y-auto flex-shrink pb-8">
          <MenuItems userId={null} fatebookForChrome={null} isDrawer={true} />
        </div>
        <div className="grow" />
        <div className="-m-4 mb-8 z-10">
          <Footer />
        </div>
      </ul>
    </div>
  )
}

function useExportData() {
  return api.question.exportAllQuestions.useMutation({
    onSuccess(data) {
      if (!data || data === "") {
        alert("Nothing to export! Make some forecasts first?")
        return
      }
      downloadBlob(data, "fatebook-forecasts.csv", "text/csv;charset=utf-8;")
    },
  })
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
