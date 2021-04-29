//
// description:		reporting module for exporting indexedDB data
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class StudyLocalManager {
    constructor() {
        this.studyid
        this.dbrequest
        this.db
        this.data
        this.datafields
        this.csvView
        this.mode
        if ((navigator.platform.substr(0, 2) === "iP" || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) && window.webkit && window.webkit.messageHandlers) {
            this.mode = "iwmstudyiosapp"
        } else {
            this.mode = "browsertabs"
        }
        if (IWM.globalconfig.headerimg != null) {
            document.getElementById("headerimg").src = IWM.globalconfig.headerimg
        }
        if (IWM.globalconfig.logoimg != null) {
            document.getElementById("logoimg").src = IWM.globalconfig.logoimg
        }
        if (IWM.globalconfig.logotext != null) {
            document.getElementById("logotext").innerHTML = IWM.globalconfig.logotext
        }
        document.getElementById("versiontext").innerText = "v. " + IWM.globalconfig.appversion
        document.getElementById("studyidinput").value = IWM.globalconfig.defaultstudyid
        this.dbrequest = indexedDB.open("iwmstudy", 8)
        this.dbrequest.addEventListener("upgradeneeded", this.dbUpdateNeeded.bind(this))
        this.dbrequest.addEventListener("success", this.dbOpened.bind(this))
        this.showCSVViewBound = this.showCSVView.bind(this)
    }

    dbUpdateNeeded(event) {
        // event for db creation or modification
        console.log("local DB does not exist or has wrong version")
        this.db = this.dbrequest.result
    }

    dbOpened(event) {
        console.log("local DB openend")
        this.db = this.dbrequest.result
    }

    showCSVView() {
        if (this.mode == "iwmstudyiosapp") {
            window.webkit.messageHandlers.mainmsgin.postMessage({ type: "appmode_data", details: {} })
            document.write(this.csvView)
        } else {
            window.open().document.write(this.csvView)
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

    clearGeneratedData() {
        this.data = null
        this.datafields = null
        this.allstudyuser = null
        this.csvView = null
        linkcsvcompactsave.style.color = "#dddddd"
        linkcsvcompactsave.removeAttribute("href")
        linkcsvcompactsave.removeAttribute("download")
        linkcsvcompactshow.style.color = "#dddddd"
        linkcsvcompactshow.style.cursor = "text"
        linkcsvcompactshow.removeEventListener("click", this.showCSVViewBound)
        linkcsvpagevisitssave.style.color = "#dddddd"
        linkcsvpagevisitssave.removeAttribute("href")
        linkcsvpagevisitssave.removeAttribute("download")
        linkcsvpagevisitsshow.style.color = "#dddddd"
        linkcsvpagevisitsshow.style.cursor = "text"
        linkcsvpagevisitsshow.removeEventListener("click", this.showCSVViewBound)
        linkcsvactionlogsave.style.color = "#dddddd"
        linkcsvactionlogsave.removeAttribute("href")
        linkcsvactionlogsave.removeAttribute("download")
        linkcsvactionlogshow.style.color = "#dddddd"
        linkcsvactionlogshow.style.cursor = "text"
        linkcsvactionlogshow.removeEventListener("click", this.showCSVViewBound)
        linkcsvanonymousdatasave.style.color = "#dddddd"
        linkcsvanonymousdatasave.removeAttribute("href")
        linkcsvanonymousdatasave.removeAttribute("download")
        linkcsvanonymousdatashow.style.color = "#dddddd"
        linkcsvanonymousdatashow.style.cursor = "text"
        linkcsvanonymousdatashow.removeEventListener("click", this.showCSVViewBound)
    }

    reportingCSVCompact() {
        this.clearGeneratedData()
        this.studyid = document.getElementById("studyidinput").value
        this.allstudyuser = new Map()
        this.data = [["study", "version", "condition", "run", "runcreated", "user", "group", "initialdata", "runtimedata", "errorlog", "browserinfo", "screeninfo"]]
        this.datafields = new Set()
        console.log(`csvcompact reporting for ${this.studyid} started`)
        let trans = this.db.transaction(["user"], "readonly")
        let store = trans.objectStore("user")
        let index = store.index("user_index1")
        let request = index.openCursor()
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let userdata = cursor.value
                if (userdata.roles[self.studyid] != null) {
                    self.allstudyuser.set(userdata.userid, userdata)
                }
                cursor.continue()
            } else {
                self.reportingCSVCompactStep2()
            }
        }
    }

    reportingCSVCompactStep2() {
        let trans = this.db.transaction(["run"], "readonly")
        let store = trans.objectStore("run")
        let index = store.index("run_index1")
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let rundata = cursor.value
                for (let i = 0; i < rundata.runuser.split(",").length; i++) {
                    let usr = rundata.runuser.split(",")[i]
                    self.data.push([
                        rundata.studyid,
                        rundata.expversion,
                        rundata.conditionid,
                        rundata.runid,
                        rundata.creationtime,
                        usr,
                        self.allstudyuser.get(usr).group,
                        rundata.runuserdata[usr].initialdata,
                        JSON.stringify(rundata.runuserdata[usr].runtimedata),
                        JSON.stringify(rundata.runuserdata[usr].errorlog),
                        self.allstudyuser.get(usr).browserinfo,
                        self.allstudyuser.get(usr).screeninfo
                    ])
                }
                cursor.continue()
            } else {
                self.reportingCSVCompactStep3()
            }
        }
    }

    reportingCSVCompactStep3() {
        let trans = this.db.transaction(["pagevisit"], "readonly")
        let store = trans.objectStore("pagevisit")
        let index = store.index("pagevisit_index3")
        let request = index.openCursor(IDBKeyRange.only([this.studyid, 1]))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let pagedata = cursor.value
                for (let key in pagedata.data) {
                    self.datafields.add(pagedata.pageid + "-" + key)
                }
                cursor.continue()
            } else {
                let df = Array.from(self.datafields)
                df.sort()
                self.data[0] = self.data[0].concat(df)
                let dataleft = self.data.length - 1
                for (let i = 1; i < self.data.length; i++) {
                    let userfullpagedata = {}
                    let trans = self.db.transaction(["pagevisit"], "readonly")
                    let store = trans.objectStore("pagevisit")
                    let index = store.index("pagevisit_index2")
                    let request = index.openCursor(IDBKeyRange.only([self.studyid, self.data[i][3], self.data[i][5], 1]))
                    request.onsuccess = function (evt) {
                        let cursor = evt.target.result
                        if (cursor) {
                            let pagedata = cursor.value
                            for (let key in pagedata.data) {
                                userfullpagedata[pagedata.pageid + "-" + key] = pagedata.data[key]
                            }
                            cursor.continue()
                        } else {
                            let result = []
                            for (let column of df) {
                                if (userfullpagedata.hasOwnProperty(column)) {
                                    result.push(userfullpagedata[column])
                                } else {
                                    result.push("")
                                }
                            }
                            self.data[i] = self.data[i].concat(result)
                            dataleft--
                            if (dataleft == 0) {
                                console.log(`${self.data.length - 1} datasets created, exporting to csv`)
                                self.exportToCsv(`${self.studyid}_compact.csv`, self.data, "csvcompact")
                            }
                        }
                    }
                }
            }
        }
    }

    reportingCSVPagevisits() {
        this.clearGeneratedData()
        this.studyid = document.getElementById("studyidinput").value
        this.data = [["study", "run", "user", "pagecounter", "page", "starttime", "endtime", "visittime", "data"]]
        console.log(`csvpagevisits reporting for ${this.studyid} started`)
        let trans = this.db.transaction(["pagevisit"], "readonly")
        let store = trans.objectStore("pagevisit")
        let index = store.index("pagevisit_index5")
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let dbitem = cursor.value
                let dataset = [dbitem.studyid, dbitem.runid, dbitem.userid, dbitem.pagecounter, dbitem.pageid, dbitem.starttime, dbitem.endtime, dbitem.visittime, JSON.stringify(dbitem.data)]
                self.data.push(dataset)
                cursor.continue()
            } else {
                console.log(`${self.data.length - 1} datasets created, exporting to csv`)
                self.exportToCsv(`${self.studyid}_pagevisits.csv`, self.data, "csvpagevisits")
            }
        }
    }

    reportingCSVActionlog() {
        this.clearGeneratedData()
        this.studyid = document.getElementById("studyidinput").value
        this.data = [["study", "run", "user", "pagecounter", "page", "timestamp", "elapsedtime", "action"]]
        this.datafields = new Set()
        console.log(`csvactionlog reporting for ${this.studyid} started`)
        let trans = this.db.transaction(["actionlog"], "readonly")
        let store = trans.objectStore("actionlog")
        let index = store.index("actionlog_index1")
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let logdata = cursor.value
                for (let key in logdata.data) {
                    self.datafields.add(key)
                }
                cursor.continue()
            } else {
                let df = Array.from(self.datafields)
                df.sort()
                self.data[0] = self.data[0].concat(df)
                let trans = self.db.transaction(["actionlog"], "readonly")
                let store = trans.objectStore("actionlog")
                let index = store.index("actionlog_index1")
                let request = index.openCursor(IDBKeyRange.only(self.studyid))
                request.onsuccess = function (evt) {
                    let cursor = evt.target.result
                    if (cursor) {
                        let dbitem = cursor.value
                        let dataset = [dbitem.studyid, dbitem.runid, dbitem.userid, dbitem.pagecounter, dbitem.pageid, dbitem.timestamp, dbitem.elapsedtime, dbitem.action]
                        for (let dfitem of df) {
                            if (dbitem.data.hasOwnProperty(dfitem)) {
                                dataset.push(dbitem.data[dfitem])
                            } else {
                                dataset.push("")
                            }
                        }
                        self.data.push(dataset)
                        cursor.continue()
                    } else {
                        console.log(`${self.data.length - 1} datasets created, exporting to csv`)
                        self.exportToCsv(`${self.studyid}_actionlog.csv`, self.data, "csvactionlog")
                    }
                }
            }
        }
    }

    reportingCSVAnonymousData() {
        this.clearGeneratedData()
        this.studyid = document.getElementById("studyidinput").value
        this.data = [["study", "bundlecode", "pagecounter", "page", "elapsedtime", "type"]]
        this.datafields = new Set()
        console.log(`csvanonymousdata reporting for ${this.studyid} started`)
        let trans = this.db.transaction(["anonymousdata"], "readonly")
        let store = trans.objectStore("anonymousdata")
        let index = store.index("anonymousdata_index1")
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let logdata = cursor.value
                for (let key in logdata.data) {
                    self.datafields.add(key)
                }
                cursor.continue()
            } else {
                let df = Array.from(self.datafields)
                df.sort()
                self.data[0] = self.data[0].concat(df)
                let trans = self.db.transaction(["anonymousdata"], "readonly")
                let store = trans.objectStore("anonymousdata")
                let index = store.index("anonymousdata_index1")
                let request = index.openCursor(IDBKeyRange.only(self.studyid))
                request.onsuccess = function (evt) {
                    let cursor = evt.target.result
                    if (cursor) {
                        let dbitem = cursor.value
                        let dataset = [dbitem.studyid, dbitem.bundlecode, dbitem.pagecounter, dbitem.pageid, dbitem.elapsedtime, dbitem.type]
                        for (let dfitem of df) {
                            if (dbitem.data.hasOwnProperty(dfitem)) {
                                dataset.push(dbitem.data[dfitem])
                            } else {
                                dataset.push("")
                            }
                        }
                        self.data.push(dataset)
                        cursor.continue()
                    } else {
                        console.log(`${self.data.length - 1} datasets created, exporting to csv`)
                        self.exportToCsv(`${self.studyid}_anonymousdata.csv`, self.data, "csvanonymousdata")
                    }
                }
            }
        }
    }

    reportingFiles() {
        this.studyid = document.getElementById("studyidinput").value
        console.log(`file export for ${this.studyid} started`)
        let zip = new JSZip()
        let trans = this.db.transaction(["file"], "readonly")
        let store = trans.objectStore("file")
        let index = store.index("file_index1")
        let request = index.openCursor(IDBKeyRange.only(this.studyid))
        let self = this
        request.onsuccess = function (evt) {
            let cursor = evt.target.result
            if (cursor) {
                let dbitem = cursor.value
                zip.file(dbitem.filename, dbitem.blob)
                cursor.continue()
            } else {
                console.log(`zip with ${Object.keys(zip.files).length} files created`)
                zip.generateAsync({ type: "blob" }).then(function (zipblob) {
                    console.log("preparing for HTML5 blob download")
                    let url = URL.createObjectURL(zipblob)
                    linkfilessave.setAttribute("href", url)
                    linkfilessave.setAttribute("download", self.studyid + "_files.zip")
                    linkfilessave.style.color = "#000000"
                })
            }
        }
    }

    exportToCsv(filename, rows, mode) {
        let processRow = function (row, newline = "\n") {
            let finalVal = ""
            for (let j = 0; j < row.length; j++) {
                let innerValue = ""
                if (row[j] != undefined) {
                    innerValue = row[j] === null ? "" : row[j].toString()
                    if (row[j] instanceof Date) {
                        innerValue = row[j].toLocaleString()
                    }
                }
                let result = innerValue.replace(/"/g, '""')
                result = result.replace(/\n/g, " ")
                result = result.replace(/\r/g, " ")
                if (result.search(/("|;|\n)/g) >= 0) {
                    result = '"' + result + '"'
                }
                if (j > 0) {
                    finalVal += ";"
                }
                finalVal += result
            }
            return finalVal + newline
        }
        let csvFile = ""
        for (let i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i])
        }
        if (csvFile.length >= 2) {
            //remove last newline
            csvFile = csvFile.substr(0, csvFile.length - 1)
        }
        let linksave = document.getElementById(`link${mode}save`)
        let linkshow = document.getElementById(`link${mode}show`)
        let blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" })
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
                let csvData = "data:application/csv;charset=utf-8," + encodeURIComponent(csvFile)
                linksave.setAttribute("href", csvData)
                linksave.setAttribute("download", filename)
                linksave.setAttribute("target", "_blank")
                linksave.style.color = "#000000"
            }
        }
        this.csvView = this.reportingCSVToHTMLTable(csvFile)
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
}

function createIWMStudyLocalManager() {
    window.iwmstudy_manager = new StudyLocalManager()
}
