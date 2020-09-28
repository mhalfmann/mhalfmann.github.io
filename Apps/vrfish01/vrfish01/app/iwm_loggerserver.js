//
// description:		module for server logging
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class ServerLogger {
    constructor() {
        this.studyid
        this.userid
        this.passwordhash
        this.runid
        this.bundlecode
        this.serverurl        
        this.callbacks = {}        
    }

    init(studyid, serverurl) {
        this.studyid = studyid
        this.bundlecode = this.generateUUID()
        this.serverurl = serverurl
        let requestdata = { action: "checkserver", studyid: this.studyid, userid: "", passwordhash: "" }
        this.doRequest(requestdata)
    }

    urlencodeFlatJSON(jsonobj) {
        let keys = Object.keys(jsonobj)
        let resultarray = []
        for (let i = 0; i < keys.length; i++) {
            resultarray.push(keys[i] + "=" + jsonobj[keys[i]])
        }
        return resultarray.join("&")
    }

    doRequest(requestdata) {
        let request = new XMLHttpRequest()
        request.responseType = "json"
        request.open('POST', this.serverurl + "/api/service", true)
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded") //necessary for Cross-Origin Resource Sharing, no JSON allowed
        request.onreadystatechange = this.processServerResponse.bind(this)
        request.send(this.urlencodeFlatJSON(requestdata))
    }

    processServerResponse(event) {
        let request = event.currentTarget
        let response = event.currentTarget.response    
        if (request.readyState == 4) {
            if (request.status == 0) {
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "noserverresponse", errordescription: "Der Server " + this.serverurl + " ist nicht erreichbar." } })
                window.dispatchEvent(event)
            }
            else if (request.status == 200) {
                //console.log(JSON.stringify(response))
                if (response.error == true) {
                    let event = new CustomEvent('iwmstudyerror', { detail: { error: "servererror_" + response.status, errordescription: "Die Aktion auf dem Server konnte wegen eines Fehlers nicht abgeschlossen werden." } })
                    window.dispatchEvent(event)
                }
                else {
                    if (response.action == "checkserver" && response.status == "success") {
                        console.log(`study ${this.studyid} is available on server`)
                    }
                    else if (response.action == "study_registeruser" && response.status == "success") {
                        let event = new CustomEvent('userregistrationsucceeded', { 'detail': null })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_registeruser" && response.status == "exists") {
                        this.userid = null
                        this.passwordhash = null
                        let event = new CustomEvent('userregistrationfailed', { 'detail': { cause: "exists" } })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_loginuser" && response.status == "success") {
                        let event = new CustomEvent('userloginsucceeded', { detail: {email: response.email, group: response.group} })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_loginuser" && response.status == "failed") {
                        let event = new CustomEvent('userloginfailed', { detail: {cause: "notfound"} })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_getopenrun" && response.status == "found") {
                        this.runid = response.runid
                        let event = new CustomEvent('openrunresult', { detail: { runfound: true, runid: response.runid, conditionid: response.conditionid, neededuser: response.neededuser, runuser: response.runuser } })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_getopenrun" && response.status == "notfound") {
                        let event = new CustomEvent('openrunresult', { detail: { runfound: false, runid: "0", conditionid: "", neededuser: 1 } })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_getownrun" && response.status == "success") {
                        this.runid = response.runid
                        let event = new CustomEvent('getownrunresult', { detail: { runid: response.runid, conditionid: response.conditionid, neededuser: response.neededuser, runuser: response.runuser, runuserdata: response.runuserdata } })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_createrun" && response.status == "success") {
                        this.runid = response.runid
                        console.log(`run created with id ${this.runid}`)
                        let event = new CustomEvent('runcreated', { detail: { runid: this.runid } })
                        window.dispatchEvent(event)
                    }
                    else if (response.action == "study_getrunuser" && response.status == "success") {                        
                        console.log(`runuser refreshed`)
                        let event = new CustomEvent('runuserresult', { detail: { runuser: response.runuser } })
                        window.dispatchEvent(event)
                    }                    
                    else if(response.action == "study_pageentered" && response.status == "success"){
                        console.log(`logged page ${response.pageid} entered`)
                        if(Object.keys(response.data).length != 0){
                            let event = new CustomEvent('initexistingdata', { detail: { data: response.data } })
                            window.dispatchEvent(event)
                        }
                        else{
                            let event = new CustomEvent('initexistingdata', { detail: { data: null } })
                            window.dispatchEvent(event) 
                        }
                    }
                    else if(response.action == "study_pageleft" && response.status == "success"){
                        console.log(`logging successfull ${response.pageid} data ${JSON.stringify(response.data)}`)                        
                    }
                    else if(response.action == "study_logaction" && response.status == "success"){
                        console.log(`logged action ${response.actiontype}`)           
                    }
                    else if(response.action == "study_loganonymousdata" && response.status == "success"){
                        console.log(`logged anonymous data ${response.type}`)           
                    }
                    else if(response.action == "study_storefile" && response.status == "success"){
                        console.log(`stored file ${response.filename} size ${response.filesize}`)
                    }
                    else if(response.action == "study_getpagevisitdata" && response.status == "success"){
                        console.log(`got formdata ${response.formkey} value ${response.formvalue}`)
                        this.callbacks[response.callbackid](response.formkey, response.formvalue)
                    }
                }
            }
            else {
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "serverstatus_" + this.request.status, errordescription: "Der Server meldet Status " + this.request.status } })
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
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now() //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
    }

    registerUser(userid, password, email, group) {
        this.userid = userid
        this.passwordhash = this.getHash(password)
        console.log("register user on server")
        let requestdata = { action: "study_registeruser", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, userguid: this.generateUUID(), email: email, role: "subject", group: group }
        this.doRequest(requestdata)
    }

    checkUserLogin(userid, password) {
        this.userid = userid
        this.passwordhash = this.getHash(password)
        console.log("user login on server")
        let requestdata = { action: "study_loginuser", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    getOpenRun() {
        console.log("get open run from server")
        let requestdata = { action: "study_getopenrun", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    getRunUser() {
        console.log("get runuser from server")
        let requestdata = { action: "study_getrunuser", studyid: this.studyid, runid: this.runid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    getOwnRun() {
        console.log("get own run from server")
        let requestdata = { action: "study_getownrun", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }    

    createRun(conditionid, neededuser, expversion) {
        console.log(`creating run for user ${this.userid} with condition ${conditionid}`)
        let runid = this.generateUUID()        
        let requestdata = { action: "study_createrun", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: runid, conditionid: conditionid, neededuser: neededuser, expversion: expversion }
        this.doRequest(requestdata)
    }

    pageEntered(pagecounter, pageid, timestamp, pagehistory, backcounter) {           
        let requestdata = { action: "study_pageentered", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: this.runid, pagecounter: pagecounter, backcounter: backcounter, pageid: pageid }         
        this.doRequest(requestdata)        
    }

    pageLeft(pagecounter, pageid, timestamp, data, pagemetadata, pagegroupmetadata, runtimedatachanged, runtimedata) {        
        let requestdata = { action: "study_pageleft", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: this.runid, pagecounter: pagecounter, pageid: pageid, data: JSON.stringify(data), pagemetadata: JSON.stringify(pagemetadata), pagegroupmetadata: JSON.stringify(pagegroupmetadata), runtimedatachanged: runtimedatachanged, runtimedata: JSON.stringify(runtimedata) }
        this.doRequest(requestdata)
    }

    getPagevisitData(datafromuserid, formkey, callback) {
        //datafromuserid => iwmstudy userid
        //formkey.split(".")[0] => "self" or number        
        let pageid = formkey.split(".")[1]
        let formid = formkey.split(".")[2]
        let callbackid = "gpvd" + Date.now()
        this.callbacks[callbackid] = callback
        console.log(`get pagevisit data ${pageid} ${formid}`)
        let requestdata = { action: "study_getpagevisitdata", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: this.runid, datafromuserid: datafromuserid, pageid: pageid, formid: formid, callbackid: callbackid, formkey: formkey }
        this.doRequest(requestdata)
    }

    logAction(pagecounter, pageid, timestamp, elapsedtime, action, data) {
        let requestdata = { action: "study_logaction", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: this.runid, pagecounter: pagecounter, pageid: pageid, elapsedtime: elapsedtime, actiontype: action, data: JSON.stringify(data) }
        this.doRequest(requestdata)
    }

    logAnonymousData(pagecounter, pageid, elapsedtime, type, data) {
        let requestdata = { action: "study_loganonymousdata", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, bundlecode: this.bundlecode, pagecounter: pagecounter, pageid: pageid, elapsedtime: elapsedtime, type: type, data: JSON.stringify(data) }
        this.doRequest(requestdata)        
    }
    
    encodeBase64Url(str){
        //base64 to base64url
        //'+' and '/' are replaced with '-' and '_' also any trailing '=' is removed 
        return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '')
    }

    storeFile(filename, blob, creationtime) {
        let filetype = blob.type
        let filesize = blob.size
        let reader = new FileReader()
        let self = this
        reader.onload = function() {
            let dataUrl = reader.result
            let base64 = self.encodeBase64Url(dataUrl.split(',')[1])
            self.storeFile2(filename, base64, creationtime, filetype, filesize)
        }
        reader.readAsDataURL(blob)       
    }

    storeFile2(filename, base64, creationtime, filetype, filesize){        
        let fileid = this.generateUUID()
        let requestdata = { action: "study_storefile", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, runid: this.runid, fileid: fileid, filename: filename, filetype: filetype, filesize: filesize, base64: base64 }        
        this.doRequest(requestdata)
    }      
}