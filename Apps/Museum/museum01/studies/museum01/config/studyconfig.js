var IWM = IWM || {}
IWM.studyconfig = {
    title: "museum01",
    version: 0.20,
    min_appversion: 2.057,
    starttime: null,
    endtime: null,
    conditions: [
        {
            conditionid: "3d",
            active: true,
            neededuser: 1, // required user per run
            desiredrunnumber: null // desired runs with this condition
        },
        {
            conditionid: "2dsingle",
            active: true,
            neededuser: 1, // required user per run
            desiredrunnumber: null // desired runs with this condition
        },
        {
            conditionid: "2dmulti",
            active: true,
            neededuser: 1, // required user per run
            desiredrunnumber: null // desired runs with this condition
        }
    ],
    welcomepage: {
        loginmode: "anonym", // register or anonym
        register_visible: true,
        register_groupvisible: false,
        std_group: "IWM",
        register_emailvisible: false,
        register_passwordvisible: false,
        login_visible: true,
        login_preset: false,
        std_language: "DE",
        welcometext: {
            DE: {
                registerheadline: "Herzlich willkommen",
                registerheadline_prestart: "Herzlich willkommen",
                registerheadline_postend: "Herzlich willkommen",
                registertext: "Danke für das Interesse an unserer Studie. Um an der Studie teilzunehmen, ist das Anlegen eines Accounts mit einem pseudonymisierten Benutzernamen notwendig. Mit Hilfe dieses Benutznamens ist es später möglich, eine Löschung der Daten zu beauftragen. Der Benutzername wird wie folgt generiert:<br/><br/><table border='1' cellpadding='5' style='border-collapse:collapse; width:970px;'><tr><td><b>1. Buchstabe</b><br/>des Vonamens der Mutter z.B. <i>B</i></td><td><b>1. Buchstabe</b><br/>des eigenen Vornamens z.B. <i>L</i></td><td><b>Tag des<br/>Geburtsdatums</b> zweistellig z.B. <i>05</i></td><td><b>2. Buchstabe</b><br/>des Vonamens der Mutter z.B. <i>r</i></td><td><b>Monat des Geburtsdatums</b><br/>zweistellig z.B. <i>03</i></td><td><b>1. Buchstabe</b><br/>des Vonamens des Vaters z.B. <i>P</i></td></tr></table><br/>Ein beispielhafter Benutzername nach obigem Schema wäre <i>BL05r03P</i>",
                registertext_prestart: "Danke für das Interesse an unserer Studie. Die Studie beginnt am 04.05.2019. Eine Teilnahme ist ab dann hier möglich.",
                registertext_postend: "Danke für das Interesse an unserer Studie. Leider wurde diese Studie bereits beendet.",
                registerformheadline: "Neuen Account anlegen",
                registerformgrouplabel: "Organisations-ID",
                registerformuserlabel: "Benutzername",
                registerformpasswordlabel: "Passwort",
                registerformpassword2label: "Passwort wiederholen",
                registerformmaillabel: "E-Mail",
                registerformbutton: "anlegen",
                loginformheadline: "Mit bestehendem Account einloggen",
                loginformuserlabel: "Benutzername",
                loginformpasswordlabel: "Passwort",
                loginformbutton: "einloggen",
                anonymheadline: "Herzlich willkommen",
                anonymheadline_prestart: "Herzlich willkommen",
                anonymheadline_postend: "Herzlich willkommen",
                anonymtext: "Danke für das Interesse an unserer Studie. Um an der Studie teilzunehmen, bitte auf weiter drücken.",
                anonymtext_prestart: "Danke für das Interesse an unserer Studie. Die Studie beginnt am 04.05.2019. Eine Teilnahme ist ab dann hier möglich.",
                anonymtext_postend: "Danke für das Interesse an unserer Studie. Leider wurde diese Studie bereits beendet.",
                anonymbutton: "weiter",
                studyrunningheadline: " ",
                studyrunningtext: "Die Studie läuft in einem neuen Tab/Fenster, bitte diesen Tab nicht schließen.",
                opencontentwindowbuttontext: "Tab/Fenster öffnen"
            }
        }
    }
}
