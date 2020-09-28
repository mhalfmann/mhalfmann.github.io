//
// description:		module offers local logging in indexedDB
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class LocalLogger {
    constructor() {
        this.studyid
        this.userid
        this.passwordhash
        this.runid
        this.bundlecode
        this.db = null
        this.dbrequest = null
    }

    init(studyid) {
        this.studyid = studyid
        this.bundlecode = this.generateUUID()
        this.dbmarkedfordeletion = false
        this.dbrequest = indexedDB.open('iwmstudy', 6)
        this.dbrequest.addEventListener('upgradeneeded', this.dbUpdateNeeded.bind(this))
        this.dbrequest.addEventListener('success', this.dbSuccess.bind(this))
    }

    dbUpdateNeeded(event) {
        // event for db creation or modification		
        if (event.oldVersion == 0) {
            this.db = this.dbrequest.result
            if (!this.db.objectStoreNames.contains('pagevisit')) {
                let store = this.db.createObjectStore('pagevisit', { keyPath: 'key', autoIncrement: true })
                store.createIndex('pagevisit_index1', ['studyid', 'runid', 'userid', 'pagecounter', 'pageid'], { unique: false })
                store.createIndex('pagevisit_index2', ['studyid', 'runid', 'userid', 'dataavailable'], { unique: false })
                store.createIndex('pagevisit_index3', ['studyid', 'dataavailable'], { unique: false })
                store.createIndex('pagevisit_index4', ['studyid', 'runid', 'userid', 'pageid'], { unique: false })
                store.createIndex('pagevisit_index5', 'studyid', { unique: false })
            }
            if (!this.db.objectStoreNames.contains('run')) {
                let store = this.db.createObjectStore('run', { keyPath: 'key', autoIncrement: true })
                store.createIndex('run_index1', 'studyid', { unique: false })
                store.createIndex('run_index2', ['studyid', 'creationtime'], { unique: false })
                store.createIndex('run_index3', ['studyid', 'runid'], { unique: false })
            }
            if (!this.db.objectStoreNames.contains('user')) {
                let store = this.db.createObjectStore('user', { keyPath: 'key', autoIncrement: true })
                store.createIndex('user_index1', 'userid', { unique: false })
            }            
            if (!this.db.objectStoreNames.contains('actionlog')) {
                let store = this.db.createObjectStore('actionlog', { keyPath: 'key', autoIncrement: true })
                store.createIndex('actionlog_index1', 'studyid', { unique: false })
                store.createIndex('actionlog_index2', ['studyid', 'timestamp'], { unique: false })
            }
            if (!this.db.objectStoreNames.contains('anonymousdata')) {
                let store = this.db.createObjectStore('anonymousdata', { keyPath: 'key', autoIncrement: true })
                store.createIndex('anonymousdata_index1', 'studyid', { unique: false })                
            }
            if (!this.db.objectStoreNames.contains('file')) {
                let store = this.db.createObjectStore('file', { keyPath: 'key', autoIncrement: true })
                store.createIndex('file_index1', 'studyid', { unique: false })
                store.createIndex('file_index2', ['studyid', 'runid', 'userid'], { unique: false })
                store.createIndex('file_index3', ['studyid', 'runid', 'userid', 'filename'], { unique: false })
            }
            console.log('local DB created')
        }
        else if (event.oldVersion != event.newVersion) {
            console.log(`local DB version ${event.oldVersion} but ${event.newVersion} needed`)
            let deleteallowed = confirm("Die Datenbank fuer Logdaten ist veraltet und muss erneuert werden. ACHTUNG: Alle Logdaten gehen dabei verloren! Fortfahren?")
            if (deleteallowed == true) {
                this.dbmarkedfordeletion = true
                this.dbrequest = indexedDB.deleteDatabase('iwmstudy')
            } else {
                this.dbrequest.transaction.abort();
                console.log('local DB deletion forbidden')
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "wrongdbversion", errordescription: "Die Datenbank fuer Logdaten ist veraltet und konnte nicht erneuert werden." } })
                window.dispatchEvent(event)
            }
        }
    }

    dbSuccess(event) {
        if (this.dbmarkedfordeletion) {
            console.log('local DB deleted')
            this.init(this.studyid)
        }
        else {
            console.log('local DB openend')
            this.db = this.dbrequest.result
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
        });
    }

    registerUser(userid, password, email, group) {
        console.log("registerUser")
        let trans = this.db.transaction(['user'], 'readonly')
        let store = trans.objectStore('user')
        let index = store.index('user_index1')
        let request = index.openCursor(IDBKeyRange.only(userid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                console.log(`userid already exists`)
                let event = new CustomEvent('userregistrationfailed', { 'detail': { cause: "exists" } })
                window.dispatchEvent(event)
            }
            else {
                let roles = {}
                roles[self.studyid] = "subject"
                let passwordhash = self.getHash(password)
                let dbitem = { userid: userid, passwordhash: passwordhash, email: email, roles: roles, userguid: self.generateUUID(), creationtime: Date.now(), group: group }
                let trans = self.db.transaction(['user'], 'readwrite')
                let store = trans.objectStore('user')
                let request = store.put(dbitem)
                request.onsuccess = function (evt) {
                    console.log(`user created`)
                    self.userid = userid
                    self.passwordhash = passwordhash
                    let event = new CustomEvent('userregistrationsucceeded', { 'detail': null })
                    window.dispatchEvent(event)
                };
            }
        };
    }

    checkUserLogin(userid, password) {
        this.userid = userid
        this.passwordhash = this.getHash(password)
        console.log("local user login")
        let trans = this.db.transaction(['user'], 'readonly')
        let store = trans.objectStore('user')
        let index = store.index('user_index1')
        let request = index.openCursor(IDBKeyRange.only(this.userid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                if(cursor.value.passwordhash == self.passwordhash){                    
                    let event = new CustomEvent('userloginsucceeded', { detail: {email: cursor.value.email, group: cursor.value.group} })
                    window.dispatchEvent(event)    
                }
                else{                    
                    let event = new CustomEvent('userloginfailed', { detail: {cause: "wrongpassword"} })
                    window.dispatchEvent(event)
                }
            }
            else {                
                let event = new CustomEvent('userloginfailed', { detail: {cause: "notfound"} })
                window.dispatchEvent(event)
            }
        };
    }

    getOpenRun() {
        console.log("get open run (no multiuser runs in local mode)")
        let event = new CustomEvent('openrunresult', { detail: { runfound: false, runid: "0", conditionid: "", neededuser: 1 } })
        window.dispatchEvent(event)
    }

    getRunUser() {
        console.log("runuser refresh")       
        let event = new CustomEvent('runuserresult', { detail: { runuser: this.userid } })
        window.dispatchEvent(event)
    }

    getOwnRun() {
        console.log("get own local run")
        let trans = this.db.transaction(['run'], 'readonly')
        let store = trans.objectStore('run')
        let index = store.index('run_index1')
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let ru = cursor.value.runuser.split(",")                
                if(ru.includes(self.userid)){
                    self.runid = cursor.value.runid
                    let event = new CustomEvent('getownrunresult', { detail: { runid: self.runid, conditionid: cursor.value.conditionid, neededuser: cursor.value.neededuser, runuser: cursor.value.runuser, runuserdata: cursor.value.runuserdata[self.userid] } })
                    window.dispatchEvent(event)
                }
                else{
                    cursor.continue()
                }
            }            
        };
    }    

    createRun(conditionid, neededuser, expversion) {
        console.log(`creating run for user ${this.userid} with condition ${conditionid}`)
        let newrunid = this.generateUUID()
        let creationtime = Date.now()
        let rud = {}
        rud[this.userid] = { "currentpage": "", "pagehistory": "", "pagemetadata": {}, "pagegroupmetadata": {}, "runtimedata": {} }        
        let dbitem = { studyid: this.studyid, runid: newrunid, creationtime: creationtime, conditionid: conditionid, expversion: expversion, neededuser: neededuser, runuser: this.userid, runuserdata: rud }
        let trans = this.db.transaction(['run'], 'readwrite')
        let store = trans.objectStore('run')
        let request = store.put(dbitem)
        let self = this
        request.onsuccess = function (evt) {
            console.log(`run created with id ${newrunid}`)
            self.runid = newrunid
            let event = new CustomEvent('runcreated', { detail: { runid: newrunid } })
            window.dispatchEvent(event)
        };
    }
    
    pageEntered(pagecounter, pageid, timestamp, pagehistory, backcounter){
        let trans = this.db.transaction(['run'], 'readwrite')
        let store = trans.objectStore('run')
        let index = store.index('run_index3')
        let request = index.openCursor(IDBKeyRange.only([this.studyid, this.runid]))
        request.onsuccess = this.pageEnteredStep2.bind(this, pagecounter, pageid, timestamp, pagehistory, backcounter)
    }    
    
    pageEnteredStep2(pagecounter, pageid, timestamp, pagehistory, backcounter, event) {        
        let cursor = event.target.result
        if (cursor) { 
            let dbrunitem = cursor.value
            let runuserdata = dbrunitem.runuserdata
            runuserdata[this.userid]["currentpage"] = pageid
            runuserdata[this.userid]["pagecounter"] = pagecounter
            runuserdata[this.userid]["backcounter"] = backcounter
            let ph = []
            if (runuserdata[this.userid]["pagehistory"] != "") {
                ph = runuserdata[this.userid]["pagehistory"].split(",")
            }
            ph.push(pageid)
            runuserdata[this.userid]["pagehistory"] = ph.join(",")
            let runupdaterequest = cursor.update(dbrunitem)
            runupdaterequest.onsuccess = function () {console.log(`rundata updated`)}            
            let dbitem = { studyid: this.studyid, runid: this.runid, userid: this.userid, pagecounter: pagecounter, pageid: pageid, starttime: timestamp, endtime: null, data: null, dataavailable: 0 }
            let trans = this.db.transaction(['pagevisit'], 'readwrite')
            let store = trans.objectStore('pagevisit')
            let request = store.put(dbitem)
            let self = this
            request.onsuccess = function () {
                console.log(`logged page ${pageid} entered`)
                let trans = self.db.transaction(['pagevisit'], 'readwrite')
                let store = trans.objectStore('pagevisit')
                let index = store.index('pagevisit_index4')
                let request2 = index.openCursor(IDBKeyRange.only([self.studyid, self.runid, self.userid, pageid]))
                let lastfinisheddbitem = null
                let lastpagecounter = 0
                request2.onsuccess = function (evt2) {                    
                    let cursor = evt2.target.result                    
                    if (cursor) { 
                        let dbi = cursor.value
                        if(dbi.endtime != null && dbi.pagecounter > lastpagecounter){
                            lastfinisheddbitem = dbi
                            lastpagecounter = dbi.pagecounter
                        }                        
                        cursor.continue()
                    }    
                    else{                
                        if(lastfinisheddbitem != null && lastfinisheddbitem.dataavailable == 1){
                            let event = new CustomEvent('initexistingdata', { detail: { data: lastfinisheddbitem.data } })
                            window.dispatchEvent(event)
                        }
                        else{
                            let event = new CustomEvent('initexistingdata', { detail: { data: null } })
                            window.dispatchEvent(event)
                        }
                    }
                }
            }
        }
    }    

    pageLeft(pagecounter, pageid, timestamp, data, pagemetadata, pagegroupmetadata, runtimedatachanged, runtimedata) {
        let trans = this.db.transaction(['pagevisit'], 'readwrite')
        let store = trans.objectStore('pagevisit')
        let index = store.index('pagevisit_index1')
        let request = index.openCursor(IDBKeyRange.only([this.studyid, this.runid, this.userid, pagecounter, pageid]))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {                
                console.log(`logging ${pageid} pagedata`)
                let item = cursor.value
                item.endtime = timestamp
                item.data = data
                if (Object.keys(data).length > 0) {
                    item.dataavailable = 1
                }
                let request2 = cursor.update(item)
                request2.onsuccess = function () {console.log(`logging successfull ${pageid} pagedata ${JSON.stringify(data)}`)}
                let trans3 = self.db.transaction(['run'], 'readwrite')
                let store3 = trans3.objectStore('run')
                let index3 = store3.index('run_index3')
                let request3 = index3.openCursor(IDBKeyRange.only([self.studyid, self.runid]))
                request3.onsuccess = self.pageLeftStep2.bind(self, pagecounter, pageid, timestamp, data, pagemetadata, pagegroupmetadata, runtimedatachanged, runtimedata)
            }
        }
    }

    pageLeftStep2(pagecounter, pageid, timestamp, data, pagemetadata, pagegroupmetadata, runtimedatachanged, runtimedata, evt) {
        let cursor = evt.target.result
        if (cursor) {
            let item = cursor.value
            item.runuserdata[this.userid]["pagemetadata"] = pagemetadata
            item.runuserdata[this.userid]["pagegroupmetadata"] = pagegroupmetadata
            if (runtimedatachanged) {                
                item.runuserdata[this.userid]["runtimedata"] = runtimedata
            }
            let request2 = cursor.update(item)
            request2.onsuccess = function (evt) {                
                console.log(`logging succesfull ${pageid} rundata`)
            }
        }        
    }
    
    getPagevisitData(datafromuserid, formkey, callback) {
        //datafromuserid => iwmstudy userid
        //formkey.split(".")[0] => "self" or number
        let pageid = formkey.split(".")[1]
        let formid = formkey.split(".")[2]
        console.log(`get pagevisit data ${pageid} ${formid}`)
        let trans = this.db.transaction(['pagevisit'], 'readonly')
        let store = trans.objectStore('pagevisit')
        let index = store.index('pagevisit_index4')
        let request = index.openCursor(IDBKeyRange.only([this.studyid, this.runid, datafromuserid, pageid]))
        let formvalue
        let relatedpagecounter = 0
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                if (cursor.value.pagecounter > relatedpagecounter) {
                    relatedpagecounter = cursor.value.pagecounter
                    formvalue = null;
                    if (cursor.value.dataavailable == 1) {
                        if (cursor.value.data.hasOwnProperty(formid)) {
                            formvalue = cursor.value.data[formid]
                        }
                    }
                }
                cursor.continue()
            }
            else {                
                callback(formkey, formvalue)
            }
        };
    }

    logAction(pagecounter, pageid, timestamp, elapsedtime, action, data) {
        let dbitem = { studyid: this.studyid, runid: this.runid, userid: this.userid, pagecounter: pagecounter, pageid: pageid, timestamp: timestamp, elapsedtime: elapsedtime, action: action, data: data }
        let trans = this.db.transaction(['actionlog'], 'readwrite')
        let store = trans.objectStore('actionlog')
        let request = store.put(dbitem)
        request.onsuccess = function (evt) {
            console.log(`logged action ${action}`)
        };
    }

    logAnonymousData(pagecounter, pageid, elapsedtime, type, data) {
        let dbitem = { studyid: this.studyid, bundlecode: this.bundlecode, pagecounter: pagecounter, pageid: pageid, elapsedtime: elapsedtime, type: type, data: data }
        let trans = this.db.transaction(['anonymousdata'], 'readwrite')
        let store = trans.objectStore('anonymousdata')
        let request = store.put(dbitem)
        request.onsuccess = function (evt) {
            console.log(`logged anonymousdata ${type}`)
        };
    }

    storeFile(filename, blob, creationtime) {
        let fileid = this.generateUUID()
        let filetype = blob.type
        let filesize = blob.size
        let dbitem = { studyid: this.studyid, runid: this.runid, userid: this.userid, fileid: fileid, filename: filename, filetype: filetype, blob: blob, filesize: filesize, creationtime: creationtime }
        let trans = this.db.transaction(['file'], 'readwrite')
        let store = trans.objectStore('file')
        let request = store.put(dbitem)
        request.onsuccess = function (evt) {
            console.log(`stored file ${filename} size ${filesize}`)
        };
    }
}