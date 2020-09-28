//
// description:		module offers error processing
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class ErrorProcessor {
    constructor() {
        window.addEventListener("iwmstudyerror", this.processError.bind(this))
    }

    processError(event) {
        document.getElementById("errorviewdescription").innerHTML = event.detail.errordescription 
        document.getElementById("errorviewerrorcode").innerHTML = event.detail.error 
        setTimeout(this.showErrorView.bind(this), 30)
    }

    showErrorView(){
        document.getElementById("setup_view").style.display = "none"
        document.getElementById("register_view").style.display = "none"
        document.getElementById("registeranonym_view").style.display = "none"
        document.getElementById("studyrunning_view").style.display = "none"
        document.getElementById("error_view").style.display = "block"
    }
}