
// when ctrl+shift+f is pressed, send a message to the content script (before.js and after.js)
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0]
    if (!activeTab.id) return

    chrome.tabs.sendMessage(activeTab.id, { action: "open_modal" });
  });
});



