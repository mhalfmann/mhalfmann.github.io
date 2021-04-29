Die Versuchsumgebung basiert vornehmlich auf der Verwendung von Standard HTML-Elementen. Daher sind diese von den Browsern implementiert und sehr robust und wenig fehleranfällig. Doch ab einer gewissen Komplexität der Aufgabe reichen einfache HTML-Elemente nicht mehr aus und es bedarf komplexen HTML-Strukturen mit JavaScript Funktionalität. Dafür wurde die StudyComponent entwickelt: Eine Basisklasse für alle Eingabeelemente, die sich nicht mit einer einfachen HTML-Struktur abbilden lassen und/oder auf JavaScript angewiesen sind.


## Philosophie

Die Versuchsumgebung verfolgt bestimmte Paradigmen, diese waren Leitfäden bei der Entwicklung der *StudyComponent*. Für die weitere Entwicklung sollten diese Paradigmen im Hinterkopf behalten werden.
 
1. Einfache HTML Struktur
2. Modifikation über HTML Attribute
3. Verständlichkeit

### 1. Einfache HTML Struktur

Die HTML Struktur, die bei der entsprechenden Aufgabe erstellt wird, soll so einfach wie möglich gehalten werden.
Falls eine komplexe Struktur notwendig ist, übernimmt die *StudyComponent* die Umstrukturierung.

### 2. Modifikation über HTML Attribute

Wenn Modifikationen bereitgestellt werden sollen, können diese als Attribut an der StudyComponent oder an einzelne Elementen angegeben werden. Dadurch muss für einfache Änderungen der Code nicht modifiziert werden. **Es gilt die Devise: Lieber ein neues Attribut implementieren, als eine neue StudyComponent zu erstellen.**

### 3. Verständlichkeit

Durch die Einfachheit und die Verwendung von Attributen sollten StudyComponents einfach verständlich sein. Da es aber immer vorkommt, dass im Aufbau Fehler passieren, sollte der Anwender auf diese **möglichst deutlich und klar** hingewiesen werden. Sodass Fehler selbst korrigiert werden können. 