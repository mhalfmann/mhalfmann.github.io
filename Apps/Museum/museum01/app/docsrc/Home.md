Die IWM Versuchsumgebung bietet Wissenschaftlern ein einfach konfigurierbares Tool mit vielen vorgefretigten Fragetypen. Komplexere Fragetypen, die in anderen Anwendungen nicht realisiert werden können, können hier unter Zusammenarbeit mit der Medienentwicklung implementiert werden. Dadurch entsteht ein bewährtes, ständig gepflegtes und weiterentwickeltes Softwaresystem, mit In-Haus Expertise und kurzen Kommunikationswegen.

# Grundlagen

Material wird im HTML-Format erstellt und weißt einige Pflichtelemente auf. Es wird im Ordner content abgelegt, ebenso zugehörige Bilder. Ein guter Ansatz für die Erstellung ist es, eine ähnliche bereits bestehende Datei zu kopieren und zu bearbeiten. Im Folgenden werden die Grundelemente gezeigt, die in jeder HTML-Datei vorkommen sollten. Sie dienen dazu, die Versuchsumgebung in die Seite zu integrieren und damit den Funktionsumfang der Versuchsumgebung (Logging, Ablaufsteuerung, Funktionsaufrufe etc.) verfügbar zu machen, sowie die für das konfigurierbare Layout vorgesehenen Elemente (iwmstudy_masterbox, iwmstudy_contentbox,..) bereitzustellen.

Um Benutzereingaben zu speichern, können verschiedene Eingabeelemente genutzt werden. Die Versuchsumgebung analysiert alle Elemente einer Seite und speichert die Eingaben beim Seitenwechsel, wenn das Element zu den unterstützten Typen gehört und als „id" einen Wert aufweist, der mit „store_" beginnt. Alle Elemente, die so ausgezeichnet sind, sind vom Probanden obligatorisch auszufüllen, damit zur nächsten Seite weitergeschaltet werden kann. Handelt es sich um ein optionales Eingabefeld, ist stattdessen der Wert „storeopt_" am Anfang der „id" anzugeben. Eine Besonderheit stellen Radiobuttons dar. Hier wird „store_" bzw. „storeopt_" nicht als „id" sondern als „name" verwendet. Anonymes Logging ist mit „storeanonym_" und „storeoptanonym_" möglich.

# Fragetypen

## Standard



<div class="grid">

<!-- C -->

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_checkbox.html">
  <img draggable="false" src="../../app/docsrc/img/checkbox.jpg">
  <span>Checkbox</span>
</a>

<!-- D -->

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dropdown.html">
  <img draggable="false" src="../../app/docsrc/img/dropdown.jpg">
  <span>Dropdown</span>
</a>


<!-- E -->
  <a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_einzelauswahl.html">
  <img draggable="false" src="../../app/docsrc/img/einzelauswahl.jpg">
  <span>Einzelauswahl</span>
</a>

<!-- F -->

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_freitext_einzeilig.html">
  <img draggable="false" src="../../app/docsrc/img/freitext-einzeilig.jpg">
  <span>Freitext (einzeilig)</span>
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_freitext_mehrzeilig.html">
  <img draggable="false" src="../../app/docsrc/img/freitext-mehrzeilig.jpg">
  <span>Freitext (mehrzeilig)</span>
</a>

<!-- M -->

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_mehrfachauswahl.html">
  <img draggable="false" src="../../app/docsrc/img/mehrfachauswahl.jpg">
  <span>Mehrfachauswahl</span>
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_multiskala.html">
  <img draggable="false" src="../../app/docsrc/img/multiskala.jpg">
  <span>Multiskala</span>
</a>

<!-- S -->


<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_skala.html">
  <img draggable="false" src="../../app/docsrc/img/skala.jpg">
  <span>Skala</span>
</a>



<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_slider.html">
  <img draggable="false" src="../../app/docsrc/img/slider.jpg">
  <span>Slider</span>
</a>


</div>



## Drag and Drop

<div class="grid">

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_match.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-match.jpg">
  <span>Zuordnen</span> 
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_match_sort.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-match-sort.jpg">
  <span>Sortieren</span> 
</a>


<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_image.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-image.jpg">
  <span>Bild</span> 
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_cloze.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-cloze.jpg">
  <span>Lückentext</span> 
</a>


</div>

## Drag and Drop mit Bildern

<div class="grid">
<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_image_list.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-image-list.jpg">
  <span>Zuordnung Bildliste</span> 
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_image_image_list.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-image-image-list.jpg">
  <span>Bild zu Bild Zuordnung</span> 
</a>

<a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_dnd_multimage_list.html">
  <img draggable="false" src="../../app/docsrc/img/dragndrop-multi-image-list.jpg">
  <span>Bilderreihenfolge</span> 
</a>
</div>


## Select

<div class="grid">
  <a class="preview" target="_blank" href="../../studies/demo01/content/material_fragen_select_cloze.html">
    <img draggable="false" src="../../app/docsrc/img/select-cloze.jpg">
    <span>Lückentext</span> 
  </a>
</div>