// ==== Gets injected as a web accessible resource so get direct DOM access ====

(() => {
  window.addEventListener('message', (event) => {
    if (typeof event.data !== 'object' || !event.data.isFatebook) return

    if (event.data.action === 'close_link_popup') {
      const eventObj = document.createEvent("Event");
      eventObj.initEvent("keydown", true, true);
      eventObj.keyCode = 27;
      document.querySelector(".docs-linkbubble-bubble").dispatchEvent(eventObj);
    }
  })
})()

