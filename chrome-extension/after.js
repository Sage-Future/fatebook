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

  const EMBED_LOCATIONS = {
    GOOGLE_DOCS: 'GOOGLE_DOCS',
    UNKNOWN: 'UNKNOWN',
  }
  const EMBED_LOCATION = getEmbedLocation()

  function getEmbedLocation() {
    if (window.location.host === 'docs.google.com') {
      return EMBED_LOCATIONS.GOOGLE_DOCS
    }
  }


  const FATEBOOK_URL = extensionInfo.isDev ? 'https://localhost:3000/' : 'https://fatebook.io/'

  // ==== Inject "direct_inject" so we have direct dom access ====
  var scriptElement = document.createElement("script");
  scriptElement.setAttribute('src', chrome.runtime.getURL('direct_inject.js'));
  document.head.appendChild(scriptElement);


  // ==== Listen for messages from extension background script ====
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "open_modal") {
      openModal();
    } else {
      throw new Error(`unknown action "${request.action}"`)
    }
  });

  // ==== Toast iframe ====
  const toastIframe = document.createElement('iframe')
  toastIframe.className = 'fatebook-toast-embed'
  toastIframe.src = `${FATEBOOK_URL}embed/toast`
  document.body.appendChild(toastIframe) // append to load content

  function toast(type, text) {
    toastIframe.style.zIndex = '9999'
    toastIframe.contentWindow?.postMessage({ isFatebook: true, action: 'toast', type, text}, '*')
    setTimeout(() => {
      toastIframe.style.zIndex = '0'
    }, 2200)
  }

  // ==== Prediction iframe ====
  const predictIframe = document.createElement('iframe')
  predictIframe.className = 'fatebook-predict-embed'
  predictIframe.src = `${FATEBOOK_URL}embed/predict-modal`
  predictIframe.style.display = 'none'
  document.body.appendChild(predictIframe) // append to load content

  function openModal() {
    predictIframe.style.display = 'block'
    predictIframe.focus()
    predictIframe.contentWindow?.postMessage({ isFatebook: true, action: 'focus_modal' }, '*')
  }

  // ==== Question iframe ====
  const questionLoaderLoaded = new Promise(resolve => {
    window.addEventListener('message', (event) => {
      if (typeof event.data !== 'object' || !event.data.isFatebook) return
      if (event.data.action === 'question_loader_listening') resolve(null)
    })
  })
  const questionIframe = document.createElement('iframe')
  questionIframe.id = 'fatebook-question-embed'
  questionIframe.src = `${FATEBOOK_URL}embed/question-loader`
  questionIframe.style.display = 'none'
  questionIframe.style.position = 'absolute'
  questionIframe.style.border = 'none'
  questionIframe.style.width = '500px'
  questionIframe.style.height = '180px'
  questionIframe.style.zIndex = '999999999'

  const questionBlockingElement = document.createElement('div')
  questionBlockingElement.style.width = '500px'
  questionBlockingElement.style.height = '180px'

  let counter = 0
  async function loadQuestion({ questionId }) {
    let localCounter = counter + 1
    await questionLoaderLoaded
    if(counter > localCounter) return

    // set blocking code to display
    questionIframe.style.display = 'block'
    questionBlockingElement.style.display = 'block'
    
    questionIframe.contentWindow?.postMessage({ isFatebook: true, action: 'load_question', questionId }, '*')
    
    // position element
    overlapElements(questionIframe, questionBlockingElement)
  }

  function unloadQuestionIframe() {
    questionBlockingElement.style.display = 'none'
    questionIframe.style.display = 'none'
  }

  // ==== Listen for messages from iframes ====
  window.addEventListener('message', (event) => {
    if (typeof event.data !== 'object' || !event.data.isFatebook) return

    if (event.data.action === 'close_modal') {
      predictIframe.style.display = 'none'
    } else if (event.data.action === 'prediction_success') {
      toast('success', 'Prediction copied to clipboard')
    }
  })


  // === START LOCATION SPESIFIC CODE ===
  if (EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS) {
    locationGoogleDocs()
  } else {
    locationUnknown()
  }

  function locationGoogleDocs() {
    window.addEventListener('message', (event) => {
      if (typeof event.data !== 'object' || !event.data.isFatebook) return

      if (event.data.action === 'focus_parent') {
        const gdoc = document.querySelector('.kix-canvas-tile-content')
        if(gdoc) {
          // @ts-ignore
          gdoc.click()
        }
      }
    })

    // append position absolute question embed
    const scrollElement = document.querySelector('.kix-appview-editor')
    if (scrollElement) {
      scrollElement.appendChild(questionIframe)
    } else {
      console.error('Could not find google docs scroll element')
    }

    // listen for '`'
    const eventTarget = document.querySelector('.docs-texteventtarget-iframe')
    // @ts-ignore
    if (eventTarget && eventTarget.contentDocument && eventTarget.contentDocument.activeElement) {
      // @ts-ignore
      eventTarget.contentDocument.activeElement.addEventListener('keydown', (e) => {
        if (e.key === '`') {
          openModal()
        }
      })
    }


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

    // set up mutation observer for .kix-appview-editor
    // listen for the link bubble, and then de-register it
    waitForLinkPopupToExist()

    // The div that contains the popup doesn't exist initially, so we must watch for it
    function waitForLinkPopupToExist() {
      const kixEditor = document.querySelector(".kix-appview-editor")
      if (!kixEditor) return
      // todo: handle if not found

      const reactToChange = async (mutationList, observer) => {
        const linkPopup = document.querySelector(".docs-linkbubble-bubble")
        if (linkPopup) {
          observer.disconnect()
          linkPopup.appendChild(questionBlockingElement)

          watchLinkPopup(linkPopup)
        }
      }

      const observer = new MutationObserver(reactToChange)
      observer.observe(kixEditor, { attributes: false, childList: true, subtree: false })

      reactToChange()
    }

    // Watch the link popup for changes so we can insert our markup
    function watchLinkPopup(linkPopup) {
      const reactToChange = () => {
        if (linkPopup.style.display === "none") {
          unloadQuestionIframe()
          return
        }

        const link = linkPopup.querySelector("a")
        if (!link) return

        const isFatebookLink = link.href.includes(FATEBOOK_URL)

        const fatebookQuestionUI = linkPopup.contains(questionBlockingElement) && questionBlockingElement.style.display === "block"
        const isUIInjected = !!fatebookQuestionUI

        // If it's not a fatebook link, then unload our ui if it's in there
        if (!isFatebookLink) {
          if (isUIInjected) {
            unloadQuestionIframe()
          }
          return
        }

        // If it is a fatebook link, then load our ui if needed
        if (!isUIInjected || link.href !== fatebookQuestionUI.src) {
          const linkQuestionId = getQuestionIdFromUrl(link.href)
          loadQuestion({ questionId: linkQuestionId })
        }
      }

      reactToChange()

      new MutationObserver(reactToChange).observe(linkPopup, { attributes: true, childList: true, subtree: true })
    }
  }

  function locationUnknown() {
    document.body.appendChild(questionIframe)

    // listen for '`'
    document.body.addEventListener('keydown', (e) => {
      if (e.key === '`') {
        openModal()
      }
    })
  }

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

function overlapElements(absoluteElement, targetElement) {
  // Get the bounding rectangles of the elements relative to their parent elements
  const absoluteRect = absoluteElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  // Calculate the differences in positions relative to the parent elements
  const topDiff = targetRect.top - absoluteRect.top;
  const leftDiff = targetRect.left - absoluteRect.left;

  // Update the CSS properties of the absolute element
  const currentAbsoluteTop = parseFloat(absoluteElement.style.top || 0);
  const currentAbsoluteLeft = parseFloat(absoluteElement.style.left || 0);
  absoluteElement.style.top = `${currentAbsoluteTop + topDiff}px`;
  absoluteElement.style.left = `${currentAbsoluteLeft + leftDiff}px`;
}
