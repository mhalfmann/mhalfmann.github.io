//
// description:		module for server logging
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class PendingRequest {
    constructor(request, requestdata, retry) {
        this.request = request
        this.requestdata = requestdata
        this.type = requestdata.action
        this.retry = retry
    }
}

class ServerLogger {
    constructor() {
        this.studyid
        this.userid
        this.passwordhash
        this.runid
        this.bundlecode
        this.serverurl
        this.callbacks = {}
        this.pendingrequests = []
        this.unsentrequests = []
        this.unsentrequestsinterval = null
    }

    init(studyid, serverurl) {
        this.studyid = studyid
        this.bundlecode = this.generateUUID()
        this.serverurl = serverurl
        let requestdata = { action: "checkserver", studyid: this.studyid, userid: "", passwordhash: "" }
        this.addRequest(requestdata)
    }

    urlencodeFlatJSON(jsonobj) {
        let keys = Object.keys(jsonobj)
        let resultarray = []
        for (let i = 0; i < keys.length; i++) {
            resultarray.push(keys[i] + "=" + encodeURIComponent(jsonobj[keys[i]]))
        }
        return resultarray.join("&")
    }

    addRequest(requestdata) {
        if (this.unsentrequests.length == 0) {
            this.doRequest(requestdata)
        } else {
            //console.log("===storeRequest " + requestdata.action)
            this.unsentrequests.push(requestdata)
        }
    }

    doRequest(requestdata, priority = false, retry = 0) {
        if (priority || !this.existsBlockingPendingRequest()) {
            //console.log("===doRequest " + requestdata.action)
            let request = new XMLHttpRequest()
            this.pendingrequests.push(new PendingRequest(request, requestdata, retry))
            request.responseType = "json"
            request.open("POST", this.serverurl + "/api/service", true)
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded") //necessary for Cross-Origin Resource Sharing, no JSON allowed
            request.onreadystatechange = this.processServerResponse.bind(this)
            request.send(this.urlencodeFlatJSON(requestdata))
        } else {
            //console.log("===storeRequest " + requestdata.action)
            this.unsentrequests.push(requestdata)
            if (this.unsentrequestsinterval == null) {
                this.unsentrequestsinterval = setInterval(this.processUnsentRequests.bind(this), 50)
            }
        }
    }

    removePendingRequest(request) {
        for (let i = 0; i < this.pendingrequests.length; i++) {
            if (this.pendingrequests[i].request == request) {
                if (this.pendingrequests[i].retry > 0) {
                    let event = new CustomEvent("iwmstudyerrorresolved", {
                        detail: { error: "noserverresponse", errordescription: "Der Server " + this.serverurl + " wurde nach " + this.pendingrequests[i].retry + " Versuchen wieder erreicht." }
                    })
                    window.dispatchEvent(event)
                }
                this.pendingrequests.splice(i, 1)
                break
            }
        }
    }

    retryPendingRequest(request) {
        for (let i = 0; i < this.pendingrequests.length; i++) {
            if (this.pendingrequests[i].request == request) {
                let rdata = JSON.parse(JSON.stringify(this.pendingrequests[i].requestdata))
                let retry = this.pendingrequests[i].retry + 1
                this.doRequest(rdata, true, retry)
                this.pendingrequests.splice(i, 1)
                break
            }
        }
    }

    existsBlockingPendingRequest() {
        let blockingtypes = [
            "study_registeruser",
            "study_loginuser",
            "study_getopenrun",
            "study_getrunuser",
            "study_getownrun",
            "study_createrun",
            "study_pageentered",
            "study_pageleft",
            "study_getpagevisitdata"
        ]
        for (let i = 0; i < this.pendingrequests.length; i++) {
            if (blockingtypes.indexOf(this.pendingrequests[i].type) != -1) {
                return true
            }
        }
        return false
    }

    processUnsentRequests() {
        if (!this.existsBlockingPendingRequest()) {
            if (this.unsentrequests.length > 0) {
                this.doRequest(this.unsentrequests.shift(), true)
            }
            if (this.unsentrequests.length == 0) {
                clearInterval(this.unsentrequestsinterval)
                this.unsentrequestsinterval = null
            } else {
                this.processUnsentRequests()
            }
        }
    }

    processServerResponse(event) {
        let request = event.currentTarget
        let response = event.currentTarget.response
        if (request.readyState == 4) {
            if (request.status == 0) {
                let event = new CustomEvent("iwmstudyerror", {
                    detail: { error: "noserverresponse", errordescription: "Der Server " + this.serverurl + " ist nicht erreichbar. Es wird versucht, die Verbindung wiederherzustellen." }
                })
                window.dispatchEvent(event)
                setTimeout(this.retryPendingRequest.bind(this), 500, request)
            } else if (request.status == 200) {
                this.removePendingRequest(request)
                if (response.error == true) {
                    if (response.status == "errordbpl1") {
                        //db error on writing pageleft data
                    } else if (response.status == "errordbpl2") {
                        //db error on getting rundata on pageleft
                    } else if (response.status == "errordbal1") {
                        //db error on actionlogging
                    } else {
                        //console.log(JSON.stringify(response))
                    }
                    let event = new CustomEvent("iwmstudyerror", {
                        detail: { error: "servererror_" + response.status, errordescription: "Die Aktion auf dem Server konnte wegen eines Fehlers nicht abgeschlossen werden." }
                    })
                    window.dispatchEvent(event)
                } else {
                    if (response.action == "checkserver" && response.status == "success") {
                        console.log(`study ${this.studyid} is available on server`)
                    } else if (response.action == "study_registeruser" && response.status == "success") {
                        let event = new CustomEvent("userregistrationsucceeded", { detail: null })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_registeruser" && response.status == "exists") {
                        this.userid = null
                        this.passwordhash = null
                        let event = new CustomEvent("userregistrationfailed", { detail: { cause: "exists" } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_loginuser" && response.status == "success") {
                        let event = new CustomEvent("userloginsucceeded", { detail: { email: response.email, group: response.group } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_loginuser" && response.status == "failed") {
                        let event = new CustomEvent("userloginfailed", { detail: { cause: "notfound" } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_getopenrun" && response.status == "found") {
                        this.runid = response.runid
                        let event = new CustomEvent("openrunresult", {
                            detail: { runfound: true, runid: response.runid, conditionid: response.conditionid, neededuser: response.neededuser, runuser: response.runuser, condstats: null }
                        })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_getopenrun" && response.status == "notfound") {
                        let event = new CustomEvent("openrunresult", { detail: { runfound: false, runid: "0", conditionid: "", neededuser: 1, condstats: response.condstats } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_getownrun" && response.status == "success") {
                        this.runid = response.runid
                        let event = new CustomEvent("getownrunresult", {
                            detail: { runid: response.runid, conditionid: response.conditionid, neededuser: response.neededuser, runuser: response.runuser, runuserdata: response.runuserdata }
                        })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_createrun" && response.status == "success") {
                        this.runid = response.runid
                        console.log(`run created with id ${this.runid}`)
                        let event = new CustomEvent("runcreated", { detail: { runid: this.runid } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_getrunuser" && response.status == "success") {
                        console.log(`runuser refreshed`)
                        let event = new CustomEvent("runuserresult", { detail: { runuser: response.runuser } })
                        window.dispatchEvent(event)
                    } else if (response.action == "study_pageentered" && response.status == "success") {
                        console.log(`logged page ${response.pageid} entered`)
                        if (Object.keys(response.data).length != 0) {
                            let event = new CustomEvent("initexistingdata", { detail: { data: response.data } })
                            window.dispatchEvent(event)
                        } else {
                            let event = new CustomEvent("initexistingdata", { detail: { data: null } })
                            window.dispatchEvent(event)
                        }
                    } else if (response.action == "study_pageleft" && response.status == "success") {
                        console.log(`logging successfull ${response.pageid} data ${JSON.stringify(response.data)}`)
                    } else if (response.action == "study_logaction" && response.status == "success") {
                        console.log(`logged action ${response.actiontype}`)
                    } else if (response.action == "study_loganonymousdata" && response.status == "success") {
                        console.log(`logged anonymous data ${response.type}`)
                    } else if (response.action == "study_storefile" && response.status == "success") {
                        console.log(`stored file ${response.filename} size ${response.filesize}`)
                    } else if (response.action == "study_getpagevisitdata" && response.status == "success") {
                        console.log(`got formdata ${response.formkey} value ${response.formvalue}`)
                        this.callbacks[response.callbackid](response.formkey, response.formvalue)
                    }
                }
            } else {
                let event = new CustomEvent("iwmstudyerror", { detail: { error: "serverstatus_" + this.request.status, errordescription: "Der Server meldet Status " + this.request.status } })
                window.dispatchEvent(event)
            }
        }
    }

    getHash(datastring) {
        let bitArray = sjcl.hash.sha256.hash(datastring)
        let digest_sha256 = sjcl.codec.hex.fromBits(bitArray)
        return digest_sha256
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

    registerUser(userid, password, email, group, browserinfo, screeninfo) {
        this.userid = userid
        this.passwordhash = this.getHash(password)
        console.log("register user on server")
        let requestdata = {
            action: "study_registeruser",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            userguid: this.generateUUID(),
            email: email,
            role: "subject",
            group: group,
            browserinfo: browserinfo,
            screeninfo: screeninfo
        }
        this.addRequest(requestdata)
    }

    checkUserLogin(userid, password) {
        this.userid = userid
        this.passwordhash = this.getHash(password)
        console.log("user login on server")
        let requestdata = { action: "study_loginuser", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.addRequest(requestdata)
    }

    getOpenRun(initialdata) {
        console.log("get open run from server")
        let requestdata = { action: "study_getopenrun", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, initialdata: initialdata }
        this.addRequest(requestdata)
    }

    getRunUser() {
        console.log("get runuser from server")
        let requestdata = { action: "study_getrunuser", studyid: this.studyid, runid: this.runid, userid: this.userid, passwordhash: this.passwordhash }
        this.addRequest(requestdata)
    }

    getOwnRun() {
        console.log("get own run from server")
        let requestdata = { action: "study_getownrun", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.addRequest(requestdata)
    }

    createRun(conditionid, neededuser, expversion, initialdata) {
        console.log(`creating run for user ${this.userid} with condition ${conditionid}`)
        let runid = this.generateUUID()
        let requestdata = {
            action: "study_createrun",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: runid,
            conditionid: conditionid,
            neededuser: neededuser,
            expversion: expversion,
            initialdata: initialdata
        }
        this.addRequest(requestdata)
    }

    pageEntered(pagecounter, pageid, timestamp, pagehistory, backcounter, userrunstatus) {
        let requestdata = {
            action: "study_pageentered",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: this.runid,
            pagecounter: pagecounter,
            backcounter: backcounter,
            pageid: pageid,
            userrunstatus: userrunstatus
        }
        this.addRequest(requestdata)
    }

    pageLeft(pagecounter, pageid, timestamp, data, pagemetadata, pagegroupmetadata, runtimedatachanged, runtimedata, errorlog, visittime) {
        let requestdata = {
            action: "study_pageleft",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: this.runid,
            pagecounter: pagecounter,
            pageid: pageid,
            data: JSON.stringify(data),
            pagemetadata: JSON.stringify(pagemetadata),
            pagegroupmetadata: JSON.stringify(pagegroupmetadata),
            runtimedatachanged: runtimedatachanged,
            runtimedata: JSON.stringify(runtimedata),
            errorlog: JSON.stringify(errorlog),
            visittime: visittime
        }
        this.addRequest(requestdata)
    }

    getPagevisitData(datafromuserid, formkey, callback) {
        //datafromuserid => iwmstudy userid
        //formkey.split(".")[0] => "self" or number
        let datafrompageid = formkey.split(".")[1]
        let formid = formkey.split(".")[2]
        let callbackid = "gpvd" + Date.now()
        this.callbacks[callbackid] = callback
        console.log(`get pagevisit data ${datafrompageid} ${formid}`)
        let requestdata = {
            action: "study_getpagevisitdata",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: this.runid,
            datafromuserid: datafromuserid,
            datafrompageid: datafrompageid,
            formid: formid,
            callbackid: callbackid,
            formkey: formkey
        }
        this.addRequest(requestdata)
    }

    logAction(pagecounter, pageid, timestamp, elapsedtime, action, data) {
        let requestdata = {
            action: "study_logaction",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: this.runid,
            pagecounter: pagecounter,
            pageid: pageid,
            elapsedtime: elapsedtime,
            actiontype: action,
            data: JSON.stringify(data)
        }
        this.addRequest(requestdata)
    }

    logAnonymousData(pagecounter, pageid, elapsedtime, type, data) {
        let requestdata = {
            action: "study_loganonymousdata",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            bundlecode: this.bundlecode,
            pagecounter: pagecounter,
            pageid: pageid,
            elapsedtime: elapsedtime,
            type: type,
            data: JSON.stringify(data)
        }
        this.addRequest(requestdata)
    }

    encodeBase64Url(str) {
        //base64 to base64url
        //'+' and '/' are replaced with '-' and '_' also any trailing '=' is removed
        return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/\=+$/, "")
    }

    storeFile(filename, blob, creationtime) {
        let filetype = blob.type
        let filesize = blob.size
        let reader = new FileReader()
        let self = this
        reader.onload = function () {
            let dataUrl = reader.result
            let base64 = self.encodeBase64Url(dataUrl.split(",")[1])
            self.storeFile2(filename, base64, creationtime, filetype, filesize)
        }
        reader.readAsDataURL(blob)
    }

    storeFile2(filename, base64, creationtime, filetype, filesize) {
        let fileid = this.generateUUID()
        let requestdata = {
            action: "study_storefile",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            runid: this.runid,
            fileid: fileid,
            filename: filename,
            filetype: filetype,
            filesize: filesize,
            base64: base64
        }
        this.addRequest(requestdata)
    }
}
