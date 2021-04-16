//
// description:		iwmstudy management (server)
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class StudyServerManager {
    constructor() {
        this.userid
        this.password
        this.passwordhash
        this.serverurl
        this.studyid
        this.role
        this.lastlogin
        this.reportingcsvviewdata
        this.systemmode
        if ((navigator.platform.substr(0, 2) === "iP" || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) && window.webkit && window.webkit.messageHandlers) {
            this.systemmode = "iwmstudyiosapp"
        } else {
            this.systemmode = "browsertabs"
        }
        if (IWM.globalconfig.headermanageimg != null) {
            document.getElementById("headerimg").src = IWM.globalconfig.headermanageimg
        }
        if (IWM.globalconfig.logoimg != null) {
            document.getElementById("logoimgmanage").src = IWM.globalconfig.logoimg
        }
        if (IWM.globalconfig.logotext != null) {
            document.getElementById("logotextmanage").innerHTML = IWM.globalconfig.logotext
        }
        document.getElementById("versiontext").innerText = "v. " + IWM.globalconfig.appversion
        this.allmodes = ["login", "subject", "subject_password", "reporting", "user", "user_create", "user_edit"]
        this.mode = "login"
        document.getElementById("login_serverurl").value = IWM.globalconfig.defaultserverurl
        document.getElementById("login_studyid").value = IWM.globalconfig.defaultstudyid
        document.getElementById("menu_subject").style.visibility = "hidden"
        document.getElementById("menu_reporting").style.visibility = "hidden"
        document.getElementById("menu_user").style.visibility = "hidden"
        this.showCSVViewBound = this.showCSVView.bind(this)
        this.changeView()
        this.allsubjects = []
        this.allconditionstats = new Map()
        this.alluser = []
        this.currenttimeout = null
        this.downloadfilename
        this.accesscode
    }

    changeView(event = null) {
        if (event != null) {
            this.mode = event.currentTarget.id.substr(5)
        }
        for (let i = 0; i < this.allmodes.length; i++) {
            if (this.allmodes[i] == this.mode) {
                document.getElementById(this.allmodes[i] + "_view").style.display = "block"
                if (this.allmodes[i].split("_").length == 1) {
                    //main views with menu only
                    document.getElementById("menu_" + this.allmodes[i]).classList.add("is-active")
                }
            } else {
                document.getElementById(this.allmodes[i] + "_view").style.display = "none"
                if (this.allmodes[i].split("_").length == 1) {
                    //main views with menu only
                    document.getElementById("menu_" + this.allmodes[i]).classList.remove("is-active")
                }
            }
        }
    }

    getHash(datastring) {
        let bitArray = sjcl.hash.sha256.hash(datastring)
        let digest_sha256 = sjcl.codec.hex.fromBits(bitArray)
        return digest_sha256
    }

    login(event) {
        this.serverurl = document.getElementById("login_serverurl").value
        this.userid = document.getElementById("login_user").value
        this.password = document.getElementById("login_password").value
        this.passwordhash = this.getHash(this.password)
        this.studyid = document.getElementById("login_studyid").value
        let studyidnew = false
        if (document.getElementById("login_studyidnew").checked) {
            studyidnew = true
        }
        document.getElementById("login_loginbtn").setAttribute("disabled", "disabled")
        document.getElementById("login_serverurl").setAttribute("disabled", "disabled")
        document.getElementById("login_user").setAttribute("disabled", "disabled")
        document.getElementById("login_password").setAttribute("disabled", "disabled")
        document.getElementById("login_studyid").setAttribute("disabled", "disabled")
        document.getElementById("login_studyidnew").setAttribute("disabled", "disabled")
        console.log("login")
        let requestdata = { action: "manage_login", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, studyidnew: studyidnew }
        this.doRequest(requestdata)
    }

    logout(event) {
        this.serverurl = null
        this.userid = null
        this.password = null
        this.passwordhash = null
        this.studyid = null
        this.role = null
        this.lastlogin = null
        document.getElementById("login_user").value = ""
        document.getElementById("login_password").value = ""
        document.getElementById("login_studyidnew").removeAttribute("checked")
        document.getElementById("login_serverurl").value = IWM.globalconfig.defaultserverurl
        document.getElementById("login_studyid").value = IWM.globalconfig.defaultstudyid
        document.getElementById("login_loginbtn").removeAttribute("disabled", "disabled")
        document.getElementById("login_serverurl").removeAttribute("disabled", "disabled")
        document.getElementById("login_user").removeAttribute("disabled", "disabled")
        document.getElementById("login_password").removeAttribute("disabled", "disabled")
        document.getElementById("login_studyid").removeAttribute("disabled", "disabled")
        document.getElementById("login_studyidnew").removeAttribute("disabled", "disabled")
        document.getElementById("login_logoutbtn").setAttribute("disabled", "disabled")
        document.getElementById("login_role").value = ""
        document.getElementById("login_lastlogin").value = ""
        document.getElementById("menu_subject").style.visibility = "hidden"
        document.getElementById("menu_reporting").style.visibility = "hidden"
        document.getElementById("menu_user").style.visibility = "hidden"
        this.mode = "login"
        this.changeView()
        console.log("logout")
    }

    reportingCSVCompact(event) {
        console.log("reporting csvcompact requesting data")
        this.clearReporting()
        let requestdata = { action: "manage_reportingcsvcompact", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    reportingCSVPagevisits(event) {
        console.log("reporting csvpagevisits requesting data")
        this.clearReporting()
        let requestdata = { action: "manage_reportingcsvpagevisits", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    reportingCSVActionlog(event) {
        console.log("reporting csvactionlog started")
        this.clearReporting()
        document.getElementById("reporting_linkcsvactionlogdownload").innerHTML = "bitte warten"
        let requestdata = { action: "manage_reportingcsvactionlog", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    reportingCSVAnonymousData(event) {
        console.log("reporting csvanonymousdata requesting data")
        this.clearReporting()
        let requestdata = { action: "manage_reportingcsvanonymousdata", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    reportingFiles(event) {
        console.log("reporting files started")
        this.clearReporting()
        document.getElementById("reporting_linkfilesdownload").innerHTML = "bitte warten"
        let requestdata = { action: "manage_reportingfiles", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    clearReporting() {
        this.reportingcsvviewdata = null
        this.downloadfilename = null
        this.accesscode = null
        document.getElementById("reporting_linkcsvcompactsave").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvcompactsave").removeAttribute("href")
        document.getElementById("reporting_linkcsvcompactsave").removeAttribute("download")
        document.getElementById("reporting_linkcsvcompactshow").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvcompactshow").style.cursor = "text"
        document.getElementById("reporting_linkcsvcompactshow").removeEventListener("click", this.showCSVViewBound)
        document.getElementById("reporting_linkcsvpagevisitssave").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvpagevisitssave").removeAttribute("href")
        document.getElementById("reporting_linkcsvpagevisitssave").removeAttribute("download")
        document.getElementById("reporting_linkcsvpagevisitsshow").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvpagevisitsshow").style.cursor = "text"
        document.getElementById("reporting_linkcsvpagevisitsshow").removeEventListener("click", this.showCSVViewBound)
        document.getElementById("reporting_linkcsvactionlogdownload").innerHTML = ""
        document.getElementById("reporting_linkcsvactionlogdownload").removeAttribute("href")
        document.getElementById("reporting_linkcsvactionlogdownload").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvanonymousdatasave").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvanonymousdatasave").removeAttribute("href")
        document.getElementById("reporting_linkcsvanonymousdatasave").removeAttribute("download")
        document.getElementById("reporting_linkcsvanonymousdatashow").style.color = "#dddddd"
        document.getElementById("reporting_linkcsvanonymousdatashow").style.cursor = "text"
        document.getElementById("reporting_linkcsvanonymousdatashow").removeEventListener("click", this.showCSVViewBound)
        document.getElementById("reporting_linkfilesdownload").innerHTML = ""
        document.getElementById("reporting_linkfilesdownload").removeAttribute("href")
        document.getElementById("reporting_linkfilesdownload").style.color = "#dddddd"
    }

    showCSVView() {
        if (this.systemmode == "iwmstudyiosapp") {
            window.webkit.messageHandlers.mainmsgin.postMessage({ type: "appmode_data", details: {} })
            document.write(this.reportingcsvviewdata)
        } else {
            window.open().document.write(this.reportingcsvviewdata)
        }
    }

    selectData() {
        let target = outputtable
        target.contentEditable = true
        target.readonly = true
        let range = document.createRange()
        range.selectNodeContents(target)
        let sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
        alert(
            "Alle Daten wurden ausgewählt, auch wenn die Anzeige der Auswahl evtl. unvollständig ist. Zum Kopieren den markierten Bereich kurz berühren. Die Daten können in Numbers eingefügt werden."
        )
        target.readonly = true
        target.contentEditable = false
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
        request.open("POST", this.serverurl + "/api/service", true)
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded") //necessary for Cross-Origin Resource Sharing, no JSON allowed
        request.onreadystatechange = this.processServerResponse.bind(this)
        request.send(this.urlencodeFlatJSON(requestdata))
    }

    processServerResponse(event) {
        let request = event.currentTarget
        let response = event.currentTarget.response
        if (request.readyState == 4) {
            if (request.status == 0) {
                alert("Der Server " + this.serverurl + " ist nicht erreichbar.")
                document.getElementById("login_loginbtn").removeAttribute("disabled", "disabled")
                document.getElementById("login_serverurl").removeAttribute("disabled", "disabled")
                document.getElementById("login_user").removeAttribute("disabled", "disabled")
                document.getElementById("login_password").removeAttribute("disabled", "disabled")
                document.getElementById("login_studyid").removeAttribute("disabled", "disabled")
                document.getElementById("login_studyidnew").removeAttribute("disabled", "disabled")
            } else if (request.status == 200) {
                if (response.error == true) {
                    console.log(JSON.stringify(response))
                    alert("Die Aktion auf dem Server konnte wegen eines Fehlers nicht abgeschlossen werden. " + response.status)
                } else {
                    if (response.action == "manage_login" && response.status == "success") {
                        console.log("login success")
                        this.role = response.role
                        document.getElementById("login_role").value = this.role
                        this.lastlogin = response.lastlogin
                        let ll = new Date(this.lastlogin)
                        document.getElementById("login_lastlogin").value = ll.toLocaleString()
                        document.getElementById("login_logoutbtn").removeAttribute("disabled", "disabled")
                        if (this.role == "masteradmin") {
                            document.getElementById("menu_subject").style.visibility = "visible"
                            document.getElementById("menu_reporting").style.visibility = "visible"
                            document.getElementById("menu_user").style.visibility = "visible"
                        } else if (this.role == "studyadmin") {
                            document.getElementById("menu_subject").style.visibility = "visible"
                            document.getElementById("menu_reporting").style.visibility = "visible"
                            document.getElementById("menu_user").style.visibility = "hidden"
                        } else if (this.role == "groupadmin") {
                            document.getElementById("menu_subject").style.visibility = "visible"
                            document.getElementById("menu_reporting").style.visibility = "hidden"
                            document.getElementById("menu_user").style.visibility = "hidden"
                        }
                    } else if (response.action == "manage_subjectgetall" && response.status == "success") {
                        this.allsubjects = []
                        this.allconditionstats = new Map()
                        for (let i = 0; i < response.data.length; i++) {
                            let s = new Subject(
                                response.data[i].userid,
                                response.data[i].group,
                                response.data[i].runid,
                                response.data[i].condition,
                                response.data[i].starttime,
                                response.data[i].currentpage,
                                response.data[i].lastactivity,
                                response.data[i].userrunstatus
                            )
                            this.allsubjects.push(s)
                            if (this.allconditionstats.has(s.condition)) {
                                let condstat = this.allconditionstats.get(s.condition)
                                condstat["counttotal"]++
                                condstat["count" + s.userrunstatus]++
                            } else {
                                let condstat = new ConditionStatistic(s.condition)
                                condstat["counttotal"]++
                                condstat["count" + s.userrunstatus]++
                                this.allconditionstats.set(s.condition, condstat)
                            }
                        }
                        document.getElementById("subject_table").innerHTML = this.generateSubjectTableCells()
                        this.generateSubjectStatsTable()
                    } else if (response.action == "manage_subjectchangepassword" && response.status == "success") {
                        alert("Passwort erfolgreich geaendert.")
                    } else if (response.action == "manage_subjectchangepassword" && response.status == "nogroupaccess") {
                        alert("Passwort konnte nicht geaendert werden, da fuer die Gruppe des Probanden keine Rechte bestehen.")
                    } else if (response.action == "manage_reportingcsvcompact" && response.status == "success") {
                        this.reportingGenerateCSVLinks(response.csv, "compact")
                    } else if (response.action == "manage_reportingcsvpagevisits" && response.status == "success") {
                        this.reportingGenerateCSVLinks(response.csv, "pagevisits")
                    } else if (response.action == "manage_reportingcsvactionlog" && response.status == "success") {
                        if (response.filename != "") {
                            this.reportingGenerateDownloadLink(response.filename, response.uncompressedsize, response.ac)
                        } else {
                            alert("keine Daten vorhanden")
                        }
                    } else if (response.action == "manage_reportingcsvanonymousdata" && response.status == "success") {
                        this.reportingGenerateCSVLinks(response.csv, "anonymousdata")
                    } else if (response.action == "manage_reportingfiles" && response.status == "success") {
                        if (response.filename != "") {
                            this.reportingGenerateDownloadLink(response.filename, response.uncompressedsize, response.ac)
                        } else {
                            alert("keine Daten vorhanden")
                        }
                    } else if (response.action == "manage_usergetall" && response.status == "success") {
                        this.alluser = []
                        for (let i = 0; i < response.data.length; i++) {
                            this.alluser.push(new User(response.data[i].userid, null, response.data[i].role, response.data[i].studies, response.data[i].groups, response.data[i].lastlogin))
                        }
                        document.getElementById("user_table").innerHTML = this.generateUserTableCells()
                    } else if (response.action == "manage_usercreate" && response.status == "success") {
                        this.userRefresh()
                    } else if (response.action == "manage_usercreate" && response.status == "exists") {
                        this.userRefresh()
                        alert("Ein Benutzer mit dieser ID ist bereits vorhanden.")
                    } else if (response.action == "manage_useredit" && response.status == "success") {
                        this.userRefresh()
                    } else if (response.action == "manage_userdelete" && response.status == "success") {
                        this.userRefresh()
                    }
                }
            } else {
                alert("Der Server meldet Status " + this.request.status)
            }
        }
    }

    reportingGenerateCSVLinks(csvcontent, mode) {
        let filename = this.studyid + "_" + mode + ".csv"
        let linksave = document.getElementById(`reporting_linkcsv${mode}save`)
        let linkshow = document.getElementById(`reporting_linkcsv${mode}show`)
        let blob = new Blob([csvcontent], { type: "text/csv;charset=utf-8;" })
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, filename)
        } else {
            if (linksave.download !== undefined) {
                // feature detection
                console.log("HTML5 blob download mode")
                // Browsers that support HTML5 download attribute
                let url = URL.createObjectURL(blob)
                linksave.setAttribute("href", url)
                linksave.setAttribute("download", filename)
                linksave.style.color = "#000000"
            } else {
                console.log("Data URI mode")
                // Data URI
                let csvData = "data:application/csv;charset=utf-8," + encodeURIComponent(csvcontent)
                linksave.setAttribute("href", csvData)
                linksave.setAttribute("download", filename)
                linksave.setAttribute("target", "_blank")
                linksave.style.color = "#000000"
            }
        }
        this.reportingcsvviewdata = this.reportingCSVToHTMLTable(csvcontent)
        linkshow.addEventListener("click", this.showCSVViewBound)
        linkshow.style.color = "#000000"
        linkshow.style.cursor = "pointer"
    }

    reportingCSVToHTMLTable(csvcontent) {
        let rows = csvcontent.split("\n")
        let result = "<table id='outputtable' border=1 cellpadding=7 style='border: 1px solid grey; border-collapse: collapse; font-family:Arial;'>"
        for (let i = 0; i < rows.length; i++) {
            let row = "<tr>"
            if (i == 0) {
                row = "<tr style='background-color: #cccccc; font-weight: bold; color:#555555;'>"
            } else if (i % 2 == 0) {
                row = "<tr style='background-color: #f0f0f0;'>"
            }
            let rowdata = rows[i].split(";")
            for (let j = 0; j < rowdata.length; j++) {
                row = row + "<td>" + rowdata[j] + "</td>"
            }
            row = row + "</tr>"
            result = result + row
        }
        return result + "</table>"
    }

    reportingGenerateDownloadLink(filename, uncompressedsize, accesscode) {
        let reportingtype = filename.split("_")[1].split(".")[0]
        if (reportingtype != "files") {
            reportingtype = "csv" + reportingtype
        }
        console.log("creating " + reportingtype + " download link")
        let estimatedwaitingtime = (uncompressedsize / 1000000) * 75
        document.getElementById("reporting_link" + reportingtype + "download").innerHTML = Math.round(estimatedwaitingtime / 1000)
        this.downloadfilename = filename
        this.accesscode = accesscode
        this.currenttimeout = setInterval(this.reportingProcessDownloadLinkStatus.bind(this), 1000)
    }

    reportingProcessDownloadLinkStatus() {
        let reportingtype = this.downloadfilename.split("_")[1].split(".")[0]
        if (reportingtype != "files") {
            reportingtype = "csv" + reportingtype
        }
        let elem = document.getElementById("reporting_link" + reportingtype + "download")
        let t = parseInt(elem.innerHTML)
        if (t > 1) {
            elem.innerHTML = t - 1
        } else {
            clearInterval(this.currenttimeout)
            elem.innerHTML = "herunterladen (30 Minuten verfügbar)"
            elem.style.color = "#000000"
            elem.setAttribute("href", "https://versuche.iwm-tuebingen.de/download?file=" + this.downloadfilename + "&ac=" + this.accesscode)
        }
    }

    subjectRefresh() {
        console.log("subjectlist refresh")
        let requestdata = { action: "manage_subjectgetall", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    generateSubjectTableCells() {
        let result =
            "<tr><td>Gruppe</td><td>Benutzer-ID</td><td>Versuchslauf</td><td>Bedingung</td><td>Startzeit</td><td>aktuelle Seite</td><td>letzter Wechsel</td><td>Status</td><td>Passwort</td></tr>"
        for (let i = 0; i < this.allsubjects.length; i++) {
            let subject = this.allsubjects[i]
            let row = "<tr>"
            row = row + "<td>" + subject.group + "</td>"
            row = row + "<td>" + subject.userid + "</td>"
            row = row + "<td>" + subject.runid + "</td>"
            row = row + "<td>" + subject.condition + "</td>"
            let st = new Date(subject.starttime)
            row = row + "<td>" + st.toLocaleString() + "</td>"
            row = row + "<td>" + subject.currentpage + "</td>"
            let la = new Date(subject.lastactivity)
            row = row + "<td>" + la.toLocaleString() + "</td>"
            row = row + "<td>" + subject.userrunstatus + "</td>"
            row =
                row +
                "<td style='width:80px;'><button id='subjecteditbtn_" +
                subject.userid +
                "' class='button has-text-white has-background-grey' style='width:80px; height:25px; padding:0px;' onclick='iwmstudy_manager.subjectChangePassword(event)'>ändern</button></td></tr>"
            result = result + row
        }
        return result
    }

    generateSubjectStatsTable() {
        let completed = ""
        let aborted = ""
        let advanced = ""
        let other = ""
        let total = ""
        for (let cs of this.allconditionstats.values()) {
            completed = completed + cs.conditionid + ": " + cs.countcompleted + " &nbsp;&nbsp;&nbsp;"
            aborted = aborted + cs.conditionid + ": " + cs.countaborted + " &nbsp;&nbsp;&nbsp;"
            advanced = advanced + cs.conditionid + ": " + cs.countadvanced + " &nbsp;&nbsp;&nbsp;"
            other = other + cs.conditionid + ": " + (cs.countstarted + cs.countunknown + cs.countcreated) + " &nbsp;&nbsp;&nbsp;"
            total = total + cs.conditionid + ": " + cs.counttotal + " &nbsp;&nbsp;&nbsp;"
        }
        document.getElementById("subject_statscompleted").innerHTML = completed
        document.getElementById("subject_statsaborted").innerHTML = aborted
        document.getElementById("subject_statsadvanced").innerHTML = advanced
        document.getElementById("subject_statsother").innerHTML = other
        document.getElementById("subject_statstotal").innerHTML = total
    }

    getSubject(userid) {
        for (let i = 0; i < this.allsubjects.length; i++) {
            if (this.allsubjects[i].userid == userid) {
                return this.allsubjects[i]
            }
        }
        return null
    }

    subjectChangePassword(event) {
        let subject = this.getSubject(event.currentTarget.id.split("_")[1])
        document.getElementById("subject_password_userid").value = subject.userid
        document.getElementById("subject_password_group").value = subject.group
        document.getElementById("subject_password_password").value = ""
        this.mode = "subject_password"
        this.changeView()
    }

    subjectChangePasswordSend(event) {
        console.log("change subject password")
        let s_userid = document.getElementById("subject_password_userid").value
        let s_group = document.getElementById("subject_password_group").value
        let s_passwordhash = this.getHash(document.getElementById("subject_password_password").value)
        let requestdata = {
            action: "manage_subjectchangepassword",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            s_userid: s_userid,
            s_group: s_group,
            s_passwordhash: s_passwordhash
        }
        this.doRequest(requestdata)
        this.mode = "subject"
        this.changeView()
    }

    userRefresh() {
        console.log("userlist refresh")
        let requestdata = { action: "manage_usergetall", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash }
        this.doRequest(requestdata)
    }

    generateUserTableCells() {
        let result = "<tr><td>ID</td><td>Rechte</td><td>Studien</td><td>Gruppen</td><td>letzter Login</td><td> </td></tr>"
        for (let i = 0; i < this.alluser.length; i++) {
            let user = this.alluser[i]
            let row = "<tr>"
            row = row + "<td>" + user.userid + "</td>"
            row = row + "<td>" + user.role + "</td>"
            row = row + "<td>" + user.studies + "</td>"
            row = row + "<td>" + user.groups + "</td>"
            let ll = new Date(user.lastlogin)
            row = row + "<td style='width:220px;'>" + ll.toLocaleString() + "</td>"
            row =
                row +
                "<td style='width:90px;'><button id='usereditbtn_" +
                user.userid +
                "' class='button has-text-white has-background-grey' style='width:90px; height:25px; padding:0px;' onclick='iwmstudy_manager.userEdit(event)'>bearbeiten</button></td></tr>"
            result = result + row
        }
        return result
    }

    getUser(userid) {
        for (let i = 0; i < this.alluser.length; i++) {
            if (this.alluser[i].userid == userid) {
                return this.alluser[i]
            }
        }
        return null
    }

    userCreate(event) {
        document.getElementById("user_create_userid").value = ""
        document.getElementById("user_create_password").value = ""
        document.getElementById("user_create_role").value = "masteradmin"
        document.getElementById("user_create_studies").value = ""
        document.getElementById("user_create_groups").value = ""
        this.mode = "user_create"
        this.userCreateEditRoleChanged(null)
        this.changeView()
    }

    userEdit(event) {
        let user = this.getUser(event.currentTarget.id.split("_")[1])
        document.getElementById("user_edit_userid").value = user.userid
        document.getElementById("user_edit_password").value = ""
        document.getElementById("user_edit_role").value = user.role
        document.getElementById("user_edit_studies").value = user.studies
        document.getElementById("user_edit_groups").value = user.groups
        document.getElementById("user_edit_deletebtn").setAttribute("disabled", "disabled")
        document.getElementById("user_edit_deleteapproval").checked = false
        this.mode = "user_edit"
        this.userCreateEditRoleChanged(null)
        this.changeView()
    }

    userCreateEditRoleChanged(event) {
        let m = this.mode.split("_")[1]
        let rolevalue = document.getElementById("user_" + m + "_role").value
        if (rolevalue == "masteradmin") {
            document.getElementById("user_" + m + "_studies").value = ""
            document.getElementById("user_" + m + "_groups").value = ""
            document.getElementById("user_" + m + "_studies").setAttribute("disabled", "disabled")
            document.getElementById("user_" + m + "_groups").setAttribute("disabled", "disabled")
        } else if (rolevalue == "studyadmin") {
            if (m == "edit") {
                let user = this.getUser(document.getElementById("user_" + m + "_userid").value)
                document.getElementById("user_" + m + "_studies").value = user.studies
            }
            document.getElementById("user_" + m + "_groups").value = ""
            document.getElementById("user_" + m + "_studies").removeAttribute("disabled", "disabled")
            document.getElementById("user_" + m + "_groups").setAttribute("disabled", "disabled")
        } else if (rolevalue == "groupadmin") {
            if (m == "edit") {
                let user = this.getUser(document.getElementById("user_" + m + "_userid").value)
                document.getElementById("user_" + m + "_studies").value = user.studies
                document.getElementById("user_" + m + "_groups").value = user.groups
            }
            document.getElementById("user_" + m + "_studies").removeAttribute("disabled", "disabled")
            document.getElementById("user_" + m + "_groups").removeAttribute("disabled", "disabled")
        }
    }

    userCreateSend(event) {
        console.log("create user")
        let c_userid = document.getElementById("user_create_userid").value
        let c_passwordhash = this.getHash(document.getElementById("user_create_password").value)
        let c_role = document.getElementById("user_create_role").value
        let c_studies = document.getElementById("user_create_studies").value
        let c_groups = document.getElementById("user_create_groups").value
        let requestdata = {
            action: "manage_usercreate",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            c_userid: c_userid,
            c_passwordhash: c_passwordhash,
            c_role: c_role,
            c_studies: c_studies,
            c_groups: c_groups
        }
        this.doRequest(requestdata)
        this.mode = "user"
        this.changeView()
    }

    userEditSend(event) {
        console.log("edit user")
        let e_userid = document.getElementById("user_edit_userid").value
        let e_role = document.getElementById("user_edit_role").value
        let e_studies = document.getElementById("user_edit_studies").value
        let e_groups = document.getElementById("user_edit_groups").value
        let requestdata = {
            action: "manage_useredit",
            studyid: this.studyid,
            userid: this.userid,
            passwordhash: this.passwordhash,
            e_userid: e_userid,
            e_role: e_role,
            e_studies: e_studies,
            e_groups: e_groups
        }
        this.doRequest(requestdata)
        this.mode = "user"
        this.changeView()
    }

    userDeleteSend(event) {
        console.log("delete user")
        let d_userid = document.getElementById("user_edit_userid").value
        let requestdata = { action: "manage_userdelete", studyid: this.studyid, userid: this.userid, passwordhash: this.passwordhash, d_userid: d_userid }
        this.doRequest(requestdata)
        this.mode = "user"
        this.changeView()
    }

    userDeleteCheck(event) {
        if (document.getElementById("user_edit_deleteapproval").checked) {
            document.getElementById("user_edit_deletebtn").removeAttribute("disabled")
        } else {
            document.getElementById("user_edit_deletebtn").setAttribute("disabled", "disabled")
        }
    }
}

class Subject {
    constructor(userid, group, runid, condition, starttime, currentpage, lastactivity, userrunstatus) {
        this.userid = userid
        this.group = group
        this.runid = runid
        this.condition = condition
        this.starttime = starttime
        this.currentpage = currentpage
        this.lastactivity = lastactivity
        this.userrunstatus = userrunstatus
    }
}

class ConditionStatistic {
    constructor(conditionid) {
        this.conditionid = conditionid
        this.counttotal = 0
        this.countunknown = 0
        this.countcreated = 0
        this.countstarted = 0
        this.countadvanced = 0
        this.countcompleted = 0
        this.countaborted = 0
    }
}

class User {
    constructor(userid, passwordhash, role, studies, groups, lastlogin) {
        this.userid = userid
        this.passwordhash = passwordhash
        this.role = role
        this.studies = studies
        this.groups = groups
        this.lastlogin = lastlogin
    }
}

function createIWMStudyServerManager() {
    window.iwmstudy_manager = new StudyServerManager()
}
