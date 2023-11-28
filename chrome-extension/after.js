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

  Sentry.init({
    dsn: "https://032132527a4f59861f03150a5b6facfc@o4505800000471040.ingest.sentry.io/4505800011218944",
    environment: extensionInfo.isDev ? 'development' : 'production',
    integrations: [],
    tracesSampleRate: 0,
  })

  Sentry.setTag("extension_instance", extensionInfo.extensionInstanceId)

  Sentry.wrap(() => {
    // extensionInfo.isDev=false
    const FATEBOOK_HOST = extensionInfo.isDev ? 'localhost:3000' : 'fatebook.io'
    const FATEBOOK_URL = extensionInfo.isDev ? 'https://localhost:3000/' : 'https://fatebook.io/'

    // ==== Determine location ====
    const EMBED_LOCATIONS = {
      GOOGLE_DOCS: 'GOOGLE_DOCS',
      FATEBOOK: 'FATEBOOK',
      UNKNOWN: 'UNKNOWN',
    }
    const EMBED_LOCATION = getEmbedLocation()

    function getEmbedLocation() {
      if (window.location.href.includes("docs.google.com/document")) {
        return EMBED_LOCATIONS.GOOGLE_DOCS
      } else if (window.location.host === "fatebook.io" || window.location.host === "localhost:3000") {
        return EMBED_LOCATIONS.FATEBOOK
      } else {
        return EMBED_LOCATIONS.UNKNOWN
      }
    }

    console.log(`initialising fatebook extension, location: "${EMBED_LOCATION}"`, extensionInfo)

    if (EMBED_LOCATION === EMBED_LOCATIONS.FATEBOOK) return // Don't run on fatebook.io

    function getIsFatebookLink(href) {
      return href.includes(`${FATEBOOK_HOST}/q/`)
    }

    // ==== Listen for messages from iframes ====
    const iframeMap = {}
    function createIframe(src) {
      const iframe = document.createElement('iframe')
      const iframeId = (Object.keys(iframeMap).length + 1).toString()

      console.time(src)

      iframe.addEventListener('load', () => {
        try {
          console.timeEnd(src)
        } catch (e) {
          // do nothing
        }
      })

      const url = new URL(src)
      url.searchParams.set("fatebook-embed-id", iframeId)
      iframe.src = url.toString()

      iframeMap[iframeId] = iframe
      return iframe
    }

    window.addEventListener('message', (event) => {
      Sentry.wrap(() => {
        if (typeof event.data !== 'object' || !event.data.isFatebook || !event.data.embedId) return

        const iframe = iframeMap[event.data.embedId]
        if (!iframe) {
          console.error(`Could not find iframe for message id:"${event.data.embedId}"`, iframeMap)
        } else {
          console.log(`received message "${event.data.action}" from "${iframe.src}"`)
          iframe.dispatchEvent(new CustomEvent(event.data.action, { detail: event.data }))
        }
      })
    })

    // ==== Listen for messages from extension background script ====
    chrome.runtime.onMessage.addListener(function (request) {
      Sentry.wrap(() => {
        console.log(`received backend request ${request.action}`)
        if (request.action === "open_modal") {
          if (EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS) {
            const commentMenuItem = document.getElementById(":79")
            if (commentMenuItem && commentMenuItem.getAttribute('aria-disabled') === 'false') {
              predictionComment()
            } else {
              openModal()
            }
          } else {
            openModal()
          }
        } else {
          throw new Error(`unknown action "${request.action}"`)
        }
      })
    })

    async function pingIframe(iframe) {
      try {
        if (!iframe.contentWindow) {
          throw new Error(`${iframe.src} missing contentWindow`)
        }

        const pingEvent = `ping-${uuidv4()}`

        const didTimeout = Promise.race([
          new Promise(resolve => setTimeout(() => resolve(true), 5000)),
          new Promise(resolve => iframe.addEventListener(pingEvent, () => resolve(false), { once: true }))
        ])

        iframe.contentWindow.postMessage({ isFatebook: true, action: pingEvent }, '*')

        if (await didTimeout) {
          throw new Error(`${iframe.src} did not respond to ping`)
        }
      } catch (e) {
        console.log(e)
        Sentry.captureException(e)
      }
    }

    function sendMessage(iframe, action, data) {
      console.log(`sending message "${action}" to "${iframe.src}"`)
      pingIframe(iframe)
      iframe.contentWindow?.postMessage({ isFatebook: true, action, ...data }, '*')
    }

    // ==== Prediction iframe ====
    const predictIframe = createIframe(`${FATEBOOK_URL}embed/predict-modal`)
    predictIframe.className = 'fatebook-predict-embed'
    predictIframe.style.display = 'none'
    document.body.appendChild(predictIframe)

    predictIframe.addEventListener('load-url', (event) => {
      const wasOpen = predictIframe.style.display === 'block'
      const parent = predictIframe.parentElement
      predictIframe.remove()
      predictIframe.src = event.detail.src
      parent?.appendChild(predictIframe)
      if (wasOpen) {
        openModal()
      }
    })


    let oldActiveElement
    function openModal() {
      predictIframe.style.display = 'block'
      oldActiveElement = document.activeElement
      predictIframe.focus()

      sendMessage(predictIframe, 'focus_modal')

      document.body._originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      document.documentElement._originalOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = 'hidden'
    }

    function closeModal() {
      predictIframe.style.display = 'none'

      document.body.style.setProperty('overflow', document.body._originalOverflow)
      document.documentElement.style.setProperty('overflow', document.documentElement._originalOverflow)
    }

    predictIframe.addEventListener('prediction_cancel', closeModal)
    predictIframe.addEventListener('prediction_create_success', () => {
      closeModal()
      const isMac = navigator?.platform?.toUpperCase()?.indexOf('MAC') >= 0
      toast('success', `Prediction copied to clipboard. \n${isMac ? 'Cmd-V' : 'Ctrl-V'} to insert.`)
    })

    // ==== Toast iframe ====
    const toastIframe = createIframe(`${FATEBOOK_URL}embed/toast`)
    toastIframe.className = 'fatebook-toast-embed'
    document.body.appendChild(toastIframe)

    function toast(type, text) {
      toastIframe.className += ' fatebook-toast-embed-visible'
      sendMessage(toastIframe, 'toast', { type, text })
      setTimeout(() => {
        toastIframe.className = toastIframe.className.replace(' fatebook-toast-embed-visible', '')
      }, 2200)
    }


    // ==== Question iframe ====
    const questionIframe = createIframe(`${FATEBOOK_URL}embed/question-loader`)
    questionIframe.className = 'fatebook-question-embed'

    const questionLoaderLoaded = new Promise(resolve => questionIframe.addEventListener('question_loader_listening', resolve))
    document.body.appendChild(questionIframe)

    questionIframe.addEventListener('load-url', (event) => {
      const wasOpen = loadedQuestionId
      const parent = questionIframe.parentElement
      questionIframe.remove()
      questionIframe.src = event.detail.src
      parent?.appendChild(questionIframe)
      if (wasOpen) {
        loadQuestion({ questionId: wasOpen })
      }
    })


    questionIframe.addEventListener('prediction_elicit_success', () => {
      toast('success', 'Prediction made!')
    })

    questionIframe.addEventListener('resize_iframe', (data) => {
      // @ts-ignore
      questionIframe.style.height = data.detail.box.height + 'px'
    })

    // create a div that we can use to block out space within the gdoc popup
    // (we can't just move the iframe there, as that reloads it
    // and we can't make it start there as the element doesn't exist until a
    // link is clicked)
    const gdocLinkPopupBlockingElement = document.createElement('div')
    gdocLinkPopupBlockingElement.style.width = '500px'
    gdocLinkPopupBlockingElement.style.height = '188px'
    gdocLinkPopupBlockingElement.style.minHeight = '188px'
    gdocLinkPopupBlockingElement.style.transition = 'height 0.2s'
    gdocLinkPopupBlockingElement.style.display = 'none'

    let counter = 0
    let loadedQuestionId
    async function loadQuestion({ questionId }) {
      questionIframe.style.display = 'none' // don't show until loaded (important if going from link to link)

      counter = counter + 1
      let localCounter = counter
      await questionLoaderLoaded // if someone clicks on link before the question iframe loads then we need to wait. if this happens multiple times, "counter" ensures no issues
      if (counter > localCounter) return

      questionIframe.style.display = 'block'

      loadedQuestionId = questionId
      sendMessage(questionIframe, 'load_question', { questionId })
    }

    function unloadQuestionIframe() {
      loadedQuestionId = null
      questionIframe.style.display = 'none'
    }

    questionIframe.addEventListener('blur', () => {
      unloadQuestionIframe()
    })

    // ==== Replace links ====
    const linkReplaceFilterFunctions = []
    async function replaceFatebookLink(link) {
      if (linkReplaceFilterFunctions.some(fn => !fn(link))) return

      const href = EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS && link.getAttribute('data-rawhref') ? link.getAttribute('data-rawhref') : link.href

      // replace the text with it's title and prediction
      const questionId = getQuestionIdFromUrl(href)
      const questionDetails = await (await fetch(`${FATEBOOK_URL}api/v0/getQuestion?questionId=${questionId}&conciseQuestionDetails=1`, { credentials: 'include' })).json()

      if (link.innerText === href) {
        let pasteString = `⚖ ${questionDetails.title}`
        if (questionDetails.prediction) pasteString += ` (${questionDetails.user.name}: ${questionDetails.prediction !== undefined ? `${questionDetails.prediction * 100}% yes` : ''})`

        link.innerText = pasteString
      }

      // move the question loader to the link on click
      link.addEventListener('click', async (e) => {
        questionIframe.style.removeProperty('border')
        questionIframe.style.removeProperty('box-shadow')
        gdocLinkPopupBlockingElement.style.display = 'none'

        e.preventDefault()
        e.stopPropagation()
        // move it to the link
        await loadQuestion({ questionId })
        tooltipPosition(questionIframe, link)
        questionIframe.focus()
      })

      // on hover, make the link element's background grey with rounded corners
      link.addEventListener('mouseover', () => {
        link.style.backgroundColor = 'grey'
        link.style.borderRadius = '5px'
      })
      link.addEventListener('mouseout', () => {
        link.style.backgroundColor = ''
        link.style.borderRadius = ''
      })
    }

    const links = document.body.getElementsByTagName('a')

    function watchForFatebookLinks() {
      function processFatebookLinks() {
        for (let i = 0; i < links.length; i++) {
          const link = links[i]
          if (link.__fatebook_processed) continue
          link.__fatebook_processed = true

          if (getIsFatebookLink(link.href)) {
            replaceFatebookLink(link)
          }
        }
      }

      new MutationObserver(processFatebookLinks).observe(document.body, { subtree: true, childList: true })
      processFatebookLinks()
    }

    // === START LOCATION SPECIFIC CODE ===
    if (EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS) {
      locationGoogleDocs()
    } else {
      locationUnknown()
    }

    function locationGoogleDocs() {
      // If we're on google docs and the link is within the popup, don't replace it
      linkReplaceFilterFunctions.push((link) => !link.matches('.docs-linkbubble-bubble *'))

      // ==== Inject "direct_inject_gdocs.js" so we have direct dom access ====
      var scriptElement = document.createElement("script")
      scriptElement.setAttribute('src', chrome.runtime.getURL('direct_inject_gdocs.js'))
      document.head.appendChild(scriptElement)

      const refocusPage = () => {
        const gdoc = document.querySelector('.kix-canvas-tile-content')
        if (gdoc) {
          // @ts-ignore
          gdoc.click()
        }
      }
      predictIframe.addEventListener('prediction_cancel', refocusPage)
      predictIframe.addEventListener('prediction_create_success', refocusPage)

      questionIframe.addEventListener('resize_iframe', (data) => {
        // @ts-ignore
        gdocLinkPopupBlockingElement.style.height = data.detail.box.height + 'px'
      })

      document.body.addEventListener('scroll', () => {
        if (gdocLinkPopupBlockingElement.style.display === 'block') {
          overlapElements(questionIframe, gdocLinkPopupBlockingElement)
        }
      }, true)

      // set up mutation observer for .kix-appview-editor
      // listen for the link bubble, and then de-register it
      waitForLinkPopupToExist()

      // The div that contains the popup doesn't exist initially, so we must watch for it
      function waitForLinkPopupToExist() {
        const kixEditor = document.querySelector(".kix-appview-editor")
        if (!kixEditor) {
          Sentry.captureException(new Error("could not find kixEditor element in gdoc page"))
          return
        }


        const reactToChange = (mutationList, observer) => {
          const linkPopup = document.querySelector(".docs-linkbubble-bubble")
          if (linkPopup) {
            observer.disconnect()
            linkPopup.appendChild(gdocLinkPopupBlockingElement)

            watchLinkPopup(linkPopup)
          }
        }

        const observer = new MutationObserver(reactToChange)
        observer.observe(kixEditor, { attributes: false, childList: true, subtree: false })

        reactToChange(null, observer)
      }

      function resetInlineGocChanges(linkPopup) {
        linkPopup.style.removeProperty('padding-bottom')
        questionIframe.style.removeProperty('border')
        questionIframe.style.removeProperty('box-shadow')
        gdocLinkPopupBlockingElement.style.display = 'none'
      }

      // Watch the link popup for changes so we can insert our markup
      function watchLinkPopup(linkPopup) {
        const reactToChange = async () => {
          // If the link popup had become hidden then unload our content
          if (linkPopup.style.display === "none") {
            unloadQuestionIframe()
            resetInlineGocChanges(linkPopup)
            return
          }

          // Get the link and determine whether it's a fatebook link
          const link = linkPopup.querySelector("a")
          if (!link) return

          const isFatebookLink = getIsFatebookLink(link.href)
          const isUIInjected = linkPopup.contains(gdocLinkPopupBlockingElement) &&
            gdocLinkPopupBlockingElement.style.display === "block"

          // If the user went from a fatebook link to a non-fatebook link, remove our content
          if (!isFatebookLink && isUIInjected) {
            unloadQuestionIframe()
            resetInlineGocChanges(linkPopup)
          }

          if (!isFatebookLink) {
            return
          }

          // If it is a fatebook link, then load our ui if needed
          const linkQuestionId = getQuestionIdFromUrl(link.href)

          if (!isUIInjected || loadedQuestionId !== linkQuestionId) {
            linkPopup.style.paddingBottom = 0
            questionIframe.style.border = 'none'
            questionIframe.style.boxShadow = 'none'

            await loadQuestion({ questionId: linkQuestionId })
            gdocLinkPopupBlockingElement.style.display = 'block'
            overlapElements(questionIframe, gdocLinkPopupBlockingElement)
          }
        }

        // linkPopup.addEventListener('blur', () => {
        //   resetInlineGocChanges()
        // })

        reactToChange()

        new MutationObserver(reactToChange).observe(linkPopup, { attributes: true, childList: true })
      }
    }

    function locationUnknown() {
      const refocusPage = () => {
        if (oldActiveElement && oldActiveElement.focus) {
          oldActiveElement.focus()
        }
      }

      predictIframe.addEventListener('prediction_create_success', refocusPage)
      predictIframe.addEventListener('prediction_cancel', refocusPage)
    }

    // Run link replace
    watchForFatebookLinks()

    function predictionComment() {
      openModal()

      const done = (event) => {
        predictIframe.removeEventListener('prediction_create_success', done)
        predictIframe.removeEventListener('prediction_cancel', done)

        if (event.type === 'prediction_create_success') {
          // send message to direct_inject
          window.dispatchEvent(new MessageEvent('message', { data: { isFatebook: true, action: 'create_comment' } }))

          const waitForCommentInterval = setInterval(() => {
            const active = document.activeElement
            if (!active?.matches('.docos-input-textarea')) return

            clearInterval(waitForCommentInterval)

            active.innerText = event.detail.predictionLink

            active.click()

            const submitButton = active.parentElement?.querySelector('.docos-input-buttons-post')
            if (submitButton) {
              // eslint-disable-next-line no-inner-declarations
              function triggerMouseEvent(node, eventType) {
                var clickEvent = document.createEvent('MouseEvents')
                clickEvent.initEvent(eventType, true, true)
                node.dispatchEvent(clickEvent)
              }

              triggerMouseEvent(submitButton, "mouseover")
              triggerMouseEvent(submitButton, "mousedown")
              triggerMouseEvent(submitButton, "mouseup")
              triggerMouseEvent(submitButton, "click")
            }
          }, 50)

          setTimeout(() => {
            clearInterval(waitForCommentInterval)
          }, 3000)
        }
      }

      predictIframe.addEventListener('prediction_cancel', done)
      predictIframe.addEventListener('prediction_create_success', done)
    }

    const commentButtonInterval = setInterval(() => {
      const commentButtons = document.querySelector(".docs-instant-docos-content")
      if (!commentButtons) return

      clearInterval(commentButtonInterval)

      const scalePng = chrome.runtime.getURL('scale.png')

      const div = document.createElement("div")
      div.innerHTML = `<div class="superfab-button-container">
        <div class="goog-control instant-button last-visible-button" style="user-select: none;">
          <img style="width:22px;padding-left:1px" src="${scalePng}"></img>
        </div>
      </div>`

      commentButtons.appendChild(div)

      div.addEventListener('click', predictionComment)
    }, 500)
  })
})()


function getQuestionIdFromUrl(url) {
  const lastSegment = url.substring(url.lastIndexOf('/') + 1)

  // allow an optional ignored slug text before `--` character
  const parts = lastSegment.match(/(.*)--(.*?)(?:\?|$|&)/)
  return parts ? parts[2] : (lastSegment) || ""
}

function overlapElements(absoluteElement, targetElement) {
  // Get the bounding rectangles of the elements relative to their parent elements
  const absoluteRect = absoluteElement.getBoundingClientRect()
  const targetRect = targetElement.getBoundingClientRect()

  // Calculate the differences in positions relative to the parent elements
  const topDiff = targetRect.top - absoluteRect.top
  const leftDiff = targetRect.left - absoluteRect.left

  // Update the CSS properties of the absolute element
  const currentAbsoluteTop = parseFloat(absoluteElement.style.top || 0)
  const currentAbsoluteLeft = parseFloat(absoluteElement.style.left || 0)
  absoluteElement.style.top = `${currentAbsoluteTop + topDiff}px`
  absoluteElement.style.left = `${currentAbsoluteLeft + leftDiff}px`
}

function tooltipPosition(absoluteElement, targetElement) {
  const verticalPadding = 5

  // Get the bounding rectangles of the elements relative to their parent elements
  const absoluteRect = absoluteElement.getBoundingClientRect()
  const currentAbsoluteTop = parseFloat(absoluteElement.style.top || 0)
  const currentAbsoluteLeft = parseFloat(absoluteElement.style.left || 0)

  const targetRect = targetElement.getBoundingClientRect()

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth ||
    document.body.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight ||
    document.body.clientHeight

  // Figure out where to position element considering the screen bounds
  const leftAlign = targetRect.left + absoluteRect.width < viewportWidth
  const placeUnderneath = targetRect.bottom + absoluteRect.height + verticalPadding < viewportHeight

  // Calculate the differences in positions relative to the parent elements

  let leftDiff
  if (leftAlign) {
    leftDiff = targetRect.left - absoluteRect.left
  } else {
    leftDiff = (targetRect.right - absoluteRect.width) - absoluteRect.left
  }

  let topDiff
  if (placeUnderneath) {
    topDiff = targetRect.top - absoluteRect.top + targetRect.height + verticalPadding
  } else {
    topDiff = targetRect.top - absoluteRect.top - absoluteRect.height - verticalPadding
  }

  // Update the CSS properties of the absolute element
  absoluteElement.style.left = `${currentAbsoluteLeft + leftDiff}px`
  absoluteElement.style.top = `${currentAbsoluteTop + topDiff}px`
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}