// this code will be executed after page load
;(function () {
   console.log("after.js executed")


    document.body.addEventListener('keydown', (event) => {
    console.log("eeeeeyo")
    
    if(event.key === '`') {
      showPredictionModal()
    }
  })
  
  function showPredictionModal() {
    alert('ey!')
  }

   let commentParent
   const intervalComments = setInterval(() => {
      commentParent = document.querySelector(".docos-stream-view")
      if (!commentParent) return
      else {
         clearInterval(intervalComments)

         // Options for the observer (which mutations to observe)
         const config = { attributes: true, childList: true, subtree: true }

         // Callback function to execute when mutations are observed
         const callback = (mutationList, observer) => {
            const comments = commentParent.querySelectorAll(".docos-replyview-body")

            for (const comment of comments) {
               const link = comment.querySelector("a")
               if (!link) continue

               const ourLink = link.href.includes("example.com")

               const ui = comment.querySelector("#fatebook-ui")
               const uiIsInjected = !!ui

               if (uiIsInjected && !ourLink) {
                  console.log("remove")
                  ui.remove()
               } else if (!uiIsInjected && ourLink) {
                  console.log("append")

                  const div = document.createElement("iframe")
                  div.id = "fatebook-ui"
                  div.src = "https://fatebook.io/"
                  div.style.zoom = ".1"
                  div.style.width = "100%"
                  div.style.height = "2000px"

                  comment.appendChild(div)
               }
            }
         }

         // Create an observer instance linked to the callback function
         const observer = new MutationObserver(callback)
         observer.observe(commentParent, config)
      }
   }, 1000)

   let popupParent
   const intervalPopup = setInterval(() => {
      popupParent = document.querySelector(".docs-linkbubble-bubble")
      if (!popupParent) return
      else {
         clearInterval(intervalPopup)

         // Options for the observer (which mutations to observe)
         const config = { attributes: true, childList: true, subtree: true }

         // Callback function to execute when mutations are observed
         const callback = (mutationList, observer) => {
            const href = popupParent.querySelector("a").href
            const ourLink = href.includes("example.com")

            const ui = popupParent.querySelector("#fatebook-ui")
            const uiIsInjected = !!ui

            if (uiIsInjected && !ourLink) {
               console.log("remove")
               ui.remove()
            } else if (!uiIsInjected && ourLink) {
               console.log("append")
               const div = document.createElement("iframe")
               div.id = "fatebook-ui"
               div.src = "https://fatebook.io/"
               div.style.zoom = ".1"
               div.style.width = "100%"
               div.style.height = "2000px"

               popupParent.appendChild(div)
            }
         }

         // Create an observer instance linked to the callback function
         const observer = new MutationObserver(callback)
         observer.observe(popupParent, config)
      }
   }, 1000)

   let commentTray
   const commentTrayInterval = setInterval(() => {
      commentTray = document.querySelector(".docs-instant-docos-content")
      if (!commentTray) return
      else {
         clearInterval(commentTrayInterval)

         const div = document.createElement("div")
         div.innerText = "ADD PREDICTION"

         

         commentTray.appendChild(div)

         // // Options for the observer (which mutations to observe)
         // const config = { attributes: true, childList: true, subtree: true }

         // // Callback function to execute when mutations are observed
         // const callback = (mutationList, observer) => {
         //    const href = popupParent.querySelector("a").href
         //    const ourLink = href.includes("example.com")

         //    const ui = popupParent.querySelector("#fatebook-ui")
         //    const uiIsInjected = !!ui

         //    if (uiIsInjected && !ourLink) {
         //       console.log("remove")
         //       ui.remove()
         //    } else if (!uiIsInjected && ourLink) {
         //       console.log("append")
         //       const div = document.createElement("iframe")
         //       div.id = "fatebook-ui"
         //       div.src = "https://fatebook.io/"
         //       div.style.zoom = ".1"
         //       div.style.width = "100%"
         //       div.style.height = "2000px"

         //       popupParent.appendChild(div)
         //    }
         // }

         // // Create an observer instance linked to the callback function
         // const observer = new MutationObserver(callback)
         // observer.observe(popupParent, config)
      }
   }, 1000)
})()
