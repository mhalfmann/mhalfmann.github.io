var IWM = IWM || {}
IWM.conditionconfig = {
    conditionid: "template",
    title: "template",
    description: "Vorlage fuer eine Bedingung",
    language: "DE",
    progressmaxpagecount: null,
    pagedefaults: {
        backallowed: false,
        backlabel: "zurück",
        controlsvisible: true,
        dataseparation: false,
        initdelay: 0,
        keyboardnextkeycode: null,
        layout: "iwmgrey_flex",
        loggingmedia: true,
        maxtimelabel: "Zeitlimit: ",
        mintimelabel: "Mindestzeit: ",
        nextallowed: true,
        nextlabel: "weiter",
        reloaddata: true
    },
    pages: [
        { pageid: "start", src: "start.html", nextid: "consent", firstpage: true },
        { pageid: "consent", src: "consent.html", nextid: "instr", backallowed: true },
        { pageid: "instr", src: "instr.html", nextid: "withdraw" },        
        
        { pageid: "withdraw", src: "withdraw.html", nextid: "studyinf", advpage: true },
        { pageid: "studyinf", src: "studyinf.html", nextid: "end" },
        { pageid: "end", src: "end.html", nextallowed: false, lastpage: true }
    ],
    pagegroups: []
}
