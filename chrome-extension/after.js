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
    
    console.time(src)
    
    iframe.addEventListener('load', () => {
      console.timeEnd(src)
    })

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
    questionIframe.contentWindow?.postMessage({ isFatebook: true, action: 'load_question', questionId }, '*')
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

    const href = EMBED_LOCATION === EMBED_LOCATIONS.GOOGLE_DOCS ? link.getAttribute('data-rawhref') : link.href

    // replace the text with it's title and prediction
    const questionId = getQuestionIdFromUrl(href)
    // const questionId = 'cllperaa9000ptq7mpxfzx32i'
    const questionDetails = await (await fetch(`${FATEBOOK_URL}api/v0/getQuestion?questionId=${questionId}`, {credentials:'include'})).json()

    if (link.innerText === href) {
      let pasteString = `⚖ ${questionDetails.title}`
      if (questionDetails.prediction) pasteString += ` (${questionDetails.user.name}: ${questionDetails.prediction !== undefined ? `${questionDetails.prediction * 100}% yes` : ''})`
      
      link.innerText = pasteString
    }

    // style it
    // link.style.background = '#d1d3d5'
    // // link.style.borderRadius = '10px'
    // link.style.textDecoration = 'none'
    // link.style.color = 'black'
    // link.style.padding = '1px 7px'
    // link.style.border = '1px solid #0000004d'
    // if (link.parentElement.clientWidth < 400) {
    //   link.style.display = 'block' // temp workaround
    // }

    // move the question loader to the link on click
    link.addEventListener('click', async (e) => {
      questionIframe.style.removeProperty('border')
      questionIframe.style.removeProperty('boxShadow')
      gdocLinkPopupBlockingElement.style.display = 'none'

      e.preventDefault()
      e.stopPropagation()
      // move it to the link
      await loadQuestion({questionId})
      tooltipPosition(questionIframe, link)
      questionIframe.focus()
    })
  }

  const links = document.body.getElementsByTagName('a')

  function watchForFatebookLinks() {
    function processFatebookLinks() {
      for (let i = 0; i < links.length; i++) {
        const link = links[i]
        if (link.__fatebook_processed) continue
        link.__fatebook_processed = true

        if (isFatebookLink(link.href)) {
          replaceFatebookLink(link)
        }
      }
    }

    new MutationObserver(processFatebookLinks).observe(document.body, {subtree: true, childList: true})
    processFatebookLinks()
  }

  function isFatebookLink(href) {
    return href.includes(FATEBOOK_HOST)
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
      document.body.appendChild(questionIframe)
      // scrollElement.appendChild(questionIframe)
    } else {
      console.error('Could not find google docs scroll element')
    }

    questionIframe.addEventListener('resize_iframe', (data) => {
    // @ts-ignore
      gdocLinkPopupBlockingElement.style.height = data.detail.box.height + 'px'
    })

    document.body.addEventListener('scroll', (e) => {
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
      if (!kixEditor) return
      // todo: handle if not found

      const reactToChange = async (mutationList, observer) => {
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
      linkPopup.style.removeProperty('paddingBottom')
      questionIframe.style.removeProperty('border')
      questionIframe.style.removeProperty('boxShadow')
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
        
        const isFatebookLink = link.href.includes(FATEBOOK_URL)
        const isUIInjected = linkPopup.contains(gdocLinkPopupBlockingElement) && 
        gdocLinkPopupBlockingElement.style.display === "block"

        // If the user went from a fatebook link to a non-fatebook link, remove our content
        if (!isFatebookLink && isUIInjected) {
          unloadQuestionIframe()
          resetInlineGocChanges(linkPopup)
          return
        }

        // If it is a fatebook link, then load our ui if needed
        const linkQuestionId = getQuestionIdFromUrl(link.href)

        if (!isUIInjected || loadedQuestionId !== linkQuestionId) {
          linkPopup.style.paddingBottom = 0
          questionIframe.style.border = 'none'
          questionIframe.style.boxShadow = 'none'

          await loadQuestion({ questionId: linkQuestionId})
          gdocLinkPopupBlockingElement.style.display = 'block'
          overlapElements(questionIframe, gdocLinkPopupBlockingElement)
        }
      }

      // linkPopup.addEventListener('blur', () => {
      //   resetInlineGocChanges()
      // })

      reactToChange()

      new MutationObserver(reactToChange).observe(linkPopup, { attributes: true, childList: true})
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

  // Run link replace
  watchForFatebookLinks()

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
  const parts = lastSegment.match(/(.*)--(.*?)(?:\?|$|&)/)
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

function tooltipPosition(absoluteElement, targetElement) {
  const verticalPadding = 5

  // Get the bounding rectangles of the elements relative to their parent elements
  const absoluteRect = absoluteElement.getBoundingClientRect();
  const currentAbsoluteTop = parseFloat(absoluteElement.style.top || 0);
  const currentAbsoluteLeft = parseFloat(absoluteElement.style.left || 0);
  
  const targetRect = targetElement.getBoundingClientRect();

  const viewportWidth  = window.innerWidth || document.documentElement.clientWidth || 
  document.body.clientWidth;
  const viewportHeight = window.innerHeight|| document.documentElement.clientHeight|| 
  document.body.clientHeight;

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
    topDiff = targetRect.top - absoluteRect.top + targetRect.height + verticalPadding;
  } else {
    topDiff = targetRect.top - absoluteRect.top - absoluteRect.height - verticalPadding;
  }

  // Update the CSS properties of the absolute element
  absoluteElement.style.left = `${currentAbsoluteLeft + leftDiff}px`;
  absoluteElement.style.top = `${currentAbsoluteTop + topDiff}px`;
}
