export function copyToClipboard(items: { [mimeType: string]: string }) {
  const el = document.createElement("textarea") // Create a <textarea> element

  el.addEventListener("copy", (e: ClipboardEvent) => {
    e.preventDefault()
    if (e.clipboardData) {
      for (const mimeType in items) {
        e.clipboardData.setData(mimeType, items[mimeType])
      }
    }
  })

  el.setAttribute("readonly", "")
  el.style.position = "absolute"
  el.style.left = "-9999px"
  document.body.appendChild(el)
  el.select()
  document.execCommand("copy")
  document.body.removeChild(el)
}
