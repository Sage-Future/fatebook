// this code will be executed after page load
; (function () {
  console.log("before.js executed")

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.action === "open_modal") {
      openModal();
    } else {
      throw new Error(`unknown action "${request.action}"`)
    }
  });


  function openModal() {
    alert('eyo!')
    // todo, put http://localhost:3000/embed/predict in an iframe and show as a modal
  }
})()