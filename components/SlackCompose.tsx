import Image from "next/image"
import { useEffect, useState } from "react"

export function SlackCompose() {
  const animate = true

  return (
    <div className="bg-white border-neutral-200 border-4 rounded-2xl px-2 select-none">
      <p className="my-4 mx-2 min-h-[62px]">
        <span className="overflow-hidden border-black md:text-lg lg:md:text-xl">
          {animate ? <SlackComposeContent /> : "/forecast Will we release the podcast by Tuesday?"}
        </span>
      </p>
      <div className="flex flex-row justify-between">
        <Image src="/slack_controls_left.png" width={240} height={28.5714285714} className="mb-2 mt-0" alt="" />
        <Image src="/slack_controls_right.png" width={50} height={28.57} className="mb-2 mt-0" alt="" />
      </div>
    </div>
  )
}

function SlackComposeContent() {
  const [demoStringIndex, setDemoStringIndex] = useState(0)
  const [content, setContent] = useState("")
  const [dirIsRight, setDirIsRight] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      const demoStrings = [
        "/forecast Will we release the podcast by Tuesday?",
        "/forecast Will we double our users by March?",
        "/forecast Will GPT-5 be released before 2025?",
        "/forecast Will we move office this year?",
        "/forecast If we share the report publicly, will there be major negative consequences?",
        "/forecast Will AMF be funding-constrained this year?",
      ]
      const str = demoStrings[demoStringIndex]
      setContent(dirIsRight ? str.slice(0, content.length + 1) : str.slice(0, content.length - 1))

      if (dirIsRight && content.length === str.length) {
        setDirIsRight(false)
      }

      if (!dirIsRight && content.length === "/forecast  ".length) {
        setDirIsRight(true)
        setDemoStringIndex((demoStringIndex + 1) % demoStrings.length)
      }
    }, content.endsWith("?") ? 500 : (dirIsRight ? (20 + (Math.random() * 20)) : 10))
  }, [content, dirIsRight, demoStringIndex])

  return (
    <>{content}</>
  )
}