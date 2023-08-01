import { Bars3Icon, ScaleIcon } from "@heroicons/react/24/outline"
import { ChevronDownIcon } from "@heroicons/react/24/solid"
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode } from "react"
import { api } from "../lib/web/trpc"
import { downloadBlob, signInToFatebook, webFeedbackUrl } from '../lib/web/utils'
import Footer from "./Footer"

export function Navbar({
  showForSlackButton = true,
  showCreateAccountButton = true,
  children,
}: {
  showForSlackButton?: boolean
  showCreateAccountButton?: boolean
  children: ReactNode
}) {
  const exportData = api.question.exportAllQuestions.useMutation({
    onSuccess(data) {
      if (!data || data === "") {
        alert("Nothing to export! Make some forecasts first?")
        return
      }
      downloadBlob(data, "fatebook-forecasts.csv", "text/csv;charset=utf-8;")
    }
  })

  const moreMenuItems = <>
    <li><Link href="/about">About</Link></li>
    <li><Link href="https://discord.gg/mt9YVB8VDE">Discord</Link></li>
    <li className="text-gray-500 font-normal md:font-semibold ml-4 mt-4 mb-2 cursor-default">Integrations</li>
    <li><Link href="/for-discord">Fatebook for Discord <NewDot /> </Link></li>
    <li><Link href="/api-setup">Create forecasts by API</Link></li>
    <li className="text-gray-500 font-normal md:font-semibold pl-4 pt-4 pb-2 cursor-default">Your forecasts</li>
    <li><Link href="/import-from-prediction-book">Import from PredictionBook</Link></li>
    <li><Link href="/import-from-spreadsheet">Import from spreadsheet <NewDot /></Link></li>
    <li><a onClick={() => !exportData.isLoading && exportData.mutate()}>
      {exportData.isLoading ? "Exporting..." : "Export all your forecasts"}
    </a></li>
    <li className="text-gray-500 font-normal md:font-semibold ml-4 mt-4 mb-2 cursor-default">Feedback</li>
    <li><Link href={webFeedbackUrl}>Submit feedback</Link></li>
    <li><Link href={webFeedbackUrl}>Report a problem</Link></li>
  </>

  const menuItems = <>
    {showForSlackButton && <li><Link href="/for-slack">Fatebook for Slack</Link></li>}
    <li><Link href="https://quantifiedintuitions.org">Quantified Intuitions</Link></li>
    <li className="hidden lg:block">
      <div className="dropdown dropdown-hover dropdown-bottom dropdown-end active:bg-neutral-200 active:text-black">
        <label className="flex gap-1" tabIndex={0}><ChevronDownIcon width={16} /> More <div className="div my-auto ml-0.5"><NewDot /></div></label>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 ">
          {moreMenuItems}
        </ul>
      </div>
    </li>
  </>

  return (
    <div className="drawer grow">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="navbar max-w-5xl mx-auto gap-4">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
              <Bars3Icon height={24} width={24} />
            </label>
          </div>
          <div className="flex-1 -ml-4">
            <Link href="/" className="btn btn-ghost normal-case text-xl flex gap-2">
              <ScaleIcon className="w-6 h-6 text-indigo-600" />
              Fatebook
            </Link>
          </div>
          <div className="flex-none hidden lg:block">
            <ul className="menu menu-horizontal">
              {menuItems}
            </ul>
          </div>
          <div className="flex-none">
            {AccountMenu(showCreateAccountButton)
            }
          </div>
        </div>
        {children}
      </div>

      <Drawer menuItems={menuItems} moreMenuItems={moreMenuItems} />
    </div>
  )
}

function Drawer({menuItems, moreMenuItems}: {menuItems: ReactNode, moreMenuItems: ReactNode}) {
  return <div className="drawer-side z-[200] mt-16 lg:hidden">
    <label htmlFor="my-drawer" className="drawer-overlay"></label>
    <ul className="menu flex flex-col flex-nowrap p-4 w-80 overflow-auto bg-neutral-100 h-full text-md text-neutral-600 font-semibold">
      <div className="overflow-y-scroll flex-shrink pb-8">
        {menuItems}
        <div className="divider" />
        {moreMenuItems}
      </div>
      <div className="grow"/>
      <div className="-m-4 mb-8 z-10">
        <Footer />
      </div>
    </ul>
  </div>
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
    return <details className="dropdown dropdown-end">
      <summary tabIndex={0} className="btn btn-ghost btn-circle avatar hover:bg-opacity-0 hover:scale-[1.03]">
        <div className="w-10 h-10 rounded-full bg-neutral-500 opacity-50" />
      </summary>
      <ul tabIndex={0} className="menu menu-sm dropdown-content mt-1 p-2 shadow bg-base-100 rounded-box w-52">
        <li className="px-3 py-2 text-neutral-500 select-none">Loading...</li>
      </ul>
    </details>
  }

  return user.email ?
    <details className="dropdown dropdown-end z-50">
      <summary tabIndex={0} className="btn btn-ghost btn-circle avatar hover:bg-opacity-0 hover:scale-[1.03]">
        <div className="w-10 rounded-full">
          <Image src={user.imageUrl} width={40} height={40} alt={user.name} />
        </div>
      </summary>
      <ul tabIndex={0} className="menu menu-sm dropdown-content mt-1 p-2 shadow bg-base-100 rounded-box w-52">
        <li className="px-3 py-2 text-neutral-500 select-none break-all">Signed in as {user.email}</li>
        <li
          onClick={() => {
            const newName = prompt("Enter your new username:", user.name)
            if (newName) {
              editName.mutate({ newName })
              router.reload()
            }
          }}><a>Change your username</a></li>
        <li onClick={() => void signOut({ redirect: true })}><a>Logout</a></li>
      </ul>
    </details>
    :
    showCreateAccountButton &&
    <button className="btn normal-case" onClick={() => void signInToFatebook()}>Log in or sign up</button>
}

function NewDot() {
  return <div className="w-2 h-2 bg-indigo-400 rounded-full" />
}