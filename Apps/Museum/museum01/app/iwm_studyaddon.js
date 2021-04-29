//
// description:		module for enabling iwmstudy features in content pages, please
//					use window.iwmstudy_access for JavaScript access from your content
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class StudyAccess {
    //available as window.iwmstudy_access
    constructor() {
        this.additionallogdata = {} //in addition to html formdata
        this.nextbutton_targetpage = null //possibility to overwrite next target and still use nextbutton
        this.util = new Util() //utility functions
        Util.disableContextMenu()
    }

    linkto(target = null) {
        this.restricted.targetpage = target
        this.restricted.changePage(null)
    }

    linkback() {
        this.restricted.previousPage()
    }

    getPageinfo() {
        return this.restricted.pageinfo
    }

    getPagegroupinfo() {
        return this.restricted.pagegroupinfo
    }

    getStudyinfo() {
        return this.restricted.studyinfo
    }

    getRuntimeData() {
        return this.restricted.studyinfo.runtimedata
    }

    getExistingLogData() {
        return this.restricted.existinglogdata
    }

    logAction(action, data = {}) {
        this.restricted.logAction(action, data)
    }

    logAnonymousData(type, data = {}) {
        this.restricted.logAnonymousData(type, data)
    }

    storeFile(filename, blob) {
        this.restricted.storeFile(filename, blob)
    }

    addInitFunction(funct) {
        if (this.isExistingLogDataReady()) {
            funct()
        } else {
            setTimeout(this.addInitFunction.bind(this), 100, funct)
        }
    }

    addFinalizeFunction(funct, async = false) {
        this.restricted.finalizefunction = funct
        this.restricted.finalizeasyncwait = async
    }

    removeFinalizeFunctionAsyncWait() {
        this.restricted.finalizeasyncwait = false
    }

    isPageReady() {
        return this.restricted.pageready
    }

    isExistingLogDataReady() {
        return this.restricted.existinglogdataready
    }

    enableNextButton() {
        this.restricted.nextbutton.removeAttribute("disabled")
        this.restricted.nextbutton.style.color = "#606060"
        this.restricted.nextbuttonmanualdisabled = false
    }

    disableNextButton() {
        this.restricted.nextbutton.style.color = "#cccccc"
        this.restricted.nextbutton.setAttribute("disabled", "true")
        this.restricted.nextbuttonmanualdisabled = true
    }

    doRPC(target, rpcname, rpcparams = []) {
        this.restricted.sendMessageToStudy("outgoingrpc", { target: target, rpcname: rpcname, rpcparams: rpcparams })
        this.logAction("rpcout", { target: target, rpcname: rpcname, rpcparams: rpcparams })
    }

    registerFunctionForIncomingRPC(rpcname, funct) {
        this.restricted.rpcfunctions.set(rpcname, funct)
    }

    sendChatMessage(text) {
        this.restricted.sendMessageToStudy("outgoingchat", { text: text })
        this.logAction("chatout", { value: text })
    }

    setChatReceiveFunction(funct) {
        // funct parameters sender, text
        this.restricted.chatreceivefunction = funct
    }
}

class Util {
    constructor() {}

    static disableContextMenu() {
        document.addEventListener("contextmenu", function (e) {
            e.preventDefault()
        })
    }

    generateRandomString(length) {
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        var result = ""
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
        return result
    }

    generateRandomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    generateUUID() {
        var d = new Date().getTime()
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            d += performance.now() //use high-precision timer if available
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
        })
    }

    shuffleArray(originalArray) {
        let array = [].concat(originalArray)
        let currentIndex = array.length
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex -= 1
            // And swap it with the current element.
            let temporaryValue = array[currentIndex]
            array[currentIndex] = array[randomIndex]
            array[randomIndex] = temporaryValue
        }
        return array
    }
}

class GlobalTimer {
    constructor() {
        this.timings = []
        this.timer = setInterval(this.processTimings.bind(this), 250)
    }

    addTiming(id, timeout, repeat, callback, callbackparam = null) {
        let t = new Timing(id, timeout, repeat, callback, callbackparam)
        this.timings.push(t)
    }

    removeTiming(id) {
        for (let t of this.timings) {
            if (t.id == id) {
                this.timings.splice(this.timings.indexOf(t), 1)
            }
        }
    }

    processTimings(event) {
        let now = Date.now()
        for (let t of this.timings) {
            if (now >= t.nextactivation) {
                if (t.callbackparam) {
                    t.callback(...t.callbackparam)
                } else {
                    t.callback()
                }
                if (t.repeat) {
                    t.nextactivation = t.nextactivation + t.timeout
                } else {
                    this.timings.splice(this.timings.indexOf(t), 1)
                }
            }
        }
    }
}

class Timing {
    constructor(id, timeout, repeat, callback, callbackparam = null) {
        this.nextactivation = Date.now() + timeout
        this.id = id
        this.timeout = timeout
        this.repeat = repeat
        this.callback = callback
        this.callbackparam = callbackparam
    }
}

class StudyAddOn {
    constructor() {
        let url = new URL(window.location.href)
        let noaddon = url.searchParams.get("noaddon")
        if (noaddon != 1 && noaddon != "true") {
            document.body.style.visibility = "hidden"
            history.pushState({}, "")
            window.onpopstate = function (event) {
                history.pushState({}, "")
                if (event.target.location.hash == "") {
                    alert("Bitte nicht den Zur" + String.fromCharCode(252) + "ck-Button des Browsers benutzen.")
                }
            }
            if (document.title == "") {
                document.title = "IWM Study"
            }
            this.globaltimer = new GlobalTimer()
            this.studyaccess = new StudyAccess()
            this.studyaccess.restricted = this
            window.iwmstudy_access = this.studyaccess
            this.nextbutton
            this.nextbuttontext
            this.backbutton
            this.backbuttontext
            this.mintimebox
            this.mintimetext
            this.maxtimebox
            this.maxtimetext
            this.progressbox
            this.progressbar
            this.controlsbox
            this.cssref
            this.pageinfo = {}
            this.pagegroupinfo = null
            this.studyinfo = {}
            this.existinglogdata = {}
            this.starttime
            this.contentsublevel
            this.msgmode
            window.addEventListener("message", this.receiveMessage.bind(this), false)
            this.mainwindow = window.opener
            if (this.mainwindow != null) {
                this.msgmode = "browsertabs"
            } else if ((navigator.platform.substr(0, 2) === "iP" || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) && window.webkit && window.webkit.messageHandlers) {
                this.msgmode = "iwmstudyiosapp"
            } else {
                this.msgmode = "none"
                document.body.style.visibility = "visible"
                alert("Bitte melden Sie sich beim Versuchsleiter. Fehler: IWM Study ist nicht in einem weiteren Tab geoeffnet. Die Studie kann so nicht durchgefuehrt werden.")
            }
            if (this.msgmode != "none") {
                this.sendMessageToStudy("loadedpage", {})
            }
            this.finalizefunction
            this.finalizeasyncwait = false
            this.finalizerunning = false
            this.targetpage = null
            this.pageready = false
            this.existinglogdataready = false
            this.nextbuttonmanualdisabled = false
            this.keyboardnextblocked = false
            this.rpcfunctions = new Map()
            this.chatreceivefunction = null
        }
    }

    receiveMessage(event) {
        var origin = event.origin || event.originalEvent.origin // For Chrome, the origin property is in the event.originalEvent object.
        this.processMessage(event.data.type, event.data.details)
    }

    receiveiOSAppMessage(data) {
        this.processMessage(data.type, data.details)
    }

    processMessage(type, details) {
        if (type == "initpage") {
            let initdelay = 0
            if (details.pageinfo.initdelay != null) {
                initdelay = details.pageinfo.initdelay
            }
            setTimeout(this.initPage.bind(this), initdelay, details)
        } else if (type == "initexistingdata") {
            this.checkPagePreparedForData(details)
        } else if (type == "releasesyncblock") {
            if (details.syncid == this.pageinfo.syncid) {
                this.pageinfo.syncblockreleased = true
                this.logAction("syncblockreleased", { value: details.syncid })
                this.changePage()
            }
        } else if (type == "rpcin") {
            let rpcname = details.rpcname
            let rpcparams = details.rpcparams
            if (this.rpcfunctions.has(rpcname)) {
                this.rpcfunctions.get(rpcname)(...rpcparams)
                this.logAction("rpcin", { sender: details.sender, rpcname: rpcname, rpcparams: rpcparams })
            }
        } else if (type == "chatin") {
            let text = details.text
            let sender = details.sender
            if (this.chatreceivefunction != null) {
                this.chatreceivefunction(sender, text)
                this.logAction("chatin", { sender: sender, text: text })
            }
        }
    }

    checkPagePreparedForData(details) {
        if (this.pageready) {
            this.initExistingData(details.data)
        } else {
            setTimeout(this.checkPagePreparedForData.bind(this), 20, details)
        }
    }

    sendMessageToStudy(type, details) {
        if (this.msgmode == "browsertabs") {
            this.mainwindow.postMessage({ type: type, details: details }, "*")
        } else if (this.msgmode == "iwmstudyiosapp") {
            window.webkit.messageHandlers.contentmsgin.postMessage({ type: type, details: details })
        }
    }

    initPage(details) {
        this.pageinfo = details.pageinfo
        this.studyinfo = details.studyinfo
        this.pagegroupinfo = details.pagegroupinfo

        this.contentsublevel = this.pageinfo["src"].split("/").length - 1
        this.subpathcorrection = ""
        for (let i = 0; i < this.contentsublevel; i++) {
            this.subpathcorrection = this.subpathcorrection + "../"
        }
        //init plugins if needed
        this.initializePlugins()
        //load favicon and css
        let iconref = document.createElement("link")
        iconref.rel = "icon"
        iconref.type = "image/x-icon"
        iconref.href = `${this.subpathcorrection}../../../favicon.ico`
        document.head.appendChild(iconref)
        this.cssref = document.createElement("link")
        this.cssref.rel = "stylesheet"
        this.cssref.type = "text/css"
        this.cssref.href = `${this.subpathcorrection}../config/${this.pageinfo.layout}.css`
        this.cssref.addEventListener("load", this.initPageStep2.bind(this))
        document.head.appendChild(this.cssref)
    }

    addScript(src) {
        let s = document.createElement("script")
        s.setAttribute("src", src)
        document.body.appendChild(s)
    }

    initializePlugins() {
        //plugin dragndrop
        let dndelements = document.querySelectorAll(
            "div.iwmstudy_question_dndcloze, div.iwmstudy_question_dndimg2img, div.iwmstudy_question_dndimg2txt, div.iwmstudy_question_dndimgs2img, div.iwmstudy_question_dndlabeling, div.iwmstudy_question_dndtxt2img, div.iwmstudy_question_dndtxt2txt"
        )
        if (dndelements.length > 0) {
            this.addScript(this.subpathcorrection + "../../../app/plugins/dragndrop.js")
        }
        //plugin select
        let selectelements = document.querySelectorAll("div.iwmstudy_question_selectcloze")
        if (selectelements.length > 0) {
            this.addScript(this.subpathcorrection + "../../../app/plugins/select.js")
        }
    }

    checkKey(event) {
        if (event.keyCode == this.pageinfo.keyboardnextkeycode) {
            if (!this.keyboardnextblocked) {
                this.changePage()
            }
        }
    }

    initPageStep2() {
        console.log("adding page controls")

        this.controlsbox = document.createElement("div")
        this.controlsbox.setAttribute("id", "iwmstudy_controlsbox")
        document.body.appendChild(this.controlsbox)

        this.progressbox = document.createElement("div")
        this.progressbox.setAttribute("id", "iwmstudy_progressbox")
        this.progressbar = document.createElement("div")
        this.progressbar.setAttribute("id", "iwmstudy_progressbar")
        this.progressbox.appendChild(this.progressbar)
        document.body.appendChild(this.progressbox)
        this.calculateProgressbar()

        this.mintimebox = document.createElement("div")
        this.mintimebox.setAttribute("id", "iwmstudy_mintimebox")
        this.mintimetext = document.createTextNode(this.pageinfo.mintimelabel + "00:00")
        this.mintimebox.appendChild(this.mintimetext)
        this.mintimebox.style.visibility = "hidden"
        document.body.appendChild(this.mintimebox)

        this.maxtimebox = document.createElement("div")
        this.maxtimebox.setAttribute("id", "iwmstudy_maxtimebox")
        this.maxtimetext = document.createTextNode(this.pageinfo.maxtimelabel + "00:00")
        this.maxtimebox.appendChild(this.maxtimetext)
        this.maxtimebox.style.visibility = "hidden"
        document.body.appendChild(this.maxtimebox)

        this.backbutton = document.createElement("button")
        this.backbutton.setAttribute("type", "button")
        this.backbutton.setAttribute("id", "iwmstudy_backbutton")
        this.backbuttontext = document.createTextNode(this.pageinfo.backlabel)
        this.backbutton.appendChild(this.backbuttontext)
        document.body.appendChild(this.backbutton)
        this.backbutton.addEventListener("click", this.previousPage.bind(this))

        this.nextbutton = document.createElement("button")
        this.nextbutton.setAttribute("type", "button")
        this.nextbutton.setAttribute("id", "iwmstudy_nextbutton")
        this.nextbuttontext = document.createTextNode(this.pageinfo.nextlabel)
        this.nextbutton.appendChild(this.nextbuttontext)
        document.body.appendChild(this.nextbutton)
        this.nextbutton.addEventListener("click", this.changePage.bind(this))

        if (!this.pageinfo.isnextallowed) {
            this.nextbutton.style.color = "#cccccc"
            this.nextbutton.setAttribute("disabled", "true")
            this.nextbuttonmanualdisabled = true
            this.keyboardnextblocked = true
        }
        if (!this.pageinfo.isbackallowed || this.pageinfo.isfirstpage) {
            this.backbutton.style.color = "#cccccc"
            this.backbutton.setAttribute("disabled", "true")
        }

        this.starttime = Date.now()

        if (this.pageinfo.mintime || (this.pagegroupinfo && this.pagegroupinfo.mintime)) {
            this.keyboardnextblocked = true
            this.globaltimer.addTiming("mintime", 1000, true, this.processMinTime.bind(this))
            this.mintimetext.nodeValue = this.pageinfo.mintimelabel + this.formatTimer(Math.round(this.getMinTimeLeft()))
            this.mintimebox.style.visibility = "visible"
            this.nextbutton.setAttribute("disabled", "true")
            this.backbutton.setAttribute("disabled", "true")
            this.nextbutton.style.color = "#cccccc"
            this.backbutton.style.color = "#cccccc"
            this.processMinTime()
        }
        if (this.pageinfo.maxtime || (this.pagegroupinfo && this.pagegroupinfo.maxtime)) {
            this.globaltimer.addTiming("maxtime", 1000, true, this.processMaxTime.bind(this))
            this.maxtimetext.nodeValue = this.pageinfo.maxtimelabel + this.formatTimer(Math.round(this.getMaxTimeLeft()))
            this.maxtimebox.style.visibility = "visible"
            this.processMaxTime()
        }

        if (this.pageinfo.iscontrolsvisible == false) {
            this.controlsbox.style.visibility = "hidden"
            this.progressbox.style.visibility = "hidden"
            this.mintimebox.style.visibility = "hidden"
            this.maxtimebox.style.visibility = "hidden"
            this.backbutton.style.visibility = "hidden"
            this.nextbutton.style.visibility = "hidden"
        }

        if (this.pageinfo.keyboardnextkeycode != null) {
            document.addEventListener("keyup", this.checkKey.bind(this))
        }

        this.addInputElementWatcher()
        this.computeNextButtonStatus()
        if (this.pageinfo.isloggingmedia) {
            this.addVideoActionLogging()
            this.addAudioActionLogging()
        }
        window.addEventListener("resize", this.screenResized.bind(this))
        document.body.style.visibility = "visible"
        this.pageready = true
        if (this.pageinfo.isfirstpage) {
            this.logAction("condition", { value: this.studyinfo.conditionid })
            this.logAction("initialdata", { value: this.studyinfo.initialdata })
            this.logAction("userAgent", { value: window.navigator.userAgent.replace(/;/g, ",") })
            this.logAction("screen", { value: window.screen.width + "x" + window.screen.height })
            this.logAction("windowInnerSize", { value: window.innerWidth + "x" + window.innerHeight })
            let bi = this.studyinfo.browserinfo
            this.logAction("browserinfo", { value: bi.browser.name + "|" + bi.browser.major + "|" + bi.os.name + "|" + bi.os.version + "|" + bi.device.type + "|" + bi.cpu.architecture })
        }
        if (this.pageinfo.syncblockreleased == false) {
            this.sendMessageToStudy("reachedsyncpoint", { syncid: this.pageinfo.syncid })
            this.logAction("reachedsyncpoint", { value: this.pageinfo.syncid })
        }
    }

    screenResized(event) {
        this.logAction("windowInnerSizeChange", { value: window.innerWidth + "x" + window.innerHeight })
        this.calculateProgressbar()
    }

    calculateProgressbar() {
        let pbxw = getComputedStyle(this.progressbox).width
        pbxw = parseInt(pbxw.substr(0, pbxw.length - 2))
        let progress = 1
        if (this.pageinfo.progress != null && this.pageinfo.progress < 1) {
            progress = this.pageinfo.progress
        } else if (this.pageinfo.computedprogress < 1) {
            progress = this.pageinfo.computedprogress
        }
        this.progressbar.style.width = pbxw * progress
    }

    getMinTimeLeft() {
        let mintimeleft
        if (this.pagegroupinfo != null && this.pagegroupinfo.mintime != null) {
            let now = Date.now()
            let currentpagegrouptime = now - this.starttime + this.pagegroupinfo.currenttime
            let pagegroupmintimeleft = this.pagegroupinfo.mintime - currentpagegrouptime / 1000
            if (this.pageinfo.mintime != null) {
                let currentpagetime = now - this.starttime + this.pageinfo.currenttime
                let pagemintimeleft = this.pageinfo.mintime - currentpagetime / 1000
                if (pagemintimeleft < pagegroupmintimeleft) {
                    mintimeleft = pagemintimeleft
                } else {
                    mintimeleft = pagegroupmintimeleft
                }
            } else {
                mintimeleft = pagegroupmintimeleft
            }
        } else {
            let currenttime = Date.now() - this.starttime + this.pageinfo.currenttime
            mintimeleft = this.pageinfo.mintime - currenttime / 1000
        }
        return mintimeleft
    }

    getMaxTimeLeft() {
        let timeleft
        if (this.pagegroupinfo != null && this.pagegroupinfo.maxtime != null) {
            let now = Date.now()
            let currentpagegrouptime = now - this.starttime + this.pagegroupinfo.currenttime
            let pagegrouptimeleft = this.pagegroupinfo.maxtime - currentpagegrouptime / 1000
            if (this.pageinfo.maxtime != null) {
                let currentpagetime = now - this.starttime + this.pageinfo.currenttime
                let pagetimeleft = this.pageinfo.maxtime - currentpagetime / 1000
                if (pagegrouptimeleft < pagetimeleft) {
                    timeleft = pagegrouptimeleft
                } else {
                    timeleft = pagetimeleft
                }
            } else {
                timeleft = pagegrouptimeleft
            }
        } else {
            let currenttime = Date.now() - this.starttime + this.pageinfo.currenttime
            timeleft = this.pageinfo.maxtime - currenttime / 1000
        }
        return timeleft
    }

    initExistingData(data) {
        if (data == null) {
            this.existinglogdata = {}
            this.existinglogdataready = true
        } else {
            if (this.pageinfo.isdataseparation && this.pageinfo.currentvisits > 2) {
                let keycounts = {}
                for (let key in data) {
                    let keyparts = key.split("-")
                    let keycount = 1
                    let kwocount
                    if (isNaN(keyparts[keyparts.length - 1])) {
                        kwocount = key
                    } else {
                        keycount = parseInt(keyparts.pop())
                        kwocount = keyparts.join("-")
                    }
                    keycounts[kwocount] = keycount
                }
                let modifieddata = {}
                for (let key in keycounts) {
                    let suffix = ""
                    if (keycounts[key] != 1) {
                        suffix = "-" + keycounts[key]
                    }
                    modifieddata[key] = data[key + suffix]
                }
                data = modifieddata
            }
            for (let key in data) {
                if (document.getElementById("store_" + key) != null) {
                    let el = document.getElementById("store_" + key)
                    if (
                        (el.tagName == "INPUT" && el.type == "text") ||
                        (el.tagName == "INPUT" && el.type == "hidden") ||
                        (el.tagName == "INPUT" && el.type == "number") ||
                        (el.tagName == "INPUT" && el.type == "range") ||
                        el.tagName == "TEXTAREA" ||
                        el.tagName == "SELECT"
                    ) {
                        document.getElementById("store_" + key).value = data[key]
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        if (data[key] == 1) {
                            document.getElementById("store_" + key).checked = true
                        } else {
                            document.getElementById("store_" + key).checked = false
                        }
                    }
                } else if (document.getElementById("storeopt_" + key) != null) {
                    let el = document.getElementById("storeopt_" + key)
                    if (
                        (el.tagName == "INPUT" && el.type == "text") ||
                        (el.tagName == "INPUT" && el.type == "hidden") ||
                        (el.tagName == "INPUT" && el.type == "number") ||
                        (el.tagName == "INPUT" && el.type == "range") ||
                        el.tagName == "TEXTAREA" ||
                        el.tagName == "SELECT"
                    ) {
                        document.getElementById("storeopt_" + key).value = data[key]
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        if (data[key] == 1) {
                            document.getElementById("storeopt_" + key).checked = true
                        } else {
                            document.getElementById("storeopt_" + key).checked = false
                        }
                    }
                } else if (document.getElementsByName("store_" + key).length != 0) {
                    let elements = document.getElementsByName("store_" + key)
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i].tagName == "INPUT" && elements[i].type == "radio" && elements[i].value == data[key]) {
                            elements[i].checked = true
                        }
                    }
                } else if (document.getElementsByName("storeopt_" + key).length != 0) {
                    let elements = document.getElementsByName("storeopt_" + key)
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i].tagName == "INPUT" && elements[i].type == "radio" && elements[i].value == data[key]) {
                            elements[i].checked = true
                        }
                    }
                }
            }
            this.existinglogdata = data
            this.existinglogdataready = true
        }
        this.computeNextButtonStatus()
    }

    processMinTime() {
        let mintimeleft = this.getMinTimeLeft()
        if (mintimeleft <= 0) {
            this.globaltimer.removeTiming("mintime")
            this.mintimetext.nodeValue = this.pageinfo.mintimelabel + "00:00"
            this.computeNextButtonStatus()
            if (this.pageinfo.isbackallowed) {
                this.backbutton.removeAttribute("disabled")
                this.backbutton.style.color = "#606060"
            }
        } else {
            this.mintimetext.nodeValue = this.pageinfo.mintimelabel + this.formatTimer(Math.round(mintimeleft))
        }
    }

    processMaxTime() {
        let timeleft = this.getMaxTimeLeft()
        if (timeleft <= 0) {
            this.globaltimer.removeTiming("maxtime")
            this.maxtimetext.nodeValue = this.pageinfo.maxtimelabel + "00:00"
            this.changePage()
        } else {
            this.maxtimetext.nodeValue = this.pageinfo.maxtimelabel + this.formatTimer(Math.round(timeleft))
        }
    }

    formatTimer(sec) {
        if (sec > 0) {
            let minutes = Math.floor(sec / 60)
            let seconds = sec - minutes * 60
            if (minutes < 10) {
                minutes = "0" + minutes
            }
            if (seconds < 10) {
                seconds = "0" + seconds
            }
            return minutes + ":" + seconds
        } else {
            return "00:00"
        }
    }

    changePage(event = null) {
        this.nextbutton.style.color = "#cccccc"
        this.nextbutton.setAttribute("disabled", "true")
        this.backbutton.style.color = "#cccccc"
        this.backbutton.setAttribute("disabled", "true")
        if (!this.finalizerunning && this.finalizefunction) {
            this.finalizerunning = true
            this.finalizefunction()
        }
        if (this.finalizeasyncwait) {
            setTimeout(this.changePage.bind(this), 200)
        } else {
            let visittime = Date.now() - this.starttime
            this.logAnonymousInputData()
            let data = this.getUserInputData()
            Object.assign(data, this.studyaccess.additionallogdata)
            if (this.pageinfo.isdataseparation) {
                data = this.addVisitCount2Keys(data)
            }
            console.log("requesting next page")
            if (this.targetpage == null && this.studyaccess.nextbutton_targetpage != null) {
                this.targetpage = this.studyaccess.nextbutton_targetpage
            }
            this.sendMessageToStudy("changepage", { targetpageid: this.targetpage, logdata: data, visittime: visittime, runtimedata: this.studyinfo.runtimedata })
        }
    }

    previousPage(event = null) {
        this.nextbutton.style.color = "#cccccc"
        this.nextbutton.setAttribute("disabled", "true")
        this.backbutton.style.color = "#cccccc"
        this.backbutton.setAttribute("disabled", "true")
        if (!this.finalizerunning && this.finalizefunction) {
            this.finalizerunning = true
            this.finalizefunction()
        }
        if (this.finalizeasyncwait) {
            setTimeout(this.previousPage.bind(this), 200)
        } else {
            let visittime = Date.now() - this.starttime
            this.logAnonymousInputData()
            let data = this.getUserInputData()
            Object.assign(data, this.studyaccess.additionallogdata)
            if (this.pageinfo.isdataseparation) {
                data = this.addVisitCount2Keys(data)
            }
            console.log("requesting previous page")
            this.sendMessageToStudy("previouspage", { logdata: data, visittime: visittime, runtimedata: this.studyinfo.runtimedata })
        }
    }

    isComponentID(id) {
        if (iwmstudy_access.components != null) {
            for (let i = 0; i < iwmstudy_access.components.length; i++) {
                let compid = iwmstudy_access.components[i].id
                if (id == compid) {
                    return true
                }
            }
        } else return false
    }

    getUserInputData() {
        let allElements = document.getElementsByTagName("*")
        let data = {}
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            let elstoreid
            if (el.id && !this.isComponentID(el.id)) {
                if (el.id.substr(0, 6) == "store_" || el.id.substr(0, 9) == "storeopt_") {
                    if (el.id.substr(0, 6) == "store_") {
                        elstoreid = el.id.substring(6)
                    } else {
                        elstoreid = el.id.substring(9)
                    }
                    if (el.tagName == "INPUT" && el.type == "text") {
                        data[elstoreid] = el.value
                    } else if (el.tagName == "INPUT" && el.type == "hidden") {
                        data[elstoreid] = el.value
                    } else if (el.tagName == "INPUT" && el.type == "number") {
                        data[elstoreid] = el.value
                    } else if (el.tagName == "INPUT" && el.type == "range") {
                        data[elstoreid] = el.value
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        if (el.checked) {
                            data[elstoreid] = "1"
                        } else {
                            data[elstoreid] = "0"
                        }
                    } else if (el.tagName == "TEXTAREA") {
                        data[elstoreid] = el.value
                    } else if (el.tagName == "SELECT") {
                        data[elstoreid] = el.value
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 6) == "store_" || el.name.substr(0, 9) == "storeopt_") {
                    if (el.name.substr(0, 6) == "store_") {
                        elstoreid = el.name.substring(6)
                    } else {
                        elstoreid = el.name.substring(9)
                    }
                    if (el.tagName == "INPUT" && el.type == "radio") {
                        if (el.checked) {
                            data[elstoreid] = el.value
                        }
                    }
                }
            }
        }
        //component data
        if (iwmstudy_access.components != null) {
            for (let i = 0; i < iwmstudy_access.components.length; i++) {
                let component = iwmstudy_access.components[i]
                let id = component.id
                if (id != null && (id.substr(0, 6) == "store_" || id.substr(0, 9) == "storeopt_")) {
                    let elstoreid
                    if (id.substr(0, 6) == "store_") {
                        elstoreid = id.substring(6)
                    } else if (id.substr(0, 9) == "storeopt_") {
                        elstoreid = id.substring(9)
                    }
                    for (let key in component.data) {
                        data[elstoreid + "_" + key] = component.data[key]
                    }
                }
            }
        }
        return data
    }

    addVisitCount2Keys(data) {
        let cv = iwmstudy_access.getPageinfo().currentvisits
        if (cv > 1) {
            let renameddata = {}
            for (let key in data) {
                renameddata[key + "-" + cv] = data[key]
            }
            return renameddata
        } else {
            return data
        }
    }

    logAnonymousInputData() {
        let allElements = document.getElementsByTagName("*")
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            let elstoreid
            if (el.id && !this.isComponentID(el.id)) {
                if (el.id.substr(0, 12) == "storeanonym_" || el.id.substr(0, 15) == "storeoptanonym_") {
                    if (el.id.substr(0, 12) == "storeanonym_") {
                        elstoreid = el.id.substring(12)
                    } else {
                        elstoreid = el.id.substring(15)
                    }
                    if (el.tagName == "INPUT" && el.type == "text") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    } else if (el.tagName == "INPUT" && el.type == "hidden") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    } else if (el.tagName == "INPUT" && el.type == "number") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    } else if (el.tagName == "INPUT" && el.type == "range") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        if (el.checked) {
                            this.logAnonymousInputDataField(elstoreid, "1")
                        } else {
                            this.logAnonymousInputDataField(elstoreid, "0")
                        }
                    } else if (el.tagName == "TEXTAREA") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    } else if (el.tagName == "SELECT") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 12) == "storeanonym_" || el.name.substr(0, 15) == "storeoptanonym_") {
                    if (el.name.substr(0, 12) == "storeanonym_") {
                        elstoreid = el.name.substring(12)
                    } else {
                        elstoreid = el.name.substring(15)
                    }
                    if (el.tagName == "INPUT" && el.type == "radio") {
                        if (el.checked) {
                            this.logAnonymousInputDataField(elstoreid, el.value)
                        }
                    }
                }
            }
        }
        //component data
        if (iwmstudy_access.components != null) {
            for (let i = 0; i < iwmstudy_access.components.length; i++) {
                let component = iwmstudy_access.components[i]
                let id = component.id
                if (id != null && (id.substr(0, 12) == "storeanonym_" || id.substr(0, 15) == "storeoptanonym_")) {
                    let elstoreid
                    if (id.substr(0, 12) == "storeanonym_") {
                        elstoreid = id.substring(12)
                    } else if (id.substr(0, 15) == "storeoptanonym_") {
                        elstoreid = id.substring(15)
                    }
                    for (let key in component.data) {
                        this.logAnonymousInputDataField(elstoreid + "_" + key, component.data[key])
                    }
                }
            }
        }
    }

    computeNextButtonStatus() {
        console.log("computing next button status")
        let permitted = true
        if (this.pageinfo.syncblockreleased == false) {
            permitted = false
        }
        if (!this.allInputElementsFilled()) {
            permitted = false
        }
        let mintimeleft = this.getMinTimeLeft()
        if (mintimeleft > 0) {
            permitted = false
        }
        if (this.nextbuttonmanualdisabled) {
            permitted = false
        }
        if (permitted) {
            this.nextbutton.removeAttribute("disabled")
            this.nextbutton.style.color = "#606060"
            this.keyboardnextblocked = false
        } else {
            this.nextbutton.style.color = "#cccccc"
            this.nextbutton.setAttribute("disabled", "true")
            this.keyboardnextblocked = true
        }
    }

    allInputElementsFilled() {
        let allElements = document.getElementsByTagName("*")
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            if (el.id && !this.isComponentID(el.id)) {
                if (el.id.substr(0, 6) == "store_" || el.id.substr(0, 12) == "storeanonym_") {
                    if (el.tagName == "INPUT" && el.type == "text") {
                        if (el.value == "") return false
                    } else if (el.tagName == "INPUT" && el.type == "hidden") {
                        if (el.value == "") return false
                    } else if (el.tagName == "INPUT" && el.type == "number") {
                        if (el.value == "") return false
                    } else if (el.tagName == "INPUT" && el.type == "range") {
                        if (el.value == "") return false
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        if (!el.checked) return false
                    } else if (el.tagName == "TEXTAREA") {
                        if (el.value == "") return false
                    } else if (el.tagName == "SELECT") {
                        if (el.value == "") return false
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 6) == "store_" || el.name.substr(0, 12) == "storeanonym_") {
                    if (el.tagName == "INPUT" && el.type == "radio") {
                        let onechecked = false
                        let rbcount = document.getElementsByName(el.name).length
                        for (let i = 0; i < rbcount; i++) {
                            if (document.getElementsByName(el.name)[i].checked) {
                                onechecked = true
                            }
                        }
                        if (!onechecked) return false
                    }
                }
            }
        }
        //components
        if (iwmstudy_access.components != null) {
            for (let i = 0; i < iwmstudy_access.components.length; i++) {
                let component = iwmstudy_access.components[i]
                let id = component.id
                if (id != null && (id.substr(0, 6) == "store_" || id.substr(0, 12) == "storeanonym_")) {
                    if (component.validate() == false) {
                        return false
                    }
                }
            }
        }
        return true
    }

    addInputElementWatcher() {
        let allElements = document.getElementsByTagName("*")
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            if (el.id && !this.isComponentID(el.id)) {
                if (el.id.substr(0, 6) == "store_" || el.id.substr(0, 12) == "storeanonym_") {
                    if (el.tagName == "INPUT" && el.type == "text") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "INPUT" && el.type == "hidden") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "INPUT" && el.type == "number") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "INPUT" && el.type == "range") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "INPUT" && el.type == "checkbox") {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "TEXTAREA") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    } else if (el.tagName == "SELECT") {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 6) == "store_" || el.name.substr(0, 12) == "storeanonym_") {
                    if (el.tagName == "INPUT" && el.type == "radio") {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    }
                }
            }
        }
        //components
        if (iwmstudy_access.components != null) {
            for (let i = 0; i < iwmstudy_access.components.length; i++) {
                let component = iwmstudy_access.components[i]
                let id = component.id
                if (id != null && (id.substr(0, 6) == "store_" || id.substr(0, 12) == "storeanonym_")) {
                    component.element.addEventListener("change", this.computeNextButtonStatus.bind(this))
                }
            }
        }
    }

    addVideoActionLogging() {
        let videoElements = document.getElementsByTagName("video")
        for (let i = 0; i < videoElements.length; i++) {
            videoElements[i].onplay = (e) => {
                this.logAction("videoplay", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onpause = (e) => {
                this.logAction("videopause", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onseeking = (e) => {
                this.logAction("videoseeking", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onseeked = (e) => {
                this.logAction("videoseeked", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
        }
    }

    addAudioActionLogging() {
        let audioElements = document.getElementsByTagName("audio")
        for (let i = 0; i < audioElements.length; i++) {
            audioElements[i].onplay = (e) => {
                this.logAction("audioplay", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onpause = (e) => {
                this.logAction("audiopause", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onseeking = (e) => {
                this.logAction("audioseeking", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onseeked = (e) => {
                this.logAction("audioseeked", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
        }
    }

    logAction(action, data = {}) {
        this.sendMessageToStudy("logaction", { action: action, data: data, timestamp: Date.now(), elapsedtime: Date.now() - this.starttime })
    }

    logAnonymousData(type, data = {}) {
        this.sendMessageToStudy("loganonymousdata", { type: type, data: data, elapsedtime: Date.now() - this.starttime })
    }

    logAnonymousInputDataField(key, value) {
        let data = {}
        data[key] = value
        this.sendMessageToStudy("loganonymousdata", { type: "formelement", data: data, elapsedtime: 0 })
    }

    storeFile(filename, blob) {
        this.sendMessageToStudy("storefile", { filename: filename, blob: blob, creationtime: Date.now() })
    }
}

window.iwmstudy_restrictedaddon = new StudyAddOn()

/**
 * Komponenten sind vorgefertigte Eingabefelder, die für bestimmte Fragetypen eingesetzt werden können.
 * Diese können vom Studienleiter mit einfachem HTML angelegt werden um komplexe Interaktionen zu ermöglichen.
 *
 * Sie beinhaltet Funktionalitäten, wie Validierung und Datenmanagement
 * um für alle Komponenten eine einheitliche Basis zu gewährleisten.
 * @memberof Komponenten
 * @abstract
 */
class StudyComponent {
    /**
     * Erzeugt eine StudyComponent.
     *
     * @param {DomElement} element - Das Element auf das die Klasse angewendet wird.
     */
    constructor(element) {
        this.element = element
        this.extractPropertiesFromElement()
        this.preprocess()
    }

    /**
     * Initialisiert die Komponente.
     *
     * Wird in der Regel einmalig von der *StudyComponent.initializePlugin* Methode aufgerufen.
     */
    initialize() {
        if (!this.validateTemplate()) {
            console.trace("Das Template enthält Fehler!")
            return
        }
        this.restructure()
        if (!this.validateStructure()) {
            console.trace("Erzeugte Struktur konnte nicht validiert werden!")
            return
        }
        this.setup()
        this.starttime = Date.now()
        this.changed()
    }

    /**
     * Definiert die Attribute, die von dem Dom Element extrahiert und
     * werte in der Basisklasse überschreiben.
     *
     * @example <caption>Ein gängiges Beispiel hierfür wäre die 'debug' Eigenschaft. Die Eigenschaft 'data-debug' würde das gesetzte Debug Verhalten überschreiben.</caption>
     * <div class="iwmstudy_component" data-debug></div>
     *
     * @protected
     * @returns {String[]} - Ein Array von verfügbaren HTML Attributen.
     */
    get htmlAttributes() {
        return ["debug", "actions"]
    }

    /**
     * Validiert das geschrieben HTML-Template der Klasse auf Fehler.
     * Falls es Fehler gibt, sollten diese dem Nutzer mit der *logDomError* Methode angezeigt werden.
     *
     * Wird bei der Initialisierung automatisch aufgerufen.
     *
     * @private
     * @returns {boolean} - Gibt an, ob das Template Fehler enthält.
     */
    validateTemplate() {
        return true
    }

    /**
     * Validiert die erzeugte Struktur nach der Umstrukturierung.
     * Falls es Fehler gibt, sollten diese dem Nutzer mit der *logDomError* Methode angezeigt werden.
     *
     * Wird bei der Initialisierung automatisch aufgerufen.
     *
     * @private
     * @returns {boolean}
     */
    validateStructure() {
        return true
    }

    /**
     * Liest bestimmte Attribute der Komponente aus, die Eigenschaften der Komponente überschreiben.
     *
     * @example <caption>Ein gängiges Beispiel hierfür wäre die 'debug' Eigenschaft. Die Eigenschaft 'data-debug' würde das gesetzte Debug Verhalten überschreiben.</caption>
     * <div class="iwmstudy_component" data-debug></div>
     *
     * @private
     */
    extractPropertiesFromElement() {
        this.htmlAttributes.forEach((prop) => {
            const attrName = "data-" + prop
            if (this.element.hasAttribute(attrName)) {
                let attrValue = this.element.getAttribute(attrName)
                this[prop] = attrValue === "" ? true : attrValue
                console.log(`Overwrote property ${prop} with ${this[prop]}.`)
            }
        })
    }

    /**
     * Überprüft die Grundlegende Funktionalität der StudyComponent.
     * @private
     */
    preprocess() {
        let name = this.element.getAttribute("id")

        this.element.className = this.constructor.createClassName()

        this.mode = -1
        if (!name) {
            console.warn("A Study Component will not be tracked, as it has no id attached.")
        } else {
            let opt = ""
            let options = ["store_", "storeopt_"]

            for (let index in options) {
                if (name.startsWith(options[index])) {
                    this.mode = index
                    opt = options[index]
                    break
                }
            }

            this.name = name.replace(opt, "")
        }
    }

    /**
     * Registriert alle öffentlich zugänglichen Klassen eines Plugins und führt deren Initialisierung
     * automatisch während des Seitenaufrufs aus.
     *
     * **Die Reihenfolge der Klassen ist wichtig! Kindklassen müsen vor Ihren Elternklassen erscheinen, damit diese richtig initialisiert werden**
     *
     *  @example
     * <caption>Dieses Beispiel zeigt den minimalaufbai eines Plugins:</caption>
     *
     * class SimpleComponent extends StudyComponent{
     *      static get className() {
     *          return "simple_component"
     *      }
     * }
     *
     * StudyComponent.initializePlugin()
     *
     * @static
     * @param {class[]} klasses - Alles Klassen des Plugins, die öffentlich zugänglich sein sollen.
     */
    static async initializePlugin(...klasses) {
        return new Promise((resolve) => {
            let components = []

            klasses.forEach((klass) => {
                let klass_components = klass.initialize()
                components.push(...klass_components)
            })

            // Disable the context menu!
            window.oncontextmenu = function (event) {
                event.preventDefault()
                event.stopPropagation()
                return false
            }

            resolve(components)
        })
    }

    /**
     * Sucht alle Elemente mit dem Klassennamen der Komponente und erzeugt eine
     * StudyComponent aus diesen.
     *
     * NOTE: Kindklassen müssen zuerst initialisiert werden. Ist das nicht der Fall, dann werden
     * die Elternklassen angewandt und die Kindklassen als initialisiert markiert. Dadurch werden
     * diese nie korrekt angewandt.
     *
     * @param {object} options - Ein optionales Options-Objekt.
     * @returns {StudyComponent[]} - Gibt ein Array aller erstellten Komponenten zurück.
     */
    static initialize(options) {
        let components = []
        let elements = document.querySelectorAll("." + this.className)
        elements.forEach((element) => {
            if (!element.hasAttribute("data-initialized")) {
                let component = new this(element, options)

                window.iwmstudy_access = window.iwmstudy_access || {}
                window.iwmstudy_access.components = window.iwmstudy_access.components || []
                window.iwmstudy_access.components.push(component)

                component.initialize()
                components.push(component)
                element.setAttribute("data-initialized", true)
            }
        })
        return components
    }

    /**
     * Initialisiert die Komponente
     *
     * @abstract
     * @protected
     */
    setup() {
        this.constructor.abstractPropertyError("setup")
    }

    /**
     * Erzeugt eine neue HTML Struktur aus dem geschriebenen HTML Template.
     *
     * @abstract
     * @protected
     */
    restructure() {
        this.constructor.abstractPropertyError("restructure")
    }

    /**
     * Get's triggered when the component changes.
     *
     * @protected
     */
    changed(event) {
        this.element.dispatchEvent(new window.Event("change", { bubbles: true }))
        let valid = this.validate()

        if (this.debug) {
            this.updateValidation(valid)
        }
    }

    /**
     * Setzt die Klasse 'valid' oder 'invalid' je nach übergebenen Parameter.
     * Sollte nur im Debug-Modus aufgerufen werden. Das entsprechende Styling wird
     * vom CSS übernommen.
     *
     *
     * @private
     * @param {boolean} valid
     */
    updateValidation(valid) {
        if (valid) {
            this.element.classList.remove("invalid")
            this.element.classList.add("valid")
        } else {
            this.element.classList.remove("valid")
            this.element.classList.add("invalid")
        }
    }

    /**
     * Überprüft ob die Komponente korrekt ausgefüllt wurde.
     * @abstract
     */
    validate() {
        this.constructor.abstractPropertyError("validate")
    }

    /**
     * Setzt einen Wert in der StudyAccess.
     *
     * @param {string} key - Wert des Eingabefeldes
     * @param {any} val -
     */
    setData(key, val) {
        window.iwmstudy_access = window.iwmstudy_access || {}
        window.iwmstudy_access.additionallogdata = window.iwmstudy_access.additionallogdata || {}
        window.iwmstudy_access.additionallogdata[key] = JSON.stringify(val)
    }

    /**
     * Loggt sofort eine action mit einem Objekt, das beliebige Schlüssel/Werte enthält.
     *
     * Die StudyComponent reicht diese Befehle direct zu dem iwmstudy_access Objekt weiter.
     * In Testumgebungen wirde bei fehlen der window.iwmstudy_access, ein FakeObjekt angelegt.
     *
     * @param {*} key
     * @param {*} data
     */
    logAction(key, data = {}) {
        window.iwmstudy_access = window.iwmstudy_access || {}
        window.iwmstudy_access.actions = window.iwmstudy_access.actions || {}

        window.iwmstudy_access.logAction =
            window.iwmstudy_access.logAction ||
            function (key, data = {}) {
                window.iwmstudy_access.actions[key] = window.iwmstudy_access.actions[key] || []
                window.iwmstudy_access.actions[key].push(data)
                console.warn("Logged Action in fake storage: ", { key, data })
            }

        window.iwmstudy_access.logAction(key, data)
    }

    constructElementId(element, i) {
        return element.id ? element.id : element.innerText ? element.innerText.trim().replace(" ", "_").toLowerCase() : i
    }

    /**
     * Erzeugt eine zufällige Reihenfolge der Kindelemente.
     *
     * @param {DomElement} parent - The parent element of the dom elements that will be shuffeled.
     * @param {number} [times=2] - Factor of how often the shuffle should be repeated. If times is equal 1 the shuffle is repeated as often, as the child count of P. Default is 2.
     */
    shuffle(parent, times = 2) {
        if (parent.children.length > 0) {
            let n = 0
            while (n++ < parent.children.length * times) {
                const node = parent.children[n % parent.children.length]
                const randomPosition = Math.floor(Math.random() * (parent.children.length - 1))
                const beforeNode = parent.children[randomPosition]

                parent.insertBefore(beforeNode, node)
            }
        }
    }

    /**
     * Sucht ein Element, das zwingend für die Komponente benötigt wird.
     * Im Debug-Modus wird ein Fehler im DOM angezeigt, falls das Element nicht vorhanden ist.
     *
     * @param {string} selector - Der selector des Elements.
     */
    getRequiredDomElement(selector) {
        let element = this.element.querySelector(selector)
        if (this.debug && !element) this.logDomError("Pflichtelement fehlt: " + selector)
        return element
    }

    /**
     * Zeigt einen Fehler direkt am Element an um dem Versuchsleiter sofort eine Lösung aufzuzeigen.
     * Diese Fehler werden nur im Debug-Modus angezeigt
     *
     * @param {*} msg
     */
    logDomError(msg) {
        let errorbox = document.createElement("div")
        errorbox.className = "errorbox"

        let errormessage = document.createElement("p")
        errormessage.innerText = msg

        errorbox.appendChild(errormessage)
        this.element.appendChild(errorbox)
    }

    /**
     * Fügt einen Fehler direkt an einem Element hinzu.
     * Dadurch sieht der Versuchsleiter sofort, dass ein Fehler aufgetreten ist.
     *
     * @protected
     * @param {DomElement} element
     * @param {string} msg
     */
    elementError(element, msg) {
        let error = element.querySelector(".error_window")
        if (!error) {
            error = document.createElement("div")
            error.classList.add("error_window")
            error.classList.add("hidden")
            element.appendChild(error)
            element.addEventListener("click", () => {
                error.classList.toggle("hidden")
            })
        }

        let text = document.createElement("p")
        text.innerText = msg
        error.appendChild(text)

        element.classList.add("error")
    }

    /**
     * Gibt einen Fehler aus, wenn eine Abstrakte Methode in einer Kindklasse nicht überladen wurde.
     *
     * @protected
     * @param {string} name - Name der abstrakten Methode
     */
    static abstractPropertyError(name) {
        console.error("Property must be overwritten: " + name)
    }

    /**
     * @protected
     * @abstract
     * @returns {string} - Klassennamen
     * @memberof StudyComponent
     */
    static get className() {
        return "iwmstudy_component"
    }

    /**
     * Generiert einen Klassennamen, der die Vererbungsstruktur der Kindklassen widerspiegelt.
     * Hierfür wird auf die Eigenschaft *className* der entsprechenden Klasse zugegriffen.
     * Implementiert die Kindklasse diesen *getter* nicht, so wird diese Kindklasse nicht in
     * der erzeugten Klassenliste aufgeführt.
     *
     * @param {StudyComponent} [context=this] - Übergibt den Kontext für den Aufruf. Dies ist nur wichtig für den rekursiven Aufruf.
     * @returns {string} - Gibt die hierarchische Struktur als KlassenListe zurück.
     *
     * @example
     * <caption>Imagine the simple inheritance of an Apple:</caption>
     *
     * class Fruit{
     * get className(){
     * return "Fruit"
     * }
     * }
     *
     * class Rosaceae {
     *     // We don't want/need to have a className for this class.
     *     // So the className getter is not set.
     * }
     *
     * class Apple {
     * get className(){
     * return "Apple"
     * }
     * }
     *
     * class Jonagold {
     * get className(){
     * return "Jonagold"
     * }
     * }
     *
     * Jonagold.createClassName() // "Fruit Apple Jonagold"
     * Apple.createClassName() // "Fruit Apple"
     * Fruit.createClassName() // "Fruit"
     *
     */
    static createClassName(context = this) {
        let prototype = Object.getPrototypeOf(context)

        const className = context.hasOwnProperty("className") ? context.className : ""

        if (prototype.createClassName == null) {
            return className
        } else return (context.createClassName(prototype) + " " + className).replace(/ +/g, " ").trim()
    }

    /**
     * Returns the current state of the study component.
     */
    get data() {
        this.constructor.abstractPropertyError("get data()")
    }
}

class Debug {
    static get className() {
        return "__debug__"
    }

    static drawPositionLabel(position, text, style = {}, labelStyle = {}) {
        if (position == null || position.x == null || position.y == null) {
            console.warn("Could not draw position label '" + text + "'.", position)
        } else {
            let d = document.createElement("div")
            d.className = this.className
            const size = 5

            Object.assign(
                d.style,
                {
                    position: "fixed",
                    backgroundColor: "red",
                    width: size + "px",
                    height: size + "px",
                    borderRadius: "50%",
                    transform: "translate(-50%,-50%)",
                    left: position.x + "px",
                    top: position.y + "px",
                    zIndex: 1000,
                    pointerEvents: "none",
                    userSelect: "none"
                },
                style
            )

            let label = document.createElement("span")
            label.innerText = text

            Object.assign(
                label.style,
                {
                    position: "absolute",
                    display: "block",
                    top: 0 + "px",
                    left: size + "px",
                    borderRadius: "3px",
                    padding: "2px 5px",
                    whiteSpace: "nowrap",
                    fontSize: "0.5em",
                    fontWeight: "bold",
                    pointerEvent: "none",
                    userSelect: "none",
                    zIndex: 1000
                },
                labelStyle
            )

            d.appendChild(label)

            document.body.appendChild(d)
        }
    }

    static clear() {
        let allDebugElements = document.querySelectorAll("." + this.className)
        console.log(allDebugElements)
        allDebugElements.forEach((element) => element.parentNode.removeChild(element))
    }
}
