; (async function () {
  // ==== Get extension info ====
  const extensionInfo = await new Promise((resolve) => {
    const channel = chrome.runtime.connect()
    channel.onMessage.addListener((data) => {
      if (typeof data === 'object' && data.isFatebook && data.action === 'init_script') {
        resolve(data)
      }
    })
  })

  const FATEBOOK_URL = extensionInfo.isDev ? 'https://localhost:3000/' : 'https://fatebook.io/'


  // ==== Listen for messages from extension background script ====
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "open_modal") {
      openModal();
    } else {
      throw new Error(`unknown action "${request.action}"`)
    }
  });


  // ==== Prediction iframe ====
  const predictIframe = document.createElement('iframe')
  predictIframe.className = 'fatebook-predict-embed'
  predictIframe.src = `${FATEBOOK_URL}embed/predict-modal`
  predictIframe.style.display = 'none'
  document.body.appendChild(predictIframe) // append to load content

  function openModal() {
    document.body.appendChild(predictIframe) // re-append to ensure we're at the botton
    predictIframe.style.display = 'block'
    predictIframe.focus()
    predictIframe.contentWindow?.postMessage({ isFatebook: true, action: 'focus_modal' }, '*')
  }

  // ==== Question iframe ====
  const questionIframe = document.createElement('iframe')
  questionIframe.id = 'fatebook-question-embed'
  questionIframe.src = `${FATEBOOK_URL}embed/question-loader`
  questionIframe.style.display = 'none'
  questionIframe.style.border = 'none'
  questionIframe.style.width = '100%'
  questionIframe.style.height = '450px'
  document.body.appendChild(questionIframe)

  function loadQuestion({ questionId, popup }) {
    console.log(1)
    questionIframe.contentWindow?.postMessage({ isFatebook: true, action: 'load_question', questionId }, '*')
    questionIframe.style.display = 'block'
    popup.appendChild(questionIframe)
  }

  function unloadQuestionIframe() {
    console.log(2)
    questionIframe.style.display = 'none'
    document.body.appendChild(questionIframe)
  }

  // ==== Listen for messages from iframes ====
  window.addEventListener('message', (event) => {
    if (typeof event.data !== 'object' || !event.data.isFatebook) return

    if (event.data.action === 'close_modal') {
      predictIframe.style.display = 'none'
    } else if (event.data.action === 'focus_parent') {
      document.querySelector('.kix-canvas-tile-content').click()
    } else {
      throw new Error(`unknown action "${event.data.action}"`)
    }
  })


  // ==== Mutation observers ====
  // let commentParent
  // const intervalComments = setInterval(() => {
  //   commentParent = document.querySelector(".docos-stream-view")
  //   if (!commentParent) return
  //   else {
  //     clearInterval(intervalComments)

  //     // Options for the observer (which mutations to observe)
  //     const config = { attributes: true, childList: true, subtree: true }

  //     // Callback function to execute when mutations are observed
  //     const callback = (mutationList, observer) => {
  //       const comments = commentParent.querySelectorAll(".docos-replyview-body")

  //       for (const comment of comments) {
  //         const link = comment.querySelector("a")
  //         if (!link) continue

  //         const ourLink = link.href.includes(FATEBOOK_URL)

  //         const ui = comment.querySelector("#fatebook-ui")
  //         const uiIsInjected = !!ui

  //         if (uiIsInjected && !ourLink) {
  //           console.log("remove")
  //           ui.remove()
  //         } else if (!uiIsInjected && ourLink) {
  //           console.log("append")

  //           const div = document.createElement("iframe")
  //           div.id = "fatebook-ui"
  //           div.src = "https://fatebook.io/"
  //           div.style.zoom = ".1"
  //           div.style.width = "100%"
  //           div.style.height = "2000px"

  //           comment.appendChild(div)
  //         }
  //       }
  //     }

  //     // Create an observer instance linked to the callback function
  //     const observer = new MutationObserver(callback)
  //     observer.observe(commentParent, config)
  //   }
  // }, 1000)

  const intervalPopup = setInterval(() => {
    const popupParent = document.querySelector(".docs-linkbubble-bubble")
    if (!popupParent) return

    clearInterval(intervalPopup)

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true }

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
      console.log(3)

      const link = popupParent.querySelector("a")
      if (!link) return

      const href = link.href
      const ourLink = href.includes(FATEBOOK_URL)
      const linkQuestionId = getQuestionIdFromUrl(link.href)

      const ui = popupParent.querySelector("#fatebook-question-embed")
      const uiIsInjected = !!ui

      if (uiIsInjected && !ourLink) {
        unloadQuestionIframe()
      } else {
        loadQuestion({ questionId: linkQuestionId, popup: popupParent })
      }
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback)
    observer.observe(popupParent, config)
  }, 1000)

  // let commentTray
  // const commentTrayInterval = setInterval(() => {
  //   commentTray = document.querySelector(".docs-instant-docos-content")
  //   if (!commentTray) return
  //   else {
  //     clearInterval(commentTrayInterval)

  //     const div = document.createElement("div")
  //     div.innerText = "ADD PREDICTION"



  //     commentTray.appendChild(div)

  //     // // Options for the observer (which mutations to observe)
  //     // const config = { attributes: true, childList: true, subtree: true }

  //     // // Callback function to execute when mutations are observed
  //     // const callback = (mutationList, observer) => {
  //     //    const href = popupParent.querySelector("a").href
  //     //    const ourLink = href.includes(FATEBOOK_URL)

  //     //    const ui = popupParent.querySelector("#fatebook-ui")
  //     //    const uiIsInjected = !!ui

  //     //    if (uiIsInjected && !ourLink) {
  //     //       console.log("remove")
  //     //       ui.remove()
  //     //    } else if (!uiIsInjected && ourLink) {
  //     //       console.log("append")
  //     //       const div = document.createElement("iframe")
  //     //       div.id = "fatebook-ui"
  //     //       div.src = "https://fatebook.io/"
  //     //       div.style.zoom = ".1"
  //     //       div.style.width = "100%"
  //     //       div.style.height = "2000px"

  //     //       popupParent.appendChild(div)
  //     //    }
  //     // }

  //     // // Create an observer instance linked to the callback function
  //     // const observer = new MutationObserver(callback)
  //     // observer.observe(popupParent, config)
  //   }
  // }, 1000)
})()


function getQuestionIdFromUrl(url) {
  const lastSegment = url.substring(url.lastIndexOf('/') + 1)

  // allow an optional ignored slug text before `--` character
  const parts = lastSegment.match(/(.*)--(.*)/)
  return parts ? parts[2] : (lastSegment) || ""
}
