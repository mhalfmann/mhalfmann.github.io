var IWM = IWM || {};
IWM.conditionconfig =
    {
        "conditionid": "showkurz_de",
        "title": "showkurz_de",
        "description": "Eine demo01-Bedingung zur Präsentation der Versuchsumgebung IWMStudy.",
        "language": "DE",
        "progressmaxpagecount": null,
        "pages":
            [
                { "pageid": "start", "src": "show_de/start.html", "nextid": "ueberblick", "first": true, "layout": "iwmgrey_flex" },
                { "pageid": "ueberblick", "src": "show_de/ueberblick.html", "nextid": "einsatz", "layout": "iwmgrey_flex" },
                { "pageid": "einsatz", "src": "show_de/einsatz.html", "nextid": "studienbeginn", "layout": "iwmgrey_flex" },
                { "pageid": "studienbeginn", "src": "show_de/studienbeginn.html", "nextid": "material_textbild", "layout": "iwmgrey_flex" },
                { "pageid": "material_textbild", "src": "material_textbild.html", "nextid": "material_listcodetable", "layout": "iwmgrey_flex" },
                { "pageid": "material_listcodetable", "src": "material_listcodetable.html", "nextid": "material_audiovideo", "layout": "iwmgrey_flex" },
                { "pageid": "material_audiovideo", "src": "material_audiovideo.html", "nextid": "material_fragen01", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen01", "src": "show_de/material_fragen01.html", "nextid": "material_fragen02", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen02", "src": "show_de/material_fragen02.html", "nextid": "materialerstellung", "layout": "iwmgrey_flex" },
                { "pageid": "materialerstellung", "src": "show_de/materialerstellung.html", "nextid": "material_interaktiv", "layout": "iwmgrey_flex" },
                { "pageid": "material_interaktiv", "src": "zeichnen_ellipsen.html", "nextid": "layouts", "layout": "iwmgrey_flex" },                
                { "pageid": "layouts", "src": "show_de/layouts.html", "nextid": "whatsapp", "layout": "handheld_flex" },
                { "pageid": "whatsapp", "src": "show_de/whatsapp.html", "nextid": "ablauf", "layout": "whatsapp" },
                { "pageid": "ablauf", "src": "show_de/ablauf.html", "nextid": "logdateien", "layout": "iwmgrey_flex", "mintime": 10, "maxtime": 3600 },
                { "pageid": "logdateien", "src": "show_de/logdateien.html", "nextid": "multiuser", "layout": "iwmgrey_flex" },                
                { "pageid": "multiuser", "src": "show_de/multiuser.html", "nextid": "projekt", "layout": "iwmgrey_flex" },                
                { "pageid": "projekt", "src": "show_de/projekt.html", "nextid": "ende", "layout": "iwmgrey_flex" },                
                { "pageid": "ende", "src": "show_de/ende.html", "nextallowed": false, "layout": "iwmgrey_flex" }
            ],
        "pagegroups": [ ]
    }