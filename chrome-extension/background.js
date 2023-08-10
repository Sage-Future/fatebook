(async () => {

  // Provide extension info to content scripts on load
  const extensionInfo = await chrome.management.getSelf()
  chrome.runtime.onConnect.addListener((channel) => {
    channel.postMessage({
      isFatebook: true, action: 'init_script', isDev: extensionInfo.installType === 'development'
    })
  })

  // when ctrl+shift+f is pressed, send a message to the content script (before.js and after.js)
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0]
      if (!activeTab.id) return

      chrome.tabs.sendMessage(activeTab.id, { action: "open_modal" });
    });
  });
})()