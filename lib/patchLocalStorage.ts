// https://github.com/nextauthjs/next-auth/discussions/3940

/*
  Problem:

  Whenever an instance of client side nextjs-auth detects a change in the session object, it
  broadcasts a message to all other instances to let them know to refetch the object.

  This alone would not be such a problem, except the session object changes every time a page loads,
  as it has the session expiry stored client-side.

  As we load (at the time of writing) 3 fatebook iframes per page, this turns out to be quite a number
  of calls to the backend to fetch the session. If we have 10 tabs open, then every time we change tab we launch 30 calls to re-fetch the session.

  This code disables both the sending and receiving of session events for embedded iframes,
  such that they neither call the backend when a fatebook page loads, nor cause open fatebook tabs to.

  Note there is also an option to disable "refetchOnWindowFocus" on the Session component in _app.tsx that we have
  left enabled. This means whenever a tab is opened or returned to, there will be a session call for each fatebook
  iframe on the page.

  Unfortunately, disabling this stops session update from changing the page within the embed frames,
  after extensive investigation the best we can do at the moment is reload the embed everytime it's vibility changes if it's unauthenticated (this is done in embed.js "useListenForSessionReload()")
*/
export function patchLocalStorage () {
  if (location.href.includes('/embed/')) {
    // prevent receiving
    window.addEventListener("storage", (event) => {
      if (event.newValue) {
        try {
          const message = JSON.parse(event.newValue)
          if (message?.event !== "session" || !message?.data) return

          if (message.data.trigger === "signout") return // allow signout through

          if (message.data.bypass) return // allow signout through

          // If we're an embedded iframe, and this is a storage event (which would cause an /auth refetch) block it
          event.stopImmediatePropagation()
          // console.log('blocked receiving nextjs-auth storage message', event.newValue)
        } catch (error) {
          // Do nothing if JSON parsing fails
        }
      }
    })

    // prevent sending
    const originalSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key, value) => {
      if (key !== "nextauth.message" || JSON.parse(value).data.bypass) {
        return originalSetItem(key, value)
      }
    }
  }
}