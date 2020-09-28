var IWM = IWM || {};
IWM.conditionconfig =
    {
        "conditionid": "complexsequence",
        "title": "complexsequence",
        "description": "Eine demo01-Bedingung.",
        "language": "DE",
        "progressmaxpagecount": null,
        "pages":
            [
                { "pageid": "start", "src": "show_de/start.html", "nextid": "example01", "first": true, "layout": "iwmgrey_flex" },
                { "pageid": "example01", "src": "material_fragen_radio.html", "nextid": "example02*example03", "layout": "iwmgrey_flex", "parameter": 5829 },
                { "pageid": "example02", "src": "material_textbild.html", "nextid": "example04|example05|example06", "layout": "iwmgrey_flex" },
                { "pageid": "example03", "src": "material_fragen_text.html", "nextid": "example04", "layout": "iwmgrey_flex", "maxvisits": 5 },
                { "pageid": "example04", "src": "material_fragen_slider.html", "nextid": "example05|example06", "layout": "iwmgrey_flex", "onlyuser": 1 },
                { "pageid": "example05", "src": "material_audio.html", "nextid": "example06", "layout": "iwmgrey_flex", "onlydata": "self.example01.geschlecht==s" },
                { "pageid": "example06", "src": "material_video.html", "nextid": "example07", "layout": "iwmgrey_flex", "pagegroup": "phase1" },
                { "pageid": "example07", "src": "interaktiv_zeichnen.html", "nextid": "ende", "layout": "iwmgrey_flex", "pagegroup": "phase2" },
                { "pageid": "ende", "src": "show_de/ende.html", "nextallowed": false, "layout": "iwmgrey_flex" }
            ],
        "pagegroups":
            [
                { "pagegroupid": "phase1", "mintime": 60 },
                { "pagegroupid": "phase2", "maxvisits": 20 }
            ]
    }