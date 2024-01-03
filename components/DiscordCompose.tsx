import { useEffect, useState } from "react"

export function DiscordCompose() {
  const animate = true

  return (
    <div className="bg-[#26272A] text-neutral-100 border-neutral-500 border-4 rounded-2xl px-2 select-none">
      <p className="my-4 mx-2 min-h-[62px]">
        <span className="overflow-hidden border-black md:text-lg lg:md:text-xl">
          {animate ? (
            <DiscordComposeContent />
          ) : (
            "/forecast Will we release the podcast by Tuesday?"
          )}
        </span>
      </p>
    </div>
  )
}

function DiscordComposeContent() {
  const [demoStringIndex, setDemoStringIndex] = useState(0)
  const [content, setContent] = useState("")
  const [dirIsRight, setDirIsRight] = useState(true)

  useEffect(() => {
    setTimeout(
      () => {
        const demoStrings = [
          "/forecast Will we release the podcast by Tuesday?",
          "/forecast Will we double our users by March?",
          "/forecast Will GPT-5 be released before 2025?",
          "/forecast Will we move office this year?",
          "/forecast If we share the report publicly, will there be major negative consequences?",
          "/forecast Will AMF be funding-constrained this year?",
        ]
        const str = demoStrings[demoStringIndex]
        setContent(
          dirIsRight
            ? str.slice(0, content.length + 1)
            : str.slice(0, content.length - 1),
        )

        if (dirIsRight && content.length === str.length) {
          setDirIsRight(false)
        }

        if (!dirIsRight && content.length === "/forecast  ".length) {
          setDirIsRight(true)
          setDemoStringIndex((demoStringIndex + 1) % demoStrings.length)
        }
      },
      content.endsWith("?") ? 500 : dirIsRight ? 20 + Math.random() * 20 : 10,
    )
  }, [content, dirIsRight, demoStringIndex])

  return <>{content}</>
}
