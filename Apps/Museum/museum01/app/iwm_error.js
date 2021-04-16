//
// description:		module offers error processing
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class ErrorLogEntry {
    constructor(type, errorcode) {
        this.timestamp = Date.now()
        this.type = type //error, resolved
        this.errorcode = errorcode
    }
}

class ErrorProcessor {
    constructor(errorlog) {
        this.errorlog = errorlog
        window.addEventListener("iwmstudyerror", this.processError.bind(this))
        window.addEventListener("iwmstudyerrorresolved", this.resolvedError.bind(this))
    }

    processError(event) {
        this.errorlog.push(new ErrorLogEntry("error", event.detail.error))
        document.getElementById("errorviewheadline").innerHTML = "Es ist ein Fehler aufgetreten. Bitte wenden Sie sich wenn möglich an den Versuchsleiter."
        document.getElementById("errorviewdescription").innerHTML = event.detail.errordescription
        document.getElementById("errorviewerrorcode").innerHTML = event.detail.error
        setTimeout(this.showErrorView.bind(this), 30)
    }

    resolvedError(event) {
        this.errorlog.push(new ErrorLogEntry("resolved", event.detail.error))
        document.getElementById("errorviewheadline").innerHTML = "Problem wurde behoben."
        document.getElementById("errorviewdescription").innerHTML = event.detail.errordescription
        document.getElementById("errorviewerrorcode").innerHTML = event.detail.error
        setTimeout(this.showErrorView.bind(this), 30)
    }

    showErrorView() {
        document.getElementById("setup_view").style.display = "none"
        document.getElementById("register_view").style.display = "none"
        document.getElementById("registeranonym_view").style.display = "none"
        document.getElementById("studyrunning_view").style.display = "none"
        document.getElementById("error_view").style.display = "block"
    }
}
