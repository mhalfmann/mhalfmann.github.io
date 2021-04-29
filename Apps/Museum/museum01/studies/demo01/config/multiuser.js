var IWM = IWM || {}
IWM.conditionconfig = {
    conditionid: "multiuser",
    title: "multiuser",
    description: "Eine demo01-Bedingung.",
    language: "DE",
    progressmaxpagecount: null,
    pagedefaults: {
        backallowed: true,
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
        { pageid: "start", src: "show_de/start.html", nextid: "multiuser_sync", firstpage: true },
        { pageid: "multiuser_sync", src: "multiuser/sync.html", nextid: "multiuser_rpc", syncid: "syncpoint1" },
        { pageid: "multiuser_rpc", src: "multiuser/rpc.html", nextid: "multiuser_chat", advpage: true },
        { pageid: "multiuser_chat", src: "multiuser/chat.html", nextid: "ende" },
        { pageid: "ende", src: "show_de/ende.html", nextallowed: false, lastpage: true }
    ],
    pagegroups: []
}
