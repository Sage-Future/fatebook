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

  // ==== Determine location ====
  const EMBED_LOCATIONS = {
    GOOGLE_DOCS: 'GOOGLE_DOCS',
    FATEBOOK: 'FATEBOOK',
    UNKNOWN: 'UNKNOWN',
  }
  const EMBED_LOCATION = getEmbedLocation()

  function getEmbedLocation() {
    if (window.location.host === "docs.google.com") {
      return EMBED_LOCATIONS.GOOGLE_DOCS
    } else if (window.location.host === "fatebook.io" || window.location.host === "localhost:3000") {
      return EMBED_LOCATIONS.FATEBOOK
    } else {
      return EMBED_LOCATIONS.UNKNOWN
    }
  }

  // ==== Listen for messages from iframes ====
  const iframeMap = {}
  function createIframe(src) {
    const iframe = document.createElement('iframe')
    const iframeId = (Object.keys(iframeMap).length + 1).toString()
    
    const url = new URL(src)
    url.searchParams.set("fatebook-embed-id", iframeId)
    iframe.src = url.toString()

    iframeMap[iframeId] = iframe
    return iframe
  }

  window.addEventListener('message', (event) => {
    if (typeof event.data !== 'object' || !event.data.isFatebook || !event.data.embedId) return
    iframeMap[event.data.embedId].dispatchEvent(new CustomEvent(event.data.action, {detail:event.data}))
  })


  // ==== Toast iframe ====
  const toastIframe = createIframe(`${FATEBOOK_URL}embed/toast`)
  toastIframe.className = 'fatebook-toast-embed'
  document.body.appendChild(toastIframe) // append to load content

  function toast(type, text) {
    toastIframe.className += ' fatebook-toast-embed-visible'
    toastIframe.contentWindow?.postMessage({ isFatebook: true, action: 'toast', type, text}, '*')
    setTimeout(() => {
      toastIframe.className = toastIframe.className.replace(' fatebook-toast-embed-visible', '')
    }, 2200)
  }


  // ==== Listen for messages from extension background script ====
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "open_modal") {
      if (EMBED_LOCATION === EMBED_LOCATIONS.FATEBOOK) {
        toast('error', "Our extension won't run on fatebook, try another site")
      } else {
        openModal()
      }
    } else {
      throw new Error(`unknown action "${request.action}"`)
    }
  });


  // Don't run on fatebook.io
  if (EMBED_LOCATION === EMBED_LOCATIONS.FATEBOOK) return


  // ==== Prediction iframe ====
  const predictIframe = createIframe(`${FATEBOOK_URL}embed/predict-modal`)
  predictIframe.className = 'fatebook-predict-embed'
  predictIframe.style.display = 'none'
  document.body.appendChild(predictIframe) // append to load content

  let oldActiveElement = document.activeElement
  function openModal() {
    predictIframe.style.display = 'block'
    oldActiveElement = document.activeElement
    predictIframe.focus()
    predictIframe.contentWindow?.postMessage({ isFatebook: true, action: 'focus_modal' }, '*')
    document.body.style.overflow = 'hidden'
  }

  predictIframe.addEventListener('close_modal', () => {
    predictIframe.style.display = 'none'
    document.body.style.removeProperty('overflow')
  })
  predictIframe.addEventListener('prediction_create_success', () => {
    toast('success', 'Prediction copied to clipboard')
  })

  // ==== Question iframe ====
  const questionIframe = createIframe(`${FATEBOOK_URL}embed/question-loader`)
  const questionLoaderLoaded = new Promise(resolve => questionIframe.addEventListener('question_loader_listening', resolve))

  questionIframe.className = 'fatebook-question-embed'
  
  const questionBlockingElement = document.createElement('div')
  questionBlockingElement.style.width = '500px'
  questionBlockingElement.style.height = '188px'
  questionBlockingElement.style.minHeight = '188px'
  questionBlockingElement.style.transition = 'height 0.2s'

  questionIframe.addEventListener('prediction_elicit_success', () => {
    toast('success', 'Prediction made!')
  })

  questionIframe.addEventListener('resize_iframe', (data) => {
    // ts-ignore
    questionIframe.style.height = data.detail.box.height + 'px'
    questionBlockingElement.style.height = data.detail.box.height + 'px'
  })

  let counter = 0
  async function loadQuestion({ questionId }) {
    counter = counter + 1
    let localCounter = counter
    await questionLoaderLoaded // if someone clicks on link before the question iframe loads then we need to wait. if this happens multiple times, "counter" ensures no issues
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

  // ==== Question iframe ====


  // === START LOCATION SPECIFIC CODE ===
  if (EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS) {
    locationGoogleDocs()
  } else {
    locationUnknown()
  }

  function locationGoogleDocs() {
    // ==== Inject "direct_inject_gdocs.js" so we have direct dom access ====
    var scriptElement = document.createElement("script");
    scriptElement.setAttribute('src', chrome.runtime.getURL('direct_inject_gdocs.js'));
    document.head.appendChild(scriptElement);

    predictIframe.addEventListener('close_modal', () => {
      const gdoc = document.querySelector('.kix-canvas-tile-content')
      if(gdoc) {
        // @ts-ignore
        gdoc.click()
      }
    })

    // append position absolute question embed
    const scrollElement = document.querySelector('.kix-appview-editor')
    if (scrollElement) {
      scrollElement.appendChild(questionIframe)
    } else {
      console.error('Could not find google docs scroll element')
    }

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

      reactToChange(null, observer)
    }

    // Watch the link popup for changes so we can insert our markup
    function watchLinkPopup(linkPopup) {
      const reactToChange = () => {
        if (linkPopup.style.display === "none") {
          unloadQuestionIframe()
          linkPopup.style.removeProperty('paddingBottom')
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
            linkPopup.style.removeProperty('paddingBottom')
          }
          return
        }

        // If it is a fatebook link, then load our ui if needed
        if (!isUIInjected || link.href !== fatebookQuestionUI.src) {
          const linkQuestionId = getQuestionIdFromUrl(link.href)
          loadQuestion({ questionId: linkQuestionId })
          linkPopup.style.paddingBottom = 0
        }
      }

      reactToChange()

      new MutationObserver(reactToChange).observe(linkPopup, { attributes: true, childList: true, subtree: true })
    }
  }

  function locationUnknown() {
    document.body.appendChild(questionIframe)

    predictIframe.addEventListener('close_modal', () => {
      if (oldActiveElement) {
        oldActiveElement.focus()
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
