// this code will be executed after page load
; (function () {

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.action === "open_modal") {
      openModal();
    } else {
      throw new Error(`unknown action "${request.action}"`)
    }
  });

  const iframe = document.createElement('iframe')
  iframe.className = 'fatebook-predict-embed'
  iframe.src = 'http://localhost:3000/embed/predict-modal'
  iframe.style.display = 'none'
  document.body.appendChild(iframe);

  function openModal() {
    iframe.style.display = 'block'
    iframe.focus()
    iframe.contentWindow?.postMessage({ isFatebook: true, action: 'focus' }, '*')

    window.addEventListener('message', (event) => {
      if (typeof event.data === 'object' && event.data.isFatebook) {
        iframe.style.display = 'none'
      }
    })
  }

  // openModal()



  let commentParent
  const intervalComments = setInterval(() => {
    commentParent = document.querySelector(".docos-stream-view")
    if (!commentParent) return
    else {
      clearInterval(intervalComments)

      // Options for the observer (which mutations to observe)
      const config = { attributes: true, childList: true, subtree: true }

      // Callback function to execute when mutations are observed
      const callback = (mutationList, observer) => {
        const comments = commentParent.querySelectorAll(".docos-replyview-body")

        for (const comment of comments) {
          const link = comment.querySelector("a")
          if (!link) continue

          const ourLink = link.href.includes("example.com")

          const ui = comment.querySelector("#fatebook-ui")
          const uiIsInjected = !!ui

          if (uiIsInjected && !ourLink) {
            console.log("remove")
            ui.remove()
          } else if (!uiIsInjected && ourLink) {
            console.log("append")

            const div = document.createElement("iframe")
            div.id = "fatebook-ui"
            div.src = "https://fatebook.io/"
            div.style.zoom = ".1"
            div.style.width = "100%"
            div.style.height = "2000px"

            comment.appendChild(div)
          }
        }
      }

      // Create an observer instance linked to the callback function
      const observer = new MutationObserver(callback)
      observer.observe(commentParent, config)
    }
  }, 1000)

  let popupParent
  const intervalPopup = setInterval(() => {
    popupParent = document.querySelector(".docs-linkbubble-bubble")
    if (!popupParent) return
    else {
      clearInterval(intervalPopup)

      // Options for the observer (which mutations to observe)
      const config = { attributes: true, childList: true, subtree: true }

      // Callback function to execute when mutations are observed
      const callback = (mutationList, observer) => {
        const href = popupParent.querySelector("a").href
        const ourLink = href.includes("example.com")

        const ui = popupParent.querySelector("#fatebook-ui")
        const uiIsInjected = !!ui

        if (uiIsInjected && !ourLink) {
          console.log("remove")
          ui.remove()
        } else if (!uiIsInjected && ourLink) {
          console.log("append")
          const div = document.createElement("iframe")
          div.id = "fatebook-ui"
          div.src = "https://fatebook.io/"
          div.style.zoom = ".1"
          div.style.width = "100%"
          div.style.height = "2000px"

          popupParent.appendChild(div)
        }
      }

      // Create an observer instance linked to the callback function
      const observer = new MutationObserver(callback)
      observer.observe(popupParent, config)
    }
  }, 1000)

  let commentTray
  const commentTrayInterval = setInterval(() => {
    commentTray = document.querySelector(".docs-instant-docos-content")
    if (!commentTray) return
    else {
      clearInterval(commentTrayInterval)

      const div = document.createElement("div")
      div.innerText = "ADD PREDICTION"



      commentTray.appendChild(div)

      // // Options for the observer (which mutations to observe)
      // const config = { attributes: true, childList: true, subtree: true }

      // // Callback function to execute when mutations are observed
      // const callback = (mutationList, observer) => {
      //    const href = popupParent.querySelector("a").href
      //    const ourLink = href.includes("example.com")

      //    const ui = popupParent.querySelector("#fatebook-ui")
      //    const uiIsInjected = !!ui

      //    if (uiIsInjected && !ourLink) {
      //       console.log("remove")
      //       ui.remove()
      //    } else if (!uiIsInjected && ourLink) {
      //       console.log("append")
      //       const div = document.createElement("iframe")
      //       div.id = "fatebook-ui"
      //       div.src = "https://fatebook.io/"
      //       div.style.zoom = ".1"
      //       div.style.width = "100%"
      //       div.style.height = "2000px"

      //       popupParent.appendChild(div)
      //    }
      // }

      // // Create an observer instance linked to the callback function
      // const observer = new MutationObserver(callback)
      // observer.observe(popupParent, config)
    }
  }, 1000)
})()
