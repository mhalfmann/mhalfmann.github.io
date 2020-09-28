//
// description:		module for enabling iwmstudy features in content pages, please
//					use window.iwmstudy_access for JavaScript access from your content
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class StudyAccess {		//available as window.iwmstudy_access	
    constructor() {
        this.additionallogdata = {}	//in addition to html formdata
        this.nextbutton_targetpage = null //possibility to overwrite next target and still use nextbutton
        this.util = new Util() //utility functions
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
        }
        else {
            setTimeout(this.addInitFunction.bind(this), 100, funct);
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

    isExistingLogDataReady(){
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

    doRPC(target, rpcname, rpcparams = []){
        this.restricted.sendMessageToStudy("outgoingrpc", { target: target, rpcname: rpcname, rpcparams: rpcparams })
        this.logAction("rpcout", { target: target, rpcname: rpcname, rpcparams: rpcparams })
    }

    registerFunctionForIncomingRPC(rpcname, funct){
        this.restricted.rpcfunctions.set(rpcname, funct)
    }

    sendChatMessage(text){
        this.restricted.sendMessageToStudy("outgoingchat", { text: text })
        this.logAction("chatout", { value: text })
    }

    setChatReceiveFunction(funct){
        // funct parameters sender, text 
        this.restricted.chatreceivefunction = funct
    }
}

class Util {
    constructor() {

    }

    generateRandomString(length) {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        var result = ''
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
        return result
    }

    generateRandomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    generateUUID() {
        var d = new Date().getTime()
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now() //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        });
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
                }
                else {
                    t.callback()
                }
                if (t.repeat) {
                    t.nextactivation = t.nextactivation + t.timeout
                }
                else {
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
            history.pushState({}, '')
            window.onpopstate = function (event) {
                history.pushState({}, '')
                if (event.target.location.hash == "") {
                    alert("Bitte nicht den Zur" + String.fromCharCode(252) + "ck-Button des Browsers benutzen.")
                }
            };
            if(document.title == ""){
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
            }
            else if(((navigator.platform.substr(0,2) === 'iP') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && window.webkit && window.webkit.messageHandlers ) {
                this.msgmode = "iwmstudyiosapp"
            }
            else {
                this.msgmode = "none"
                document.body.style.visibility = "visible"
                alert("Bitte melden Sie sich beim Versuchsleiter. Fehler: IWM Study ist nicht in einem weiteren Tab geoeffnet. Die Studie kann so nicht durchgefuehrt werden.")
            }
            if(this.msgmode != "none"){
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
                                         
    receiveiOSAppMessage(data){        
        this.processMessage(data.type, data.details)
    }
    
    processMessage(type, details){
        if (type == "initpage") {
            let initdelay = 0
            if(details.pageinfo.initdelay != null){
                initdelay = details.pageinfo.initdelay
            }
            setTimeout(this.initPage.bind(this), initdelay, details)
        }
        else if (type == "initexistingdata") {
            this.checkPagePreparedForData(details)
        }
        else if (type == "releasesyncblock") {
            if(details.syncid == this.pageinfo.syncid){
                this.pageinfo.syncblockreleased = true
                this.logAction("syncblockreleased", {value: details.syncid})
                this.changePage()
            }
        }
        else if (type == "rpcin") {
            let rpcname = details.rpcname
            let rpcparams = details.rpcparams
            if(this.rpcfunctions.has(rpcname)){
                this.rpcfunctions.get(rpcname)(...rpcparams)
                this.logAction("rpcin", {sender: details.sender, rpcname: rpcname, rpcparams: rpcparams})
            }
        }
        else if (type == "chatin") {
            let text = details.text
            let sender = details.sender
            if(this.chatreceivefunction != null){
                this.chatreceivefunction(sender, text)
                this.logAction("chatin", {sender: sender, text: text})
            }
        }
    }

    checkPagePreparedForData(details){
        if(this.pageready){
            this.initExistingData(details.data)
        }
        else{				
            setTimeout(this.checkPagePreparedForData.bind(this), 20, details)
        }
    }

    sendMessageToStudy(type, details) {
        if(this.msgmode == "browsertabs"){
           this.mainwindow.postMessage({ type: type, details: details }, "*")
        }
        else if(this.msgmode == "iwmstudyiosapp"){
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
        let iconref = document.createElement("link")
        iconref.rel = "icon"
        iconref.type = "image/x-icon"
        iconref.href = `${this.subpathcorrection}../../../favicon.ico`
        document.head.appendChild(iconref)
        this.cssref = document.createElement("link")
        this.cssref.rel = "stylesheet"
        this.cssref.type = "text/css"
        this.cssref.href = `${this.subpathcorrection}../config/${this.pageinfo.layout}.css`
        this.cssref.addEventListener('load', this.initPageStep2.bind(this))
        document.head.appendChild(this.cssref)
    }

    checkKey(event) {
        if (event.keyCode == this.pageinfo.keyboardnextkeycode) {
            if(!this.keyboardnextblocked){
                this.changePage()
            }
        }
    }

    initPageStep2() {
        console.log('adding page controls')

        this.controlsbox = document.createElement("div")
        this.controlsbox.setAttribute("id", "iwmstudy_controlsbox")
        document.body.appendChild(this.controlsbox)

        this.progressbox = document.createElement("div")
        this.progressbox.setAttribute("id", "iwmstudy_progressbox")
        this.progressbar = document.createElement("div")
        this.progressbar.setAttribute("id", "iwmstudy_progressbar")
        this.progressbox.appendChild(this.progressbar)
        document.body.appendChild(this.progressbox)
        let pbxw = getComputedStyle(this.progressbox).width
        pbxw = parseInt(pbxw.substr(0, pbxw.length - 2))
        if (this.pageinfo.progress != null) {
            this.progressbar.style.width = pbxw * this.pageinfo.progress
        }
        else {
            this.progressbar.style.width = pbxw * this.pageinfo.computedprogress
        }

        this.mintimebox = document.createElement("div")
        this.mintimebox.setAttribute("id", "iwmstudy_mintimebox")
        this.mintimetext = document.createTextNode("Mindestzeit: 00:00")
        this.mintimebox.appendChild(this.mintimetext)
        this.mintimebox.style.visibility = "hidden"
        document.body.appendChild(this.mintimebox)

        this.maxtimebox = document.createElement("div")
        this.maxtimebox.setAttribute("id", "iwmstudy_maxtimebox")
        this.maxtimetext = document.createTextNode("Zeitlimit: 00:00")
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
        if (!this.pageinfo.isbackallowed || this.pageinfo.isfirst) {
            this.backbutton.style.color = "#cccccc"
            this.backbutton.setAttribute("disabled", "true")
        }

        this.starttime = Date.now()

        if (this.pageinfo.mintime || (this.pagegroupinfo && this.pagegroupinfo.mintime)) {
            this.keyboardnextblocked = true
            this.globaltimer.addTiming("mintime", 1000, true, this.processMinTime.bind(this))            
            this.mintimetext.nodeValue = `Mindestzeit: ${this.formatTimer(Math.round(this.getMinTimeLeft()))}`
            this.mintimebox.style.visibility = "visible"
            this.nextbutton.setAttribute("disabled", "true")
            this.backbutton.setAttribute("disabled", "true")
            this.nextbutton.style.color = "#cccccc"
            this.backbutton.style.color = "#cccccc"
            this.processMinTime()
        }
        if (this.pageinfo.maxtime || (this.pagegroupinfo && this.pagegroupinfo.maxtime)) {
            this.globaltimer.addTiming("maxtime", 1000, true, this.processMaxTime.bind(this))
            this.maxtimetext.nodeValue = `Zeitlimit: ${this.formatTimer(Math.round(this.getMaxTimeLeft()))}`
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
        
        if (this.pageinfo.keyboardnextkeycode != "") {            
            document.addEventListener('keyup', this.checkKey.bind(this))
        }
        
        this.addInputElementWatcher()
        this.computeNextButtonStatus()
        this.addVideoActionLogging()
        this.addAudioActionLogging()
        document.body.style.visibility = "visible"
        this.pageready = true
        if(this.pageinfo.isfirst){
            this.logAction("condition", {value: this.studyinfo.conditionid})
            this.logAction("initialdata", {value: this.studyinfo.initialdata})
            this.logAction("userAgent", {value: window.navigator.userAgent.replace(/;/g,",")})
            this.logAction("screen", {value: window.screen.width + "x" + window.screen.height})
            this.logAction("windowInnerSize", {value: window.innerWidth + "x" + window.innerHeight})
        }
        if(this.pageinfo.syncblockreleased == false){            
            this.sendMessageToStudy("reachedsyncpoint", { syncid: this.pageinfo.syncid })
            this.logAction("reachedsyncpoint", { value: this.pageinfo.syncid })
        }
    }

    getMinTimeLeft(){
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
                }
                else {
                    mintimeleft = pagegroupmintimeleft
                }
            }
            else {
                mintimeleft = pagegroupmintimeleft
            }
        }
        else{           
            let currenttime = Date.now() - this.starttime + this.pageinfo.currenttime
            mintimeleft = this.pageinfo.mintime - currenttime / 1000            
        }        
        return mintimeleft
    }

    getMaxTimeLeft(){
        let timeleft
        if(this.pagegroupinfo != null && this.pagegroupinfo.maxtime != null){
            let now = Date.now()
            let currentpagegrouptime = now - this.starttime + this.pagegroupinfo.currenttime
            let pagegrouptimeleft = this.pagegroupinfo.maxtime - currentpagegrouptime / 1000
            if (this.pageinfo.maxtime != null) {
                let currentpagetime = now - this.starttime + this.pageinfo.currenttime
                let pagetimeleft = this.pageinfo.maxtime - currentpagetime / 1000
                if(pagegrouptimeleft < pagetimeleft){
                    timeleft = pagegrouptimeleft
                }
                else{
                    timeleft = pagetimeleft
                }
            }
            else{
                timeleft = pagegrouptimeleft
            }
        }
        else{
            let currenttime = Date.now() - this.starttime + this.pageinfo.currenttime
            timeleft = this.pageinfo.maxtime - currenttime / 1000            
        }        
        return timeleft
    }

    initExistingData(data) {
        if (data == null) {
            this.existinglogdata = {}
            this.existinglogdataready = true
        }
        else {
            for (let key in data) {
                if (document.getElementById("store_" + key) != null) {
                    let el = document.getElementById("store_" + key)
                    if (((el.tagName == "INPUT") && (el.type == "text")) || ((el.tagName == "INPUT") && (el.type == "hidden")) || ((el.tagName == "INPUT") && (el.type == "number")) || ((el.tagName == "INPUT") && (el.type == "range")) || (el.tagName == "TEXTAREA") || (el.tagName == "SELECT")) {
                        document.getElementById("store_" + key).value = data[key]
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        if (data[key] == 1) {
                            document.getElementById("store_" + key).checked = true
                        }
                        else {
                            document.getElementById("store_" + key).checked = false
                        }
                    }
                }
                else if (document.getElementById("storeopt_" + key) != null) {
                    let el = document.getElementById("storeopt_" + key)
                    if (((el.tagName == "INPUT") && (el.type == "text")) || ((el.tagName == "INPUT") && (el.type == "hidden")) || ((el.tagName == "INPUT") && (el.type == "number")) || ((el.tagName == "INPUT") && (el.type == "range")) || (el.tagName == "TEXTAREA") || (el.tagName == "SELECT")) {
                        document.getElementById("storeopt_" + key).value = data[key]
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        if (data[key] == 1) {
                            document.getElementById("storeopt_" + key).checked = true
                        }
                        else {
                            document.getElementById("storeopt_" + key).checked = false
                        }
                    }
                }
                else if (document.getElementsByName("store_" + key).length != 0) {
                    let elements = document.getElementsByName("store_" + key)
                    for (let i = 0; i < elements.length; i++) {
                        if ((elements[i].tagName == "INPUT") && (elements[i].type == "radio") && (elements[i].value == data[key])) {
                            elements[i].checked = true
                        }
                    }
                }
                else if (document.getElementsByName("storeopt_" + key).length != 0) {
                    let elements = document.getElementsByName("storeopt_" + key)
                    for (let i = 0; i < elements.length; i++) {
                        if ((elements[i].tagName == "INPUT") && (elements[i].type == "radio") && (elements[i].value == data[key])) {
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
            this.mintimetext.nodeValue = "Mindestzeit: 00:00"
            this.computeNextButtonStatus()
            if (this.pageinfo.isbackallowed) {
                this.backbutton.removeAttribute("disabled")
                this.backbutton.style.color = "#606060"
            }
        }
        else {
            this.mintimetext.nodeValue = `Mindestzeit: ${this.formatTimer(Math.round(mintimeleft))}`
        }
    }

    processMaxTime() {
        let timeleft = this.getMaxTimeLeft()
        if (timeleft <= 0) {
            this.globaltimer.removeTiming("maxtime")
            this.maxtimetext.nodeValue = "Zeitlimit: 00:00"
            this.changePage()
        }
        else {
            this.maxtimetext.nodeValue = `Zeitlimit: ${this.formatTimer(Math.round(timeleft))}`
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
        }
        else {
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
        }
        else {
            let visittime = Date.now() - this.starttime
            this.logAnonymousInputData()
            let data = this.getUserInputData()
            Object.assign(data, this.studyaccess.additionallogdata)
            console.log("requesting next page")
            if ((this.targetpage == null) && (this.studyaccess.nextbutton_targetpage != null)) {
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
        }
        else {
            let visittime = Date.now() - this.starttime
            this.logAnonymousInputData()
            let data = this.getUserInputData()
            Object.assign(data, this.studyaccess.additionallogdata)
            console.log("requesting previous page")
            this.sendMessageToStudy("previouspage", { logdata: data, visittime: visittime, runtimedata: this.studyinfo.runtimedata })
        }
    }

    getUserInputData() {
        let allElements = document.getElementsByTagName("*")
        let data = {}
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            let elstoreid
            if (el.id) {
                if (el.id.substr(0, 6) == "store_" || el.id.substr(0, 9) == "storeopt_") {
                    if (el.id.substr(0, 6) == "store_") {
                        elstoreid = el.id.substring(6)
                    }
                    else {
                        elstoreid = el.id.substring(9)
                    }
                    if ((el.tagName == "INPUT") && (el.type == "text")) {
                        data[elstoreid] = el.value
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "hidden")) {
                        data[elstoreid] = el.value
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "number")) {
                        data[elstoreid] = el.value
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "range")) {
                        data[elstoreid] = el.value
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        if (el.checked) {
                            data[elstoreid] = "1"
                        }
                        else {
                            data[elstoreid] = "0"
                        }
                    }
                    else if (el.tagName == "TEXTAREA") {
                        data[elstoreid] = el.value
                    }
                    else if (el.tagName == "SELECT") {
                        data[elstoreid] = el.value
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 6) == "store_" || el.name.substr(0, 9) == "storeopt_") {
                    if (el.name.substr(0, 6) == "store_") {
                        elstoreid = el.name.substring(6)
                    }
                    else {
                        elstoreid = el.name.substring(9)
                    }
                    if ((el.tagName == "INPUT") && (el.type == "radio")) {
                        if (el.checked) {
                            data[elstoreid] = el.value
                        }
                    }
                }
            }
        }
        return data
    }

    logAnonymousInputData(){
        let allElements = document.getElementsByTagName("*")        
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            let elstoreid
            if (el.id) {
                if (el.id.substr(0, 12) == "storeanonym_" || el.id.substr(0, 15) == "storeoptanonym_") {
                    if (el.id.substr(0, 12) == "storeanonym_") {
                        elstoreid = el.id.substring(12)
                    }
                    else {
                        elstoreid = el.id.substring(15)
                    }
                    if ((el.tagName == "INPUT") && (el.type == "text")) {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "hidden")) {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "number")) {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "range")) {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        if (el.checked) {
                            this.logAnonymousInputDataField(elstoreid, "1")                            
                        }
                        else {
                            this.logAnonymousInputDataField(elstoreid, "0")
                        }
                    }
                    else if (el.tagName == "TEXTAREA") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                    else if (el.tagName == "SELECT") {
                        this.logAnonymousInputDataField(elstoreid, el.value)
                    }
                }
            }
            if (el.name) {
                if (el.name.substr(0, 12) == "storeanonym_" || el.name.substr(0, 15) == "storeoptanonym_") {
                    if (el.name.substr(0, 12) == "storeanonym_") {
                        elstoreid = el.name.substring(12)
                    }
                    else {
                        elstoreid = el.name.substring(15)
                    }
                    if ((el.tagName == "INPUT") && (el.type == "radio")) {
                        if (el.checked) {
                            this.logAnonymousInputDataField(elstoreid, el.value)
                        }
                    }
                }
            }
        }        
    }

    computeNextButtonStatus() {
        console.log("computing next button status")
        let permitted = true
        if(this.pageinfo.syncblockreleased == false){
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
        }
        else {
            this.nextbutton.style.color = "#cccccc"
            this.nextbutton.setAttribute("disabled", "true")
            this.keyboardnextblocked = true
        }
    }

    allInputElementsFilled() {        
        let allElements = document.getElementsByTagName("*")
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            if (el.id) {
                if ((el.id.substr(0, 6) == "store_") || (el.id.substr(0, 12) == "storeanonym_")) {
                    if ((el.tagName == "INPUT") && (el.type == "text")) {
                        if (el.value == "") return false
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "hidden")) {
                        if (el.value == "") return false
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "number")) {
                        if (el.value == "") return false
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "range")) {
                        if (el.value == "") return false
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        if (!el.checked) return false
                    }
                    else if (el.tagName == "TEXTAREA") {
                        if (el.value == "") return false
                    }
                    else if (el.tagName == "SELECT") {
                        if (el.value == "") return false
                    }
                }
            }
            if (el.name) {
                if ((el.name.substr(0, 6) == "store_") || (el.name.substr(0, 12) == "storeanonym_")) {
                    if ((el.tagName == "INPUT") && (el.type == "radio")) {
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
        return true;
    }

    addInputElementWatcher() {
        let allElements = document.getElementsByTagName("*")
        for (let i = 0; i < allElements.length; i++) {
            let el = allElements[i]
            if (el.id) {
                if ((el.id.substr(0, 6) == "store_") || (el.id.substr(0, 12) == "storeanonym_")) {
                    if ((el.tagName == "INPUT") && (el.type == "text")) {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "hidden")) {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "number")) {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "range")) {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    }
                    else if ((el.tagName == "INPUT") && (el.type == "checkbox")) {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    }
                    else if (el.tagName == "TEXTAREA") {
                        el.addEventListener("input", this.computeNextButtonStatus.bind(this))
                    }
                    else if (el.tagName == "SELECT") {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    }
                }
            }
            if (el.name) {
                if ((el.name.substr(0, 6) == "store_") || (el.name.substr(0, 12) == "storeanonym_")) {
                    if ((el.tagName == "INPUT") && (el.type == "radio")) {
                        el.addEventListener("change", this.computeNextButtonStatus.bind(this))
                    }
                }
            }
        }
    }

    addVideoActionLogging() {
        let videoElements = document.getElementsByTagName("video")
        for (let i = 0; i < videoElements.length; i++) {
            videoElements[i].onplay = e => {
                this.logAction("videoplay", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onpause = e => {
                this.logAction("videopause", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onseeking = e => {
                this.logAction("videoseeking", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            videoElements[i].onseeked = e => {
                this.logAction("videoseeked", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
        }
    }

    addAudioActionLogging() {
        let audioElements = document.getElementsByTagName("audio")
        for (let i = 0; i < audioElements.length; i++) {
            audioElements[i].onplay = e => {
                this.logAction("audioplay", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onpause = e => {
                this.logAction("audiopause", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onseeking = e => {
                this.logAction("audioseeking", { src: e.srcElement.currentSrc, playhead: e.srcElement.currentTime })
            }
            audioElements[i].onseeked = e => {
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