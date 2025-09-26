export async function copyToClipboard(items: { [mimeType: string]: string }) {
  // Try modern API first, but only with supported MIME types
  if (navigator.clipboard && navigator.clipboard.write) {
    try {
      // Filter to only supported MIME types
      const supportedItems = Object.fromEntries(
        Object.entries(items).filter(([mimeType]) =>
          ["text/plain", "text/html", "image/png"].includes(mimeType),
        ),
      )

      if (Object.keys(supportedItems).length > 0) {
        const clipboardItem = new ClipboardItem(
          Object.fromEntries(
            Object.entries(supportedItems).map(([mimeType, data]) => [
              mimeType,
              new Blob([data], { type: mimeType }),
            ]),
          ),
        )
        await navigator.clipboard.write([clipboardItem])

        // If we have unsupported MIME types, log a warning
        const unsupportedTypes = Object.keys(items).filter(
          (mimeType) =>
            !["text/plain", "text/html", "image/png"].includes(mimeType),
        )
        if (unsupportedTypes.length > 0) {
          console.warn(
            `Skipped unsupported MIME types: ${unsupportedTypes.join(", ")}`,
          )
        }
        return
      }
    } catch (error) {
      console.warn(
        "Modern clipboard API failed, falling back to legacy method",
        error,
      )
    }
  }

  // Fallback to legacy implementation
  const el = document.createElement("textarea") // Create a <textarea> element

  el.addEventListener("copy", (e: ClipboardEvent) => {
    e.preventDefault()
    if (e.clipboardData) {
      Object.entries(items).map(([mimeType, data]) => {
        e.clipboardData!.setData(mimeType, data)
      })
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
