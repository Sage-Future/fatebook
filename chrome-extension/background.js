(async () => {
  importScripts("sentry-background.js")

  const extensionInstanceId = uuidv4()

  Sentry.init({
    dsn: "https://032132527a4f59861f03150a5b6facfc@o4505800000471040.ingest.sentry.io/4505800011218944",
    tracesSampleRate: 0,
    integrations:[]
  })

  Sentry.setTag("extension_instance", extensionInstanceId)

  // Provide extension info to content scripts on load
  const extensionInfo = await chrome.management.getSelf()
  chrome.runtime.onConnect.addListener((channel) => {
    console.log('sending extension info to tab')
    try {
      channel.postMessage({
        // isFatebook: true, action: 'init_script', isDev: false
        isFatebook: true,
        action: 'init_script',
        isDev: extensionInfo.installType === 'development',
        extensionInstanceId
      })
    } catch (e) {
      Sentry.captureException(e)
      console.log(e)
    }
  })

  function openModal() {
    console.log('opening modal')
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id || (activeTab.url?.includes("fatebook.io") && !activeTab.url?.includes("/extension"))) return

      try {
        console.log('sending open modal request')
        await chrome.tabs.sendMessage(activeTab.id, { action: "open_modal" })
      } catch (e) {
        if (e.message.includes('Receiving end does not exist.')) {
          requestReload()
        } else {
          console.log(e.stack ? e.stack : e)
          Sentry.captureException(e)
        }
      }
    })
  }

  function requestReload() {
    console.log('requesting reload')
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id) return

      try {
        await chrome.scripting.executeScript({
          target: {tabId: activeTab.id},
          func: () => alert("Thanks for installing Fatebook! To use the extension on a tab right after you've installed it, you'll need to refresh the tab.")
        })
      } catch (e) {
        console.log(e.stack ? e.stack : e)
        Sentry.captureException(e)
      }

      // try {
      //   const permission = await chrome.scripting.executeScript({
      //     target: {tabId: activeTab.id},
      //     func: () => confirm("For the extension to work after being installed it needs to reload all open tabs. May we do this?")
      //   })
      //   if (permission[0].result) {
      //     console.log('permission given')
      //     const tabs = await chrome.tabs.query({})

      //     for (const tab of tabs) {
      //       if (tab.id && !tab.url?.includes('chrome://')) {
      //         chrome.tabs.reload(tab.id)
      //       }
      //     }
      //   } else {
      //     console.log('permission denied')
      //   }
      // } catch (e) {
      //   console.log(e.stack ? e.stack : e)
      //   Sentry.captureException(e)
      // }
    })
  }

  // when our extension icon is clicked
  chrome.action.onClicked.addListener(() => {
    console.log('icon clicked')
    openModal()
  })

  // when ctrl+shift+f is pressed, send a message to the content script (before.js and after.js)
  // eslint-disable-next-line no-unused-vars
  chrome.commands.onCommand.addListener((command) => {
    console.log('shortcut triggered')
    openModal()
  })

  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

})()

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: "https://fatebook.io/extension?installed=1"
    })
  }
})