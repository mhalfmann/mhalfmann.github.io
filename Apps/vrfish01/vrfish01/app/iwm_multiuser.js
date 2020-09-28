class MultiUserManager {
    constructor(studyid, runid, userid, password, neededuser, runuser, serverurl) {
        this.studyid = studyid
        this.runid = runid
        this.userid = userid
        this.passwordhash = this.getHash(password)
        this.neededuser = neededuser
        this.runuser = runuser // Array
        this.serverurl = serverurl 
        let options = {
            "force new connection" : true,
            "reconnectionAttempts" : "Infinity",
            "timeout" : 10000,
            "transports" : ["websocket"]
        } 
        this.socket = io.connect(this.serverurl, options)
        this.socket.on('connect_error', function (error) {            
            console.log('connect error ' + error);            
        });        
        this.socket.on('message', this.processIncomingMessage.bind(this))        
    }

    getHash(datastring) {
        let bitArray = sjcl.hash.sha256.hash(datastring)
        let digest_sha256 = sjcl.codec.hex.fromBits(bitArray)
        return digest_sha256
    }

    processIncomingMessage(messagedata) {
        console.log('message action: ' + messagedata.action);
        if(messagedata.action == "authenticate"){
            this.sendMessage("login", [], {neededuser: this.neededuser, runuser: this.runuser.join(',')})            
        }
        else if(messagedata.action == "releasesyncblock"){
            let event = new CustomEvent('releasesyncblock', { detail : {syncid: messagedata.syncid} })
		    window.dispatchEvent(event)            
        }
        else if(messagedata.action == "rpc"){            
            let event = new CustomEvent('incomingrpc', { detail : {rpcname: messagedata.rpcname, rpcparams: messagedata.rpcparams, sender: messagedata.sender} })
		    window.dispatchEvent(event)
        }
        else if(messagedata.action == "chat"){
            let event = new CustomEvent('incomingchat', { detail : {text: messagedata.text, sender: messagedata.sender} })
		    window.dispatchEvent(event)
        }        
    } 
    
    sendMessage(action, targets=[], data={}) {        
        // action = login, reachedsyncpoint, rpc, chat
        let messagebody = {messageid: this.generateUUID(), creationtimeclient: Date.now(), action: action, studyid: this.studyid, runid: this.runid, userid: this.userid, passwordhash: this.passwordhash, targets: targets}
        Object.assign(messagebody, data)        
        this.socket.emit('message', messagebody)        
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

    reachedSyncPoint(syncid){
        this.sendMessage("reachedsyncpoint", [], {syncid: syncid, neededuser: this.neededuser})
    }

    sendRPC(target, rpcname, rpcparams){
        this.sendMessage("rpc", [target], {rpcname: rpcname, rpcparams: rpcparams})
    }

    sendChatMessage(text){
        this.sendMessage("chat", [], {text: text})
    }
}