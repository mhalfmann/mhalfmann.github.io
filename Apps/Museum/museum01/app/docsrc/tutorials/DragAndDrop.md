## Zuordnung

Beinhaltet einen Satz Steckplätze und einen Satz Elemente. Die Elemente
müssen je einem Steckplatz zugeordnet werden. Dabei können Elemente übrig bleiben.

```HTML
<div class="iwmstudy_question_dndmatch" id="storeopt_test">
    <span>Vervollständige die Namen dieser bekannten Politiker, 
        indem du die Nachnamen zu den Vornamen ziehst.</span>
    <div class="slots" data-random>
        <div>Angela</div>
        <div>Horst</div>
        <div>Guido</div>
        <div>Donald</div>
        <div>Joschka</div>
    </div>
    <div class="repository" data-random>
        <div id="merkel">Merkel</div>
        <div id="seehofer">Seehofer</div>
        <div id="westerwelle">Westerwelle</div>
        <div id="duck">Duck</div>
        <div id="fischer">Fischer</div>
        <div id="trump">Trump</div>
    </div>
</div>

```
### Attribute

| Name | Beschreibung | Unterstützende Elemente |
| --- | --- | --- |
| data-debug | Aktiviert verschiedene Funktionalitäten zur Fehlerbehandlung* | Komponente |
| data-random | Sortiert die Kindelemente in einer zufälligen Reihenfolge. | SlotContainer, Repository | 


## Liste

Gleiches verhalten wie das Drag And Drop Match Element. Hier wird der Text als Labels vor den Steckplätzen plaziert und durch eine Tabellen-Anordnung ordentlich übereinander platziert.

```HTML
<div class="iwmstudy_question_dndtxt2txt" id="storeopt_test">
    <span>Vervollständige die Namen dieser bekannten Politiker, indem du die    hnamen zu den
        Vornamen
        ziehst.</span>
    <div class="slots" data-random>
        <div>Angela</div>
        <div>Horst</div>
        <div>Guido</div>
        <div>Donald</div>
        <div>Joschka</div>
    </div>
    <div class="repository" data-random>
        <div id="merkel">Merkel</div>
        <div id="seehofer">Seehofer</div>
        <div id="westerwelle">Westerwelle</div>
        <div id="duck">Duck</div>
        <div id="fischer">Fischer</div>
        <div id="trump">Trump</div>
    </div>
</div>

```
### Attribute

| Name | Beschreibung | Unterstützende Elemente |
| --- | --- | --- |
| data-debug | Aktiviert verschiedene Funktionalitäten zur Fehlerbehandlung* | Komponente |
| data-random | Sortiert die Kindelemente in einer zufälligen Reihenfolge. | SlotContainer, Repository | 



## Sortierung

Sonderfall der Drag And Drop List, inder die Elemente geordnet werden müssen:
**Achtung! Da dies keine eigenständige Klasse ist, können auch die Slots sortiert werden, falls _data-random_ angegeben wird.

```HTML
  <div class="iwmstudy_question_dndtxt2txt" id="storeopt_test">
     <span>Ordne die folgenden Farben nach deiner persönlichen Präferenz, wobei 1 dir am besten gefällt
         und 5 am
         wenigsten gut.</span>
     <div class="slots">
         <div>1</div>
         <div>2</div>
         <div>3</div>
         <div>4</div>
         <div>5</div>
     </div>
     <div class="repository" data-random>
         <div id="green">Grün</div>
         <div id="red">Rot</div>
         <div id="blue">Blau</div>
         <div id="yellow">Gelb</div>
         <div id="salmon">Lachsfarben</div>
     </div>
 </div>
 ```

 ### Attribute

Siehe Drag And Drop List.


## Bild als Hintergrund

Eine Bildbeschriftungsaufgabe, bei der die Steckplätze auf einem Bild verteilt werden und auf dieses direkt als Labels gesetzt werden können, z.B. Länder auf einer Karte Beschriften. 


```HTML
<div class="iwmstudy_question_dndlabeling" id="storeopt_test">
    <span>Beschrifte die Länder auf der Karte, indem du die Etiketten auf die Karte ziehst.</span>
    <img src="../content/medien/europe/europa.jpg" alt="">
    <div class="slots">
        <div id="spain" data-x='0.23' data-y='0.71'></div>
        <div id="great-britain" data-x='0.27' data-y='0.16'></div>
        <div id="germany" data-x='0.47' data-y='0.28'></div>
        <div id="turkey" data-x='0.83' data-y='0.76'></div>
        <div id="russia" data-x='0.87' data-y='0.12'></div>
        <div id="italy" data-x='0.51' data-y='0.65'></div>
    </div>
    <div class="repository">
        <div id="spain">Spain</div>
        <div id="germany">Germany</div>
        <div id="turkey">Turkey</div>
        <div id="russia">Russia</div>
        <div id="italy">Italy</div>
        <div id="great-britain">Great Britain</div>
    </div>
</div>
 ```

### Attribute

| Name | Beschreibung | Unterstützende Elemente |
| --- | --- | --- |
| data-debug | Aktiviert verschiedene Funktionalitäten zur Fehlerbehandlung* | Komponente |
| data-random | Sortiert die Kindelemente in einer zufälligen Reihenfolge. | Repository | 
| data-edit | Ermöglicht es durch klicken die Bildkoordinaten als Attribute zu kopieren. | Komponente |
| data-x | Gibt die X-Position relativ zum Bild wieder, wobei 0.0 <= x <= 1.0| Slots |
| data-y | Gibt die Y-Position relativ zum Bild wieder, wobei 0.0 <= y <= 1.0| Slots |



 ## Lückentext (Cloze)

Sonderform des DragAndDropMatch. Ermöglicht es die Steckplätze in einen Text einzubinden 
und dadurch einen Lückentext zu erstellen.


```HTML
<div class="iwmstudy_question_dndcloze" id="store_test">
    <span>Füllen Sie den Lückentext mit den entsprechenden Labeln aus.</span>
    <div class="slots">
        <article>
            <!-- Hallo Word -->
            Jemand musste Josef K. <div></div> haben, denn ohne dass er etwas Böses getan hätte, wurde er
            eines Morgens verhaftet. »Wie ein <div></div>! « sagte er, es war, als sollte die Scham
            ihn überleben. Als Gregor <div></div> eines Morgens aus unruhigen Träumen erwachte, fand er sich in
            seinem Bett zu einem ungeheueren <div></div> verwandelt. Und es war ihnen wie eine Bestätigung ihrer
            neuen Träume und guten Absichten, als am Ziele ihrer Fahrt die Tochter als erste sich erhob und
            ihren jungen Körper dehnte.
        </article>
    </div>
</div>
```
 ### Attribute

Wie Drag And Drop Match, nur können Slots hier nicht zufällig angeordnet werden.

## Liste mit Bildern

In den Drag And Drop List können auch Bilder verwendet werden.
Sowohl als SlotLabel, als auch als Item.

### Bild als Item

Hierfür wird einfach in dem Item ein <img> untergeordnet.

```HTML
<div class="iwmstudy_question_dndtxt2img" id="storeopt_test" >
    <span>Ordne die Namen den entsprechenden Tieren zu:</span>
    <div class="slots">
        <div>Eichhörnchen</div>
    </div>
    <div class="repository">
        <div><img data-size="8vw" src="https://source.unsplash.com/Tk71SYS8UBY/256x256" alt="Squirrel"></div>
    </div>
</div>
```

### Bilder als Slot Labels

Bilder können auch als Labels für Slots genutzt werden. Hierfür
wird das Bild im Slot selbst angegeben. Hier können auch mehrere Bilder
angegeben werden.

```HTML
<div class="iwmstudy_question_dndimg2txt" id="storeopt_test" >
    <span>Ordne die Namen den entsprechenden Tieren zu:</span>
    <div class="slots" data-random>
        <div>
            <img src="https://source.unsplash.com/fs0fF3OWK1U/128x128" alt="gorilla">
            <img src="https://source.unsplash.com/7h4yibuV3Ms/128x128" alt="orang">
        </div>
    </div>
        <div class="repository" data-random>
            <div>Affe</div>
        </div>
    </div>
</div>
```

### Attribute

Die Attribute sind identisch mit der DragAndDropList, mit Ergänzung folgender Attribute:

| Name | Beschreibung | Unterstützende Elemente |
| --- | --- | --- |
| data-width | Gibt die Breite der Bilder an. (CSS-Valider Wert) | Komponente, Bild |
| data-height | Gibt die Höhe der Bilder an. (CSS-Valider Wert) | Komponente, Bild |
| data-size | Gibt die Breite und Höhe der Bilder an. (CSS-Valider Wert) | Komponente, Bild |


\* *__Faustregel__: Man sollte dies nur während der Entwicklung einschalten, falls etwas nicht funktioniert, oder wenn man eine Funktionalität davon unbedingt benötigt. Danach sollte es so bald als möglich wieder ausgeschalten werden.*

