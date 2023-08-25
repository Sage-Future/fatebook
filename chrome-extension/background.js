(async () => {

  // Provide extension info to content scripts on load
  const extensionInfo = await chrome.management.getSelf()
  chrome.runtime.onConnect.addListener((channel) => {
    channel.postMessage({
      // isFatebook: true, action: 'init_script', isDev: false
      isFatebook: true, action: 'init_script', isDev: extensionInfo.installType === 'development'
    })
  })

  function openModal() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id) return
      
      try {
        chrome.tabs.sendMessage(activeTab.id, { action: "open_modal" });
      } catch (e) {
        chrome.tabs.reload(activeTab.id)
        console.log(e)
      }
    });
  }

  chrome.action.onClicked.addListener(() => {
    openModal()
  });

  // when ctrl+shift+f is pressed, send a message to the content script (before.js and after.js)
  chrome.commands.onCommand.addListener((command) => {
    openModal()
  });
})()