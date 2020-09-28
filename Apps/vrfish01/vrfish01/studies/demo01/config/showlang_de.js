var IWM = IWM || {};
IWM.conditionconfig =
    {
        "conditionid": "showlang_de",
        "title": "showlang_de",
        "description": "Eine demo01-Bedingung zur Präsentation der Versuchsumgebung IWMStudy.",
        "language": "DE",
        "progressmaxpagecount": null,
        "pages":
            [
                { "pageid": "start", "src": "show_de/start.html", "nextid": "ueberblick", "first": true, "layout": "iwmgrey_flex"  },
                { "pageid": "ueberblick", "src": "show_de/ueberblick.html", "nextid": "einsatz", "layout": "iwmgrey_flex" },  
                { "pageid": "einsatz", "src": "show_de/einsatz.html", "nextid": "studienbeginn", "layout": "iwmgrey_flex" },
                { "pageid": "studienbeginn", "src": "show_de/studienbeginn.html", "nextid": "dateien", "layout": "iwmgrey_flex" },                              
                { "pageid": "dateien", "src": "show_de/dateien.html", "nextid": "konfiguration_global", "layout": "iwmgrey_flex" },
                { "pageid": "konfiguration_global", "src": "show_de/konfiguration_global.html", "nextid": "konfiguration_studie", "layout": "iwmgrey_flex" },
                { "pageid": "konfiguration_studie", "src": "show_de/konfiguration_studie.html", "nextid": "ablauf", "layout": "iwmgrey_flex" },
                { "pageid": "ablauf", "src": "show_de/ablauf.html", "nextid": "konfiguration_bedingung", "layout": "iwmgrey_flex", "mintime": 10, "maxtime": 3600, "keyboardnextkeycode": 32 },                
                { "pageid": "konfiguration_bedingung", "src": "show_de/konfiguration_bedingung.html", "nextid": "material_textbild", "layout": "iwmgrey_flex" },
                { "pageid": "material_textbild", "pagegroup": "phase1", "src": "material_textbild.html", "nextid": "material_minimal", "layout": "iwmgrey_flex" },
                { "pageid": "material_minimal", "pagegroup": "phase1", "src": "show_de/material_minimal.html", "nextid": "material_listcodetable", "layout": "iwmgrey_flex" },
                { "pageid": "material_listcodetable", "pagegroup": "phase1", "src": "material_listcodetable.html", "nextid": "material_audiovideo", "layout": "iwmgrey_flex" },                
                { "pageid": "material_audiovideo", "pagegroup": "phase1", "src": "material_audiovideo.html", "nextid": "material_interaktiv", "layout": "iwmgrey_flex" },
                { "pageid": "material_interaktiv", "src": "zeichnen_ellipsen.html", "nextid": "material_fragen_text", "layout": "iwmgrey_flex" },                
                { "pageid": "material_fragen_text", "src": "material_fragen_text.html", "nextid": "material_fragen_text_code", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_text_code", "src": "show_de/material_fragen_text_code.html", "nextid": "material_fragen_radio", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_radio", "src": "material_fragen_radio.html", "nextid": "material_fragen_radio_code", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_radio_code", "src": "show_de/material_fragen_radio_code.html", "nextid": "material_fragen_dropdown", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_dropdown", "src": "material_fragen_dropdown.html", "nextid": "material_fragen_checkbox", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_checkbox", "src": "material_fragen_checkbox.html", "nextid": "material_fragen_checkbox_code", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_checkbox_code", "src": "show_de/material_fragen_checkbox_code.html", "nextid": "material_fragen_slider", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_slider", "src": "material_fragen_slider.html", "nextid": "material_fragen_slider_code", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_slider_code", "src": "show_de/material_fragen_slider_code.html", "nextid": "material_fragen_dragndrop", "layout": "iwmgrey_flex" },
                { "pageid": "material_fragen_dragndrop", "src": "material_fragen_dragndrop.html", "nextid": "material_anonymousdata", "layout": "iwmgrey_flex" },                
                { "pageid": "material_anonymousdata", "src": "material_anonymousdata.html", "nextid": "material_funktionen", "layout": "iwmgrey_flex" },
                { "pageid": "material_funktionen", "src": "show_de/material_funktionen.html", "nextid": "layouts", "layout": "iwmgrey_flex" },                
                { "pageid": "layouts", "src": "show_de/layouts.html", "nextid": "whatsapp", "layout": "handheld_flex" },
                { "pageid": "whatsapp", "src": "show_de/whatsapp.html", "nextid": "logdateien", "layout": "whatsapp" },
                { "pageid": "logdateien", "src": "show_de/logdateien.html", "nextid": "multiuser", "layout": "iwmgrey_flex" },
                { "pageid": "multiuser", "src": "show_de/multiuser.html", "nextid": "projekt", "layout": "iwmgrey_flex" },                
                { "pageid": "projekt", "src": "show_de/projekt.html", "nextid": "ende", "layout": "iwmgrey_flex" },                
                { "pageid": "ende", "src": "show_de/ende.html", "nextallowed": false, "layout": "iwmgrey_flex" }                
            ],
        "pagegroups":
            [
                { "pagegroupid": "phase1", "maxtime": 1200 }
            ]
    }