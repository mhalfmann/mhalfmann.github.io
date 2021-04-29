window.addEventListener("message", this.receiveMessage.bind(this), false)


let contentWindow = null
let target = null 
document.querySelectorAll(".preview").forEach((preview) => {
    preview.addEventListener("click", (e) => {
        e.preventDefault()
        target = e.currentTarget.getAttribute("href")
        contentWindow = window.open(target, "_blank")
    })
})


function receiveMessage(event) {
    let type = event.data.type
    if (type == "loadedpage") {
        if (contentWindow && target) {

            target.split()

            let page = new Page({
                src: "",
                layout: "../../../app/styles/themes/iwmgrey_flex"
            }, {})

            contentWindow.postMessage({
                type: "initpage", details: {
                    pageinfo: page
                }
            }, "*")
        }
    }
}
