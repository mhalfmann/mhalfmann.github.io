window.addEventListener("load", () => {

    let docs = document.querySelectorAll(".doc")

    docs.forEach(doc => {
        let pre = document.createElement("pre")
        let code = document.createElement("code")
        pre.appendChild(code)

        code.className = "snippet language-html"
        code.innerText = doc.innerHTML
        doc.appendChild(pre)
    })


    loadPrism()

})


async function loadPrism() {
    await loadPrismJS().catch(console.error)
    await loadPrismCSS().catch(console.error)


    // This is required, otherwise the elements are shown in one line.
    // Taken from: https://github.com/PrismJS/prism/issues/1764#issuecomment-467677558
    Prism.hooks.add('before-highlight', function (env) {
        //Fix all empty attributes 
        let fixed = env.element.innerText.replace(/=""/g, "")
        env.code = fixed;

    });

    let codeBlocks = document.querySelectorAll("code")

    codeBlocks.forEach(code => {

        Prism.highlightElement(code)
    })

}

async function loadPrismCSS() {
    return new Promise((resolve, reject) => {
        let css = document.createElement("link")

        css.onload = function () {
            resolve()
        }

        css.onerror = function () {
            reject("Could not load prism css.")
        }

        css.setAttribute("rel", "stylesheet")
        css.setAttribute("type", "text/css")
        css.setAttribute("href", "assets/js/prism/prism.css")

        document.head.appendChild(css)

    })
}

async function loadPrismJS() {
    return new Promise((resolve, reject) => {
        var script = document.createElement('script');
        script.setAttribute("data-manual", true)
        script.onload = function () {
            //do stuff with the script
            resolve()
        };

        script.onerror = function () {
            reject("Could not load prism script. Layout of code snippes will not be highlighted.")
        }

        script.src = "assets/js/prism/prism.js";

        document.head.appendChild(script); //or something of the likes
    })

}