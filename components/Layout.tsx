import { ReactNode } from "react"
import Footer from "./Footer"
import { Navbar } from "./Navbar"

export function Layout({
  children,
}: {
  children: ReactNode,
}) {
  return (
    <>
      <div className="flex flex-col min-h-screen ">
        <Navbar />
        <main className="bg-gray-50 grow pb-8 lg:pb-12">
          {children}
        </main>
        <Footer />
      </div >
    </>
  )
}