//
// description:		iwmstudy main module
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class Meta {
    constructor() {
        // initial metadata
        this.apptype = "browser"
        this.apporigin
        this.loggingmode
        this.serverurl
        this.studyid
        this.preferredcondition
        this.initialdata
        this.manualfirstpage
        this.appversion
        // user metadata
        this.userid = "anonymous"
        this.password = "anonymous"
        this.group = ""
        this.email = ""
        this.userlanguage = "DE"
        // studyconfig metadata
        this.title
        this.starttime
        this.endtime
        this.loginmode
        this.standardlanguage
        this.register_groupvisible
        this.standardgroup
        this.register_emailvisible
        this.register_passwordvisible
        this.login_visible
        this.login_preset
        this.welcometext
        this.availableconditions
        this.expversion
        this.min_appversion
        this.neededuser
        // conditionconfig metadata
        this.conditionid
        // other
        this.runid        
        this.runuser = []
        this.runtimedata = new Object()
        this.runcontinued = false
        this.continuedrunuserdata = {}
        this.language
    }
}

class Study {
    constructor() {
        this.contentwindow
        this.logger        
        this.meta = new Meta()
        if (location.protocol == "file:") {
            this.meta.apporigin = "local"
        }
        else {
            this.meta.apporigin = "server"
        }
        this.flowcontrol = new FlowControl()
        this.errorprocessor = new ErrorProcessor()
        window.addEventListener('userregistrationsucceeded', this.registerUserSucceeded.bind(this))
        window.addEventListener('userregistrationfailed', this.registerUserFailed.bind(this))
        window.addEventListener('userloginsucceeded', this.loginUserSucceeded.bind(this))
        window.addEventListener('userloginfailed', this.loginUserFailed.bind(this))
        window.addEventListener('openrunresult', this.processOpenRunResult.bind(this))
        window.addEventListener('getownrunresult', this.continueOwnRun.bind(this))
        window.addEventListener('runcreated', this.processRunCreated.bind(this))
        window.addEventListener('runuserresult', this.processRunUserResult.bind(this))
        window.addEventListener('pagechosen', this.showCurrentPage.bind(this))
        window.addEventListener('pagevisitformdatarequest', this.getPagevisitFormdata.bind(this))
        window.addEventListener('initexistingdata', this.initPageWithExistingData.bind(this))
        window.addEventListener('releasesyncblock', this.releaseSyncblock.bind(this))
        window.addEventListener('incomingrpc', this.processIncomingRPC.bind(this))
        window.addEventListener('incomingchat', this.processIncomingChat.bind(this))
        window.addEventListener("message", this.receiveMessage.bind(this), false)
        if (IWM.globalconfig.headerimg != null) {
            document.getElementById("headerimg").src = IWM.globalconfig.headerimg
        }
        if (IWM.globalconfig.logoimg != null) {
            document.getElementById("logoimg").src = IWM.globalconfig.logoimg
        }
        if (IWM.globalconfig.logotext != null) {
            document.getElementById("logotext").innerHTML = IWM.globalconfig.logotext
        }
        this.meta.appversion = IWM.globalconfig.appversion
        document.getElementById("versiontext").innerText = "v. " + this.meta.appversion
        if (IWM.globalconfig.defaultloggingmode == "server") {
            document.getElementById("setupmode1").checked = true
        }
        else if (IWM.globalconfig.defaultloggingmode == "local") {
            document.getElementById("setupmode2").checked = true
            document.getElementById("setupserverurl").setAttribute('disabled', 'true')
        }
        document.getElementById("setupserverurl").value = IWM.globalconfig.defaultserverurl
        let sid = this.readURLParameter("studyid")
        if (sid == "") {
            document.getElementById("setupstudyid").value = IWM.globalconfig.defaultstudyid
        }
        else {
            document.getElementById("setupstudyid").value = sid
        }
        let cid = this.readURLParameter("conditionid")
        if (cid == "") {
            document.getElementById("setupconditionid").value = IWM.globalconfig.defaultconditionid
        }
        else {
            document.getElementById("setupconditionid").value = cid
        }        
        let idata = this.readURLParameter("initialdata")
        if (idata != "") {
            document.getElementById("setupinitialdata").value = idata
        }        
        let pid = this.readURLParameter("pageid")
        if (pid != "") {
            document.getElementById("setupfirstpage").value = pid
        }
        let setupviewvisible = IWM.globalconfig.setupviewvisible
        if (setupviewvisible == true) {
            document.getElementById("setup_view").style.display = "block"
            setupokbutton.addEventListener('click', this.processGlobalSetup.bind(this))
            setupstudyid.addEventListener("input", this.changedSetupStudyID.bind(this))
            this.changedSetupStudyID()
        }
        else {
            document.getElementById("setup_view").style.display = "none"
            this.processGlobalSetup()
        }
    }

    receiveMessage(event) {
        this.meta.apptype = "browser"
        let origin = event.origin || event.originalEvent.origin // For Chrome, the origin property is in the event.originalEvent object.
        this.processMessage(event.data.type, event.data.details)
    }
    
    receiveiOSAppMessage(data){
        this.meta.apptype = "iosapp"
        this.processMessage(data.type, data.details)
    }
    
    processMessage(type, details){
        if (type == "loadedpage") {
            this.loadedPage()
        }
        else if (type == "changepage") {
            this.changePage(details.targetpageid, details.logdata, details.visittime, details.runtimedata)
        }
        else if (type == "previouspage") {
            this.previousPage(details.logdata, details.visittime, details.runtimedata)
        }
        else if (type == "logaction") {
            this.logAction(details.action, details.data, details.timestamp, details.elapsedtime)
        }
        else if (type == "loganonymousdata") {
            this.logAnonymousData(details.type, details.data, details.elapsedtime)
        }
        else if (type == "storefile") {
            this.storeFile(details.filename, details.blob, details.creationtime)
        }
        else if (type == "reachedsyncpoint") {
            if(this.multiuser != null){
                this.multiuser.reachedSyncPoint(details.syncid)
            }
            else{
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "multiusererror", errordescription: "Fehler bei der Kommunikation zwischen Benutzern, multiuser nicht verfügbar."} })
                window.dispatchEvent(event)
            }
        }
        else if (type == "outgoingrpc") {
            if(this.multiuser != null){
                this.multiuser.sendRPC(details.target, details.rpcname, details.rpcparams)
            }
            else{
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "multiusererror", errordescription: "Fehler bei der Kommunikation zwischen Benutzern, multiuser nicht verfügbar."} })
                window.dispatchEvent(event)
            }
        }
        else if (type == "outgoingchat") {
            if(this.multiuser != null){
                this.multiuser.sendChatMessage(details.text)
            }
            else{
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "multiusererror", errordescription: "Fehler bei der Kommunikation zwischen Benutzern, multiuser nicht verfügbar."} })
                window.dispatchEvent(event)
            }
        }
    }

    sendMessageToStudyAddOn(type, details) {
        if(this.meta.apptype == "browser"){
            this.contentwindow.postMessage({ type: type, details: details }, "*")
        }
        else if(this.meta.apptype == "iosapp"){
            window.webkit.messageHandlers.mainmsgin.postMessage({ type: type, details: details })
        }
    }

    readURLParameter(name) {
        let value = decodeURIComponent((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, ""])[1])
        return (value !== 'null') ? value : false
    }

    addScript(src) {
        let s = document.createElement('script')
        s.setAttribute('src', src)
        document.body.appendChild(s)
    }

    addScriptWithCallback(src, callback) {
        let s = document.createElement('script')
        s.setAttribute('src', src)
        s.addEventListener('load', callback.bind(this))
        document.body.appendChild(s)
    }

    getRadioButtonValue(groupName) {
        let _result
        try {
            let o_radio_group = document.getElementsByName(groupName)
            for (let a = 0; a < o_radio_group.length; a++) {
                if (o_radio_group[a].checked) {
                    _result = o_radio_group[a].value
                    break;
                }
            }
        } catch (e) { }
        return _result
    }

    changedSetupStudyID() {
        let node = document.getElementById("setupcondlist")
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
        let cid = this.readURLParameter("conditionid")
        if (cid == "") {
            document.getElementById("setupconditionid").value = IWM.globalconfig.defaultconditionid
        }
        else {
            document.getElementById("setupconditionid").value = cid
        }
        console.log("trying to load studyconfig for study " + setupstudyid.value)
        this.addScriptWithCallback("./studies/" + setupstudyid.value + "/config/studyconfig.js", this.possibleStudyConfigFound)
    }

    possibleStudyConfigFound() {
        console.log(setupstudyid.value + " studyconfig loaded for condition selection")
        let c = IWM.studyconfig.conditions
        for (let i = 0; i < c.length; i++) {
            if (c[i].active) {
                let opt = document.createElement("option")
                opt.value = c[i].conditionid
                setupcondlist.appendChild(opt)
            }
        }        
    }

    processGlobalSetup() {
        console.log('processing global setup')
        document.getElementById("setup_view").style.display = "none"
        this.meta.studyid = document.getElementById("setupstudyid").value
        this.meta.serverurl = document.getElementById("setupserverurl").value
        if (document.getElementById("setupmode2").checked) {
            this.meta.loggingmode = "local"
            this.logger = new LocalLogger()
            this.logger.init(this.meta.studyid)
        }
        else if (document.getElementById("setupmode1").checked) {
            this.meta.loggingmode = "server"
            this.logger = new ServerLogger()
            this.logger.init(this.meta.studyid, this.meta.serverurl)
        }
        this.meta.preferredcondition = document.getElementById("setupconditionid").value
        this.meta.initialdata = document.getElementById("setupinitialdata").value
        this.meta.manualfirstpage = document.getElementById("setupfirstpage").value
        this.loadStudyConfig()
    }

    loadStudyConfig() {
        console.log('study configuration loading')
        IWM.studyconfig = null
        this.addScriptWithCallback("./studies/" + this.meta.studyid + "/config/studyconfig.js", this.loadStudyConfigFinished)
    }

    loadStudyConfigFinished() {
        console.log('study configuration ready')
        this.meta.title = IWM.studyconfig.title
        this.meta.expversion = IWM.studyconfig.version
        this.meta.min_appversion = IWM.studyconfig.min_appversion
        if(this.meta.appversion < this.meta.min_appversion){
            alert("Die Version " + this.meta.appversion.toString() + " der Versuchsumgebung ist nicht ausreichend für die Studie " + this.meta.studyid + ". Es wird mindestens die Version " + this.meta.min_appversion.toString() + " benoetigt. Bitte melden Sie sich beim Versuchsleiter.")
        }
        this.meta.starttime = IWM.studyconfig.starttime
        this.meta.endtime = IWM.studyconfig.endtime
        this.meta.loginmode = IWM.studyconfig.welcomepage.loginmode
        this.meta.register_groupvisible = IWM.studyconfig.welcomepage.register_groupvisible
        this.meta.standardgroup = IWM.studyconfig.welcomepage.std_group
        this.meta.register_emailvisible = IWM.studyconfig.welcomepage.register_emailvisible
        this.meta.register_passwordvisible = IWM.studyconfig.welcomepage.register_passwordvisible
        this.meta.login_visible = IWM.studyconfig.welcomepage.login_visible
        this.meta.login_preset = IWM.studyconfig.welcomepage.login_preset
        this.meta.standardlanguage = IWM.studyconfig.welcomepage.std_language
        this.meta.language = this.meta.standardlanguage
        this.meta.welcometext = IWM.studyconfig.welcomepage.welcometext
        this.refreshWelcometext()
        this.meta.availableconditions = []
        let allcond = IWM.studyconfig.conditions
        for (let i = 0; i < allcond.length; i++) {
            let con = allcond[i]
            if (con.active) {
                console.log(`condition ${con.conditionid} available`)
                this.meta.availableconditions.push({ conditionid: con.conditionid, neededuser: con.neededuser })
            }
        }
        if (this.meta.loginmode == "anonym") {
            document.getElementById("registeranonym_view").style.display = "block"
            registeranonymbutton.addEventListener('click', this.registerUser.bind(this))
        }
        else if (this.meta.loginmode == "register") {
            if(!this.meta.login_visible){
                loginform.style.display = "none"
            }
            if(this.meta.login_preset && localStorage.getItem("presetuserid") != null && localStorage.getItem("presetpassword") != null){
                loginuser.value = localStorage.getItem("presetuserid")
                loginpassword.value = localStorage.getItem("presetpassword")
            }            
            document.getElementById("register_view").style.display = "block"
            registergroup.value = this.meta.standardgroup
            if (this.meta.register_groupvisible != true) {                
                registergroup_container.style.display = "none"
            }
            if (this.meta.register_passwordvisible != true) {
                registerpassword_container.style.display = "none"
                registerpassword2_container.style.display = "none"
            }
            if (this.meta.register_emailvisible != true) {
                registeremail_container.style.display = "none"
            }
            registerbutton.addEventListener('click', this.registerUser.bind(this))
            loginbutton.addEventListener('click', this.loginUser.bind(this))
        }
        if(((navigator.platform.substr(0,2) === 'iP') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && window.webkit && window.webkit.messageHandlers ) {            
            window.webkit.messageHandlers.mainmsgin.postMessage({ type: "appmode_welcome", details: {} })
        }
    }

    refreshWelcometext() {
        let wt = this.meta.welcometext[this.meta.language]
        registerheadline.innerHTML = wt.registerheadline
        registertext.innerHTML = wt.registertext
        registerformheadline.innerHTML = wt.registerformheadline
        registergroup_label.innerHTML = wt.registerformgrouplabel
        registeruser_label.innerHTML = wt.registerformuserlabel
        registerpassword_label.innerHTML = wt.registerformpasswordlabel
        registerpassword2_label.innerHTML = wt.registerformpassword2label
        registermail_label.innerHTML = wt.registerformmaillabel
        registerbutton.innerHTML = wt.registerformbutton
        loginformheadline.innerHTML = wt.loginformheadline
        loginuser_label.innerHTML = wt.loginformuserlabel
        loginpassword_label.innerHTML = wt.loginformpasswordlabel
        loginbutton.innerHTML = wt.loginformbutton
        registeranonymheadline.innerHTML = wt.anonymheadline
        registeranonymtext.innerHTML = wt.anonymtext
        registeranonymbutton.innerHTML = wt.anonymbutton
        studyrunningheadline.innerHTML = wt.studyrunningheadline
        studyrunningtext.innerHTML = wt.studyrunningtext
        opencontentwindowbutton.innerHTML = wt.opencontentwindowbuttontext
    }

    createRandomString(length) {
        let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let result = ''
        for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
        return result
    }

    createRandomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    registerUser() {
        if (this.meta.loginmode == "anonym") {
            document.getElementById("registeranonym_view").style.display = "none"
            let d = Date.now()
            d = d.toString(36)
            let r = this.createRandomString(4)
            this.meta.userid = r + d
            this.meta.password = this.createRandomString(6)
            this.meta.group = this.meta.standardgroup
            this.logger.registerUser(this.meta.userid, this.meta.password, this.meta.email, this.meta.group)
        }
        else if (this.meta.loginmode == "register") {
            if (!this.isUseridValid(document.getElementById("registeruser").value)) {
                document.getElementById("registeruser").style.backgroundColor = "#ffcccc"
                document.getElementById("registerpassword2").style.backgroundColor = "#ffffff"
                alert("Bitte nur die Zeichen 0-9 und a-Z fuer den Benutzernamen verwenden, mindestens 5 Zeichen, maximal 32.")
            }
            else if (!this.isPasswordValid(document.getElementById("registerpassword").value, document.getElementById("registerpassword2").value)) {
                document.getElementById("registeruser").style.backgroundColor = "#ffffff"
                document.getElementById("registerpassword2").style.backgroundColor = "#ffcccc"
                alert("Passwoerter stimmen nicht ueberein.")
            }
            else {
                document.getElementById("register_view").style.display = "none"
                this.meta.userid = document.getElementById("registeruser").value
                this.meta.password = document.getElementById("registerpassword").value
                if (this.meta.password == "") {
                    this.meta.password = "experiment"
                }
                this.meta.group = document.getElementById("registergroup").value
                this.meta.email = document.getElementById("registermail").value
                this.logger.registerUser(this.meta.userid, this.meta.password, this.meta.email, this.meta.group)
            }
        }
    }

    isPasswordValid(pw1, pw2) {
        if (pw1 == pw2) {
            return true;
        }
        else {
            return false;
        }
    }

    isUseridValid(id) {
        let reguexp = /[^A-z0-9]/
        if (reguexp.test(id)) {
            return false
        }
        if (id.length < 5 || id.length > 32) {
            return false
        }
        return true
    }

    registerUserSucceeded(e) {
        console.log("user registration successfull")
        if(this.meta.login_preset){
            localStorage.setItem("presetuserid",this.meta.userid)
            localStorage.setItem("presetpassword",this.meta.password)
        }
        this.logger.getOpenRun()
    }

    registerUserFailed(e) {
        console.log("user registration failed (" + e.detail.cause + ")")
        if (e.detail.cause == "exists") {
            document.getElementById("registeruser").style.backgroundColor = "#ffcccc"
            document.getElementById("register_view").style.display = "block"
            alert("Account bereits vorhanden, bitte andere Daten eingeben.")
        }
    }

    loginUser() {
        this.meta.userid = document.getElementById("loginuser").value
        this.meta.password = document.getElementById("loginpassword").value
        document.getElementById("loginbutton").setAttribute("disabled", "true")
        document.getElementById("registerbutton").setAttribute("disabled", "true")
        this.logger.checkUserLogin(this.meta.userid, this.meta.password)
    }

    loginUserSucceeded(e) {
        console.log(`user login successfull`)
        document.getElementById("register_view").style.display = "none"
        this.meta.group = e.detail.group
        this.meta.email = e.detail.email
        this.hideRegisterView()
        this.logger.getOwnRun()
    }

    loginUserFailed(e) {
        console.log("user login failed (" + e.detail.cause + ")")
        document.getElementById("loginbutton").removeAttribute("disabled")
        document.getElementById("registerbutton").removeAttribute("disabled")
        document.getElementById("loginuser").value = ""
        document.getElementById("loginpassword").value = ""
        alert("Login fehlgeschlagen, bitte Logindaten erneut eingeben.")
    }   

    processOpenRunResult(e) {
        if (e.detail.runfound) {
            console.log(`open run found with id ${e.detail.runid} and condition ${e.detail.conditionid}`)
            this.meta.conditionid = e.detail.conditionid
            this.meta.runid = e.detail.runid
            this.meta.neededuser = e.detail.neededuser
            this.meta.runuser = e.detail.runuser.split(",")                                    
            this.loadConditionConfig()
        }
        else {
            console.log(`no open run found`)
            if (this.meta.preferredcondition) {
                for (let con of this.meta.availableconditions) {
                    if (con.conditionid == this.meta.preferredcondition) {
                        this.meta.conditionid = con.conditionid
                        this.meta.neededuser = con.neededuser
                        break;
                    }
                }
                if (!this.meta.conditionid) {
                    alert("Gewuenschte Bedingung nicht verfuegbar. Bedingung wird zufaellig ausgewaehlt.")
                }
            }
            if (!this.meta.conditionid) {
                let r = this.createRandomIntFromInterval(0, this.meta.availableconditions.length - 1)
                this.meta.conditionid = this.meta.availableconditions[r].conditionid
                this.meta.neededuser = this.meta.availableconditions[r].neededuser
            }
            this.logger.createRun(this.meta.conditionid, this.meta.neededuser, this.meta.expversion)
        }
    }    

    continueOwnRun(e) {
        console.log(`own run found with id ${e.detail.runid} and condition ${e.detail.conditionid}`)
        this.meta.conditionid = e.detail.conditionid
        this.meta.runid = e.detail.runid
        this.meta.neededuser = e.detail.neededuser
        this.meta.runuser = e.detail.runuser.split(",")
        this.meta.continuedrunuserdata = e.detail.runuserdata //own data only
        this.meta.runcontinued = true
        this.meta.runtimedata = this.meta.continuedrunuserdata["runtimedata"]        
        document.getElementById("studyrunning_view").style.display = "block"
        this.loadConditionConfig()
    }

    processRunCreated(e) {
        console.log(`run ${e.detail.runid} created`)
        this.meta.runid = e.detail.runid        
        this.meta.runuser.push(this.meta.userid)        
        this.loadConditionConfig()
    }

    processRunUserResult(e){
        this.meta.runuser = e.detail.runuser.split(",")
        this.multiuser.runuser = e.detail.runuser.split(",")
        if(this.meta.neededuser > this.meta.runuser.length){
            setTimeout(this.logger.getRunUser.bind(this.logger),10000)
        }
    }

    loadConditionConfig() {               
        if (this.meta.loggingmode == "server") {  
            if(this.meta.neededuser > this.meta.runuser.length){
                setTimeout(this.logger.getRunUser.bind(this.logger),10000)
            } 
            if(this.meta.neededuser > 1){         
                this.multiuser = new MultiUserManager(this.meta.studyid, this.meta.runid, this.meta.userid, this.meta.password, this.meta.neededuser, this.meta.runuser, this.meta.serverurl)
            }
        }
        console.log('condition configuration loading')
        this.addScriptWithCallback("./studies/" + this.meta.studyid + "/config/" + this.meta.conditionid + ".js", this.loadConditionConfigFinished)
    }

    loadConditionConfigFinished() {
        console.log('condition configuration ready')
        if (this.meta.runcontinued && this.meta.continuedrunuserdata["currentpage"] != "") {
            this.flowcontrol.initFromRunUserData(IWM.conditionconfig, this.meta.continuedrunuserdata)
        }
        else {
            this.flowcontrol.initFromConditionConfig(IWM.conditionconfig, this.meta.manualfirstpage)
        }
    }

    hideRegisterView() {
        document.getElementById("register_view").style.display = "none"        
    }

    showCurrentPage(e) {
        if (this.flowcontrol.pagecounter == 1) {
            this.hideRegisterView()
            document.getElementById("studyrunning_view").style.display = "block"
        }
        this.contentwindow = window.open(`./studies/${this.meta.studyid}/content/${e.detail.page.src}`, 'iwmStudy')
        if (this.contentwindow == null) {
            document.getElementById("opencontentwindowbutton").style.visibility = "visible"
            document.getElementById("opencontentwindowbutton").addEventListener('click', this.bypassPopupBlocker.bind(this))
        }
        else {
            this.contentwindow.focus()
        }
    }

    bypassPopupBlocker(e) {
        this.contentwindow = window.open(`./studies/${this.meta.studyid}/content/${this.flowcontrol.currentpage.src}`, 'iwmStudy')
        this.contentwindow.focus()
    }

    loadedPage() {
        console.log('loaded page')
        this.logger.pageEntered(this.flowcontrol.pagecounter, this.flowcontrol.currentpage.pageid, Date.now(), "pagehistory", this.flowcontrol.backcounter)
        this.sendMessageToStudyAddOn("initpage", { pageinfo: this.flowcontrol.currentpage.getPageinfoForAddon(), pagegroupinfo: this.flowcontrol.getPagegroupinfoForAddon(), studyinfo: this.getStudyinfoForAddon() })
    }

    initPageWithExistingData(e) {
        if(e.detail.data != null){
            console.log(`init page with existing data ${JSON.stringify(e.detail.data)}`)
        }
        else{
            console.log(`init page no data found`)
        }
        this.sendMessageToStudyAddOn("initexistingdata", { data: e.detail.data })
    }

    releaseSyncblock(e){
        let success = this.flowcontrol.releaseSyncblock(e.detail.syncid)
        if(success){
            this.sendMessageToStudyAddOn("releasesyncblock", { syncid: e.detail.syncid })
        }
        else{
            let event = new CustomEvent('iwmstudyerror', { detail: { error: "usersyncerror", errordescription: "Fehler bei der Fortschrittssynchronisation der Benutzer."} })
            window.dispatchEvent(event) 
        }
    }

    processIncomingRPC(e){        
        this.sendMessageToStudyAddOn("rpcin", {rpcname: e.detail.rpcname, rpcparams: e.detail.rpcparams, sender: e.detail.sender})
    }

    processIncomingChat(e){        
        this.sendMessageToStudyAddOn("chatin", {text: e.detail.text, sender: e.detail.sender})
    }

    getHash(datastring) {
        let bitArray = sjcl.hash.sha256.hash(datastring)
        let digest_sha256 = sjcl.codec.hex.fromBits(bitArray)
        return digest_sha256
    }

    changePage(targetpageid, logdata, visittime, runtimedata) {
        console.log('change page')
        let rtd = {}
        let runtimedatachanged = false
        //if (this.getHash(this.meta.runtimedata) != this.getHash(runtimedata)) {
            this.meta.runtimedata = runtimedata
            rtd = runtimedata
            runtimedatachanged = true
        //}
        this.flowcontrol.addCurrentPageVisittime(visittime)
        this.logger.pageLeft(this.flowcontrol.pagecounter, this.flowcontrol.currentpage.pageid, Date.now(), logdata, this.flowcontrol.getAllPageMetadata(), this.flowcontrol.getAllPagegroupMetadata(), runtimedatachanged, rtd)
        this.flowcontrol.changePage(targetpageid)
    }

    previousPage(logdata, visittime, runtimedata) {
        console.log('previous page')
        let rtd = {}
        let runtimedatachanged = false
        //if (this.getHash(this.meta.runtimedata) != this.getHash(runtimedata)) {
            this.meta.runtimedata = runtimedata
            rtd = runtimedata
            runtimedatachanged = true
        //}
        this.flowcontrol.addCurrentPageVisittime(visittime)
        this.logger.pageLeft(this.flowcontrol.pagecounter, this.flowcontrol.currentpage.pageid, Date.now(), logdata, this.flowcontrol.getAllPageMetadata(), this.flowcontrol.getAllPagegroupMetadata(), runtimedatachanged, rtd)
        this.flowcontrol.previousPage()
    }

    getPagevisitFormdata(e) {
        //e.detail.form format "user.pageid.elementid"
        //user format "self" or number
        let datafromuserid
        if (e.detail.form.split(".")[0] == "self") {
            datafromuserid = this.meta.userid
        }
        else {
            datafromuserid = this.meta.runuser[e.detail.form.split(".")[0] - 1]
        }
        this.logger.getPagevisitData(datafromuserid, e.detail.form, e.detail.callback)
    }

    logAction(action, data, timestamp, elapsedtime) {
        this.logger.logAction(this.flowcontrol.pagecounter, this.flowcontrol.currentpage.pageid, timestamp, elapsedtime, action, data)
    }

    logAnonymousData(type, data, elapsedtime) {
        this.logger.logAnonymousData(this.flowcontrol.pagecounter, this.flowcontrol.currentpage.pageid, elapsedtime, type, data)
    }

    storeFile(filename, blob, creationtime) {
        this.logger.storeFile(filename, blob, creationtime)
    }

    getStudyinfoForAddon() {
        let otherusers = []
        for(let u of this.meta.runuser){
            if(u != this.meta.userid){
                otherusers.push(u)
            }
        }
        return { studyid: this.meta.studyid, user: this.meta.userid, conditionid: this.meta.conditionid, runid: this.meta.runid, runuser: this.meta.runuser, otherusers: otherusers, pagecounter: this.flowcontrol.pagecounter, runtimedata: this.meta.runtimedata, apporigin: this.meta.apporigin, history: this.flowcontrol.history, initialdata: this.meta.initialdata }
    }
}

function createIWMStudy() {
    window.iwmstudy = new Study()
}
