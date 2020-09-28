var IWM = IWM || {};
IWM.conditionconfig =
    {
        "conditionid": "multiuser",
        "title": "multiuser",
        "description": "Eine demo01-Bedingung.",
        "language": "DE",
        "progressmaxpagecount": null,
        "pages":
            [
                { "pageid": "start", "src": "show_de/start.html", "nextid": "multiuser_sync", "first": true, "layout": "iwmgrey_flex"  },
                { "pageid": "multiuser_sync", "src": "multiuser_sync.html", "nextid": "multiuser_rpc", "layout": "iwmgrey_flex", "syncid": "syncpoint1" },
                { "pageid": "multiuser_rpc", "src": "multiuser_rpc.html", "nextid": "multiuser_chat", "layout": "iwmgrey_flex" },
                { "pageid": "multiuser_chat", "src": "multiuser_chat.html", "nextid": "ende", "layout": "iwmgrey_flex" },                
                { "pageid": "ende", "src": "show_de/ende.html", "nextallowed": false, "layout": "iwmgrey_flex" }
            ],
        "pagegroups": []
    }