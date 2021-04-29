Ein Plugin ist eine JavaScript Datei, die eine beliebige Anzahl an *StudyComponents* enthält.
Diese Klassen sollten inhaltlich eine bestimmte Funktionalität abdecken. Ein gutes Beispiel hierfür
ist das *Drag and Drop - Plugin*, dieses beinhaltet verschiedene Klassen um die Drag'N'Drop Funktionalität
für Text oder Bilder in verschiedenen Szenarien zu verwirklichen.

## Einfaches Plugin

Die Erstellung eines Plugins ist sehr einfach und verfolgt die in [StudyComponents](tutorial-StudyComponent.html) beschriebene Design Philosophie.

## Minimalbeispiel

```Javascript
    // simpleplugin.js

    class SimplePlugin extends StudyComponent {

        // Überführt das geschriebene 'template' in seine
        // finale Struktur. 
        //
        // Für Änderungen im DOM Tree.
        restructure(){ /* ... */}
        
        // Fügt nach der Umstrukturierung den einzelnen Komponenete 
        // Fuktionalität hinzu, z.B. werden hier EventListener initialisiert.
        //
        // Für Änderungen durch JavaScript.
        setup(){ /* ... */}

        // Überprüft ob die Komponente richtig ausgefüllt wurde.
        validate(){ /* ... */}

        //Ruft die Daten der Komponente ab.
        get data(){ /* ... */}

        // Jede Komponente benötigt einen eigenen Klassennamen.
        // Der schlussendliche Klassenname wird aus den
        // Elternklassen zusammengesetzt.
        // In diesem Fall: "iwmstudy_simple_component iwmstudy_component"
        get className(){ 
            return "iwmstudy_simple_component"
        }
    }

    // Initialisiert alle entsprechenden Elemente wärhend des Ladens der Seite.
    //
    // ACHTUNG: Kindklassen müssen immer vor Ihren Elternklassen erscheinen, sonst werden diese falsch initialisiert!
    StudyComponent.initializePlugin(SimplePlugin)
```