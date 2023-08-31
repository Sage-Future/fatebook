(async () => {

  // Provide extension info to content scripts on load
  const extensionInfo = await chrome.management.getSelf()
  chrome.runtime.onConnect.addListener((channel) => {
    try {
      channel.postMessage({
        // isFatebook: true, action: 'init_script', isDev: false
        isFatebook: true, action: 'init_script', isDev: extensionInfo.installType === 'development'
      })
    } catch (e) {
      console.log(e)
    }
  })

  function openModal() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id) return
      
      try {
        await chrome.tabs.sendMessage(activeTab.id, { action: "open_modal" });
      } catch (e) {
        requestReload()
      }
    });
  }

  function requestReload() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id) return
      
      try {
        const permission = await chrome.scripting.executeScript({
          target: {tabId: activeTab.id},
          func: () => confirm("For the extension to work after being installed it needs to reload all open tabs. May we do this?")
        });

        if (permission[0].result) {
          const tabs = await chrome.tabs.query({})

          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.reload(tab.id)
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    });
  }

  chrome.runtime.onInstalled.addListener(async () => {
    requestReload()
  });

  // when our extension icon is clicked
  chrome.action.onClicked.addListener(() => {
    openModal()
  });

  // when ctrl+shift+f is pressed, send a message to the content script (before.js and after.js)
  chrome.commands.onCommand.addListener((command) => {
    openModal()
  });
})()