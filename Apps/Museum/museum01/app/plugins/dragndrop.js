/**
 * Basisklasse für alle Drag and Drop Komponenten.
 *
 * @class DragAndDropComponent
 * @extends {StudyComponent}
 */
class DragAndDropComponent extends StudyComponent {
    /**
     * Transforms an element to a drag and drop element.
     *
     * .repository - holds all available items
     * .slots - contains all possible slots
     *
     *
     * @param {*} element
     * @param {*} param1
     */
    constructor(element) {
        super(element, arguments[1])
        if (!this.element.id) console.error("Drag and Drop container needs an id!")
        this.id = this.element.id
        this.draggCounter = 0

        this.itemStartDrag = this.itemStartDrag.bind(this)
        this.itemReleased = this.itemReleased.bind(this)
        this.itemDragged = this.itemDragged.bind(this)

        //  Map that keeps track of all slots an item is over.
        // Key is the item and value the slot.
        this.hoveredSlots = new Map()
        this.dropzones = new Map()
        this.dragData = new Map()
    }

    static get className() {
        return "iwmstudy_component_dragndrop"
    }

    setup() {
        this.enableDropZones()
        this.enableDragables()
    }

    /**
     * Get's all items that contain the 'dropzone' class and wraps them with the
     * DropZone javascript class.
     *
     * A repository is a special kind of dropzone, that has no limit!
     */
    enableDropZones() {
        this.repository = this.element.querySelector(".repository")
        let dz = new DropZone(this.repository, { limit: -1 })
        this.dropzones.set(this.repository, dz)

        let dropables = this.element.querySelectorAll(".dropzone:not(.repository)")

        dropables.forEach((dropable) => {
            dz = new DropZone(dropable)
            this.dropzones.set(dropable, dz)
        })
    }

    /**
     * Wraps all draggable items in a DragItem class.
     */
    enableDragables() {
        let dragables = this.element.querySelectorAll(DragAndDropComponent.itemSelector)
        dragables.forEach((draggableElement) => {
            new DragItem(draggableElement, {
                start: this.itemStartDrag,
                end: this.itemReleased,
                move: this.itemDragged
            })
        })
    }

    /**
     * Called when an item was clicked and is about to be dragged.
     */
    itemStartDrag(item, event) {
        console.log(item)
        item.element.classList.add("dragged")
        this.logAction("drag-start", item.getData(event))
    }

    /**
     * Called when a dragitem is released.
     *
     * @param {DragItem} draggable
     */
    itemReleased(item, event) {
        if (item.target) {
            //Test if target is from this element.
            if (item.target && this.dropzones.has(item.target)) {
                let dz = this.dropzones.get(item.target)
                //If target is current parent do nothing!
                if (item.target !== item.element.parentNode) {
                    dz.drop(item)
                }
            }
        } else {
            //Dont reset, if the parent node is the origin.
            if (item.element.parentNode !== item.origin) item.reset()
        }
        item.element.classList.remove("dragged")

        this.hoveredSlots.delete(item)
        this.updateDropableState()

        this.changed()
        this.logAction("item-dropped", this.processItemData(item, event))
    }

    /**
     *
     */
    processItemData(item, event) {
        const deltaTimeInS = (item.data.endtime - item.data.starttime) / 1000
        const distance = item.data.distance
        const speed = distance / deltaTimeInS

        const itemData = item.getData(event)

        const endItemPosition = Element.getPosition(item.element)
        const startElement = item.container ? item.container.id : null

        const data = {
            id: itemData.id,
            speed,
            distance,
            startItemPosition: item.startItemPosition,
            endItemPosition,
            startPointerPosition: item.startPosition,
            endPointerPosition: itemData.position,
            startElement,
            endElement: item.element.parentNode.getAttribute("id"),
            eventType: itemData.eventType
        }

        /*
                Debug.clear()
                Debug.drawPositionLabel(data.startPointerPosition, "Start Pointer Position")
                Debug.drawPositionLabel(data.endPointerPosition, "End Pointer Position")
        
                Debug.drawPositionLabel(data.startItemPosition, "Start Item Position", { backgroundColor: "blue" }, {textAlign: "left", top: "-10px"})
                Debug.drawPositionLabel(data.endItemPosition, "End Item Position", { backgroundColor: "blue" }, {textAlign: "left", top: "-10px"})
        */

        return data
    }

    /**
     * Called when a dragitem is dragged.
     *
     * @param {DragItem} item
     * @param {*} event
     */
    itemDragged(item, event) {
        let hoveredElement = document.elementFromPoint(item.position.x, item.position.y)
        item.disableTarget()

        /**
         * Es muss auf ein hovered event getestet werde, da bei touch der
         * pointer außerhalb des fensters sein kann. Das *touchend* event wird aber auch dort
         * korrekt gefeuert.
         */
        let dropArea = null
        if (hoveredElement != null) {
            let potentialDropArea = hoveredElement.closest(this.constructor.slotSelector)

            if (potentialDropArea && this.element.contains(potentialDropArea)) {
                dropArea = potentialDropArea
                item.target = potentialDropArea
            }
        }

        this.hoveredSlots.set(item, dropArea)
        this.updateDropableState()

        //TODO: Improve tracked values!ALSO ADD DROP
    }

    /**
     * Helper function to update the dropable state of an hovered slot.
     *
     * @private
     */
    updateDropableState() {
        this.element.querySelectorAll(".dropable").forEach((hovered) => hovered.classList.remove("dropable"))

        for (let [key, value] of this.hoveredSlots) {
            if (value) {
                value.classList.add("dropable")
            }
        }
    }

    static get itemSelector() {
        return ".item"
    }

    static get repositorySelector() {
        return ".repository"
    }

    static get slotContainerSelector() {
        return ".slots"
    }

    static get slotSelector() {
        return ".slot"
    }
}

/**
 *
 * Das Match-Element erlaubt es eine Zuordnungsaufgabe mit Drag and Drop zu realisieren. Sie besteht aus einem
 *      Repository und einem Steckplatz-Container.
 *      Zu Beginn befinden sich im Repository alle verschiebbaren Elemente I<sub>n</sub>. Im Steckplatz-Container sind
 *      alle dazugehörigen Steckplätze S<sub>m</sub> zu finden.
 *
 * @example
 * <div class="iwmstudy_question_dndmatch" id="storeopt_test" data-debug>
 *     <span>Bitte vervollständige die Namen dieser bekannten Politiker, indem du die Nachnamen zu den
 *         Vornamen
 *         ziehst.</span>
 *     <div class="slots" data-random>
 *         <div>Angela</div>
 *         <div>Horst</div>
 *         <div>Guido</div>
 *         <div>Donald</div>
 *         <div>Joschka</div>
 *     </div>
 *     <div class="repository" data-random>
 *         <div id="merkel">Merkel</div>
 *         <div id="seehofer">Seehofer</div>
 *         <div id="westerwelle">Westerwelle</div>
 *         <div id="duck">Duck</div>
 *         <div id="fischer">Fischer</div>
 *         <div id="trump">Trump</div>
 *     </div>
 * </div>
 *
 * @class DragAndDropMatch
 * @extends {DragAndDropComponent}
 */
class DragAndDropMatch extends DragAndDropComponent {
    constructor(element) {
        super(element)
    }

    validate() {
        let valid = true
        let slots = this.slots.querySelectorAll(DragAndDropComponent.slotSelector)
        for (let slot of slots) {
            let items = slot.querySelectorAll(DragAndDropComponent.itemSelector)
            if (items.length == 0) {
                valid = false
                break
            }
        }

        return valid
    }

    validateTemplate() {
        if (this.validateSlotsTemplate()) {
            return this.validateRepositoryTemplate()
        } else return false
    }

    restructure() {
        this.slots = this.getRequiredDomElement(DragAndDropComponent.slotContainerSelector)
        this.repository = this.getRequiredDomElement(DragAndDropComponent.repositorySelector)

        this.createHeader()
        this.createExercise()
        this.restructureRepository()
        this.restructureSlots()
        this.applyRandom()
    }

    createHeader() {
        let children = Array.prototype.slice.call(this.element.children)

        // Ignore the slots and repository container.
        const exclude = ["slots", "repository"]
        children = children.filter((child) => {
            exclude.forEach((ex) => {
                if (child.classList.contains(ex)) {
                    return true
                }
            })
            return false
        })

        if (children.length > 0) {
            let header = document.createElement("header")
            children.forEach((child) => {
                header.appendChild(child)
            })
            this.element.appendChild(header)
        }
    }

    createExercise() {
        let exercise = document.createElement("div")
        exercise.className = "exercise dragndrop-exercise"
        exercise.appendChild(this.slots)
        exercise.appendChild(this.repository)
        this.element.appendChild(exercise)
    }

    static get className() {
        return "iwmstudy_question_dndmatch"
    }

    get data() {
        let data = {}
        console.log(this.slots)
        let slots = this.slots.querySelectorAll(".slot")
        slots.forEach((slot) => {
            const slotId = slot.getAttribute("id")
            const containedItem = slot.querySelector(".item")
            const value = containedItem ? containedItem.id : ""

            if (data[slotId] !== undefined) this.logDomError("Id '" + slotId + "'was overwritten with: " + value + ".")
            data[slotId] = value
        })
        return data
    }

    createSlot(slot, id) {
        slot.setAttribute("id", id)
        slot.className = "slot dropzone"
        let text = slot.textContent
        slot.setAttribute("data-label", text)
        slot.innerText = ""

        this.applyItemSize(slot)
        this.createLabel(slot, text)

        return slot
    }

    createLabel(slot, text) {
        let label = document.createElement("span")
        label.className = "label"
        label.innerText = text
        slot.appendChild(label)
    }

    restructureSlots() {
        let slots = []
        let slotElements = this.slots.children
        for (let i = slotElements.length - 1; i >= 0; i--) {
            let slot = slotElements[i]
            let id = this.constructElementId(slot, i)
            if (this instanceof DragAndDropImages2Image) {
                slot.innerHTML = ""
            }
            slot = this.createSlot(slot, id)
            slots.push(slot)
        }
    }

    restructureRepository() {
        this.repository.classList.add("dropzone")
        let repositoryitems = this.element.querySelectorAll(".repository > *")

        repositoryitems.forEach((sortingitem, i) => {
            sortingitem.className = DragAndDropComponent.itemSelector.replace(".", "") + " drag-n-drop-item"
            const id = this.constructElementId(sortingitem, i)
            sortingitem.setAttribute("id", id)
            this.applyItemSize(sortingitem)
        })
    }

    /**
     * Wendet das [data-size] Attribut auf ein Element an.
     * @private
     * @param {DomElement} element - Slot oder DragItem auf das die Größe angewendet werden soll.
     */
    applyItemSize(element) {
        let that = this
        function applyAttr(element, attrs) {
            let vars = null
            attrs.forEach((attr) => {
                if (that.element.hasAttribute(attr)) {
                    vars = that.element.getAttribute(attr)
                }

                if (element.parentNode && element.parentNode.hasAttribute(attr)) {
                    vars = element.parentNode.getAttribute(attr)
                }

                if (element.hasAttribute(attr)) {
                    vars = element.getAttribute(attr)
                }
            })
            return vars
        }

        const widthAttrs = ["data-size", "data-width"]
        const width = applyAttr(element, widthAttrs)

        const heightAttrs = ["data-size", "data-height"]
        const height = applyAttr(element, heightAttrs)

        const css = {}

        function fixMissingUnit(value) {
            return isNaN(value) ? value : value + "px"
        }

        if (width != null) css.width = fixMissingUnit(width)
        if (height != null) css.height = fixMissingUnit(height)

        Object.assign(element.style, css)
    }

    /**
     * Überprüft ob [data-random] Attribute gesetzt sind und wendet diese ggf. an.
     *
     * @protected
     */
    applyRandom() {
        if (this.repository.hasAttribute("data-random")) this.shuffleRepository()
        if (this.slots.hasAttribute("data-random")) this.shuffleSlots()
    }

    shuffleRepository() {
        this.shuffle(this.repository)
    }

    shuffleSlots() {
        this.shuffle(this.slots)
    }

    validateSlotsTemplate() {
        let slotContainer = this.element.querySelector(DragAndDropComponent.slotContainerSelector)
        if (!slotContainer) {
            this.logDomError("Es muss mindestens einen 'SlotContainer' existieren. D.h. ein Element mit der Klasse " + DragAndDropComponent.slotContainer.substring(1) + ".")
            return false
        }

        let slots = slotContainer.querySelectorAll("div")
        if (slots.length == 0) {
            this.logDomError("Es muss sich mindestens ein <div> Element im Slots Container befinden!")
            return false
        }

        return true
    }

    validateRepositoryTemplate() {
        const repository = this.element.querySelector(DragAndDropComponent.repositorySelector)
        const itemsInsideRepository = repository.querySelectorAll("div")
        const slotContainer = this.element.querySelector(DragAndDropComponent.slotContainerSelector)
        const slots = slotContainer.querySelectorAll("div")

        if (!repository) {
            this.logDomError("Es muss mindestens ein Repository existieren! D.h. ein Element mit dem Klassennamen " + DragAndDropComponent.slotContainerSelector.substring(1) + ".")
            return false
        }

        if (itemsInsideRepository.length == 0) {
            this.logDomError("Repository darf nicht leer sein!")
            return false
        }
        if (itemsInsideRepository.length < slots.length) {
            this.logDomError("Es muss gleich viele oder mehr Elemente als Slots geben!")
            return false
        }

        return true
    }
}

/**
 * Erzeugt für das Drag and Drop eine Liste.
 *
 * @example
 * <div class="iwmstudy_question_dndlist" id="storeopt_test">
 *     <span>Bitte vervollständige die Namen dieser bekannten Politiker, indem du die Nachnamen zu den
 *         Vornamen
 *         ziehst.</span>
 *     <div class="slots" data-random>
 *         <div>Angela</div>
 *         <div>Horst</div>
 *         <div>Guido</div>
 *         <div>Donald</div>
 *         <div>Joschka</div>
 *     </div>
 *     <div class="repository" data-random>
 *         <div id="merkel">Merkel</div>
 *         <div id="seehofer">Seehofer</div>
 *         <div id="westerwelle">Westerwelle</div>
 *         <div id="duck">Duck</div>
 *         <div id="fischer">Fischer</div>
 *         <div id="trump">Trump</div>
 *     </div>
 * </div>
 *
 * @class DragAndDropList
 * @extends {DragAndDropMatch}
 */
class DragAndDropList extends DragAndDropMatch {
    static get className() {
        return "iwmstudy_question_dndlist"
    }

    restructureSlots() {
        /**
         * Speichert alle Kindelemente um Sie später zu übertragen.
         */

        let childElements = []
        let slotContainer = this.element.querySelector(".slots")

        for (let child of slotContainer.children) {
            const slotElements = []
            for (let i = child.children.length - 1; i >= 0; i--) {
                const grandchild = child.children[i]
                child.removeChild(grandchild)
                slotElements.unshift(grandchild)
            }
            childElements.push(slotElements)
        }

        super.restructureSlots()

        let table = document.createElement("table")
        this.slots.appendChild(table)

        let slots = this.slots.querySelectorAll(".slot")

        slots.forEach((slot, index) => {
            let row = table.insertRow(-1)

            let cell = row.insertCell()

            //Kopiere alle Kindelemente, falls diese existieren.
            for (let child of childElements[index]) {
                if (child.tagName === "IMG") {
                    this.applyItemSize(child)
                }
                cell.appendChild(child)
            }

            if (slot.hasAttribute("data-label")) {
                let label = document.createElement("label")
                label.innerText = slot.getAttribute("data-label")
                cell.appendChild(label)
            }

            cell = row.insertCell()
            cell.appendChild(slot)
            slot.innerHTML = ""
        })

        this.slots.appendChild(table)

        if (this.slots.hasAttribute("data-random")) {
            let tbody = table.querySelector("tbody")
            this.shuffle(tbody)
        }
    }
}

/**
 * @class DragAndDropText2Text
 * @extends {DragAndDropList}
 */
class DragAndDropText2Text extends DragAndDropList {
    static get className() {
        return "iwmstudy_question_dndtxt2txt"
    }
}

/**
 * @class DragAndDropText2Image
 * @extends {DragAndDropList}
 */
class DragAndDropText2Image extends DragAndDropList {
    static get className() {
        return "iwmstudy_question_dndtxt2img"
    }
}

/**
 * @class DragAndDropImage2Image
 * @extends {DragAndDropList}
 */
class DragAndDropImage2Image extends DragAndDropList {
    static get className() {
        return "iwmstudy_question_dndimg2img"
    }
}

/**
 * @class DragAndDropImages2Image
 * @extends {DragAndDropList}
 */
class DragAndDropImages2Image extends DragAndDropList {
    static get className() {
        return "iwmstudy_question_dndimgs2img"
    }
}

/**
 * @class DragAndDropImage2Text
 * @extends {DragAndDropList}
 */
class DragAndDropImage2Text extends DragAndDropList {
    static get className() {
        return "iwmstudy_question_dndimg2txt"
    }
}

/**
 * Erstellt eine Aufgabe bei der Elemente Steckplätzen auf einem Bild zugeordnet werden müssen.
 *
 * @example
 *  <div class="iwmstudy_question_dndlabeling" id="storeopt_test">
 *      <span>Beschrifte die Länder auf der Karte, indem du die Etiketten auf die Karte ziehst.</span>
 *      <img src="../assets/europe/europa.jpg" alt="">
 *      <div class="slots">
 *          <div id="spain" data-x='0.23' data-y='0.71'></div>
 *          <div id="great-britain" data-x='0.27' data-y='0.16'></div>
 *      </div>
 *      <div class="repository" data-random>
 *          <div id="spain">Spain</div>
 *          <div id="germany">Germany</div>
 *          <div id="turkey">Turkey</div>
 *      </div>
 *  </div>
 *
 * @class DragAndDropLabeling
 * @extends {DragAndDropMatch}
 */
class DragAndDropLabeling extends DragAndDropMatch {
    restructure() {
        super.restructure()
        this.image = this.getRequiredDomElement("img")

        let imageWrapper = document.createElement("div")
        imageWrapper.className = "image-wrapper"

        let imageBoundaries = document.createElement("div")
        imageBoundaries.className = "image-boundaries"
        imageBoundaries.appendChild(this.image)
        imageBoundaries.appendChild(this.slots)

        imageWrapper.appendChild(imageBoundaries)

        let exercise = document.querySelector(".dragndrop-exercise")
        exercise.insertBefore(imageWrapper, exercise.childNodes[0])

        if (this.edit) {
            this.createEditorInput(imageBoundaries)
        }
    }

    /**
     * Die Slots können im Lückentext kein random aufweisen!
     */
    shuffleSlots() {
        console.warn(
            "Du versuchst bei einem " +
                this.constructor.name +
                " die Steckplätze (.slots) zufällig anzuordnen, das ist nicht erlaubt! Entferne das [data-random] Attribut um diese Warnung nicht mehr zu erhalten.",
            this.element
        )
    }

    /**
     * @inheritdoc
     * @returns {debug} - Array of all available html properties.
     */
    get htmlAttributes() {
        return [...super.htmlAttributes, "edit"]
    }

    static get className() {
        return "iwmstudy_question_dndlabeling"
    }

    /**
     * Erstellt ein Inputfeld und fügt an das Bildelement einen MouseHandler hinzu.
     * Hiermit kann der ersteller durch Klicken die Attribute für die Slots abspeichern
     * und an den Elementen einfügen.
     *
     * @private
     */
    createEditorInput(target) {
        let rect = target.getBoundingClientRect()
        let copyInput = document.createElement("input")

        this.element.appendChild(copyInput)

        function logPosition(event) {
            let position = {
                x: event.pageX,
                y: event.pageY
            }
            let delta = Points.subtract(position, rect)
            let dimensions = { x: rect.width, y: rect.height }
            delta = Points.divide(delta, dimensions)

            copyInput.value = " data-x='" + delta.x.toFixed(2) + "' data-y='" + delta.y.toFixed(2) + "' "
        }

        let paused = false
        target.addEventListener("click", (event) => {
            paused = true
            setTimeout(() => {
                paused = false
            }, 500)
            copyInput.select()
            document.execCommand("copy")
            event.stopPropagation()
        })

        target.addEventListener("mousemove", (event) => {
            if (!paused) requestAnimationFrame(logPosition.bind(this, event))
        })
    }

    /**
     * Überschreibt die geerbte *restructureSlots* Methode und ordnet
     * die einzelnen Elemente entsprechend ihren *data-x* und *data-y*
     * attributen an.
     */
    restructureSlots() {
        let slots = super.restructureSlots()

        for (let i = this.slots.children.length - 1; i >= 0; i--) {
            let slot = this.slots.children[i]

            let empty = this.createSlot(slot, slot.id)
            this.slots.appendChild(empty)

            let x = slot.getAttribute("data-x")
            let y = slot.getAttribute("data-y")

            let left = x * 100 + "%"
            let top = y * 100 + "%"

            Object.assign(empty.style, {
                position: "absolute",
                left,
                top,
                transform: "translate(-50%, -50%)"
            })
        }
    }
}

/**
 *  Erstellt einen Aufgabe mit Lückentext.
 *
 * @class DragAndDropCloze
 * @extends {DragAndDropMatch}
 *
 * @example <caption>Ein Lückentext kann im HTML wie folgt angelegt werden.</caption>
 * 
 *  <div class="iwmstudy_question_dndcloze" id="storeopt_exercise_name">
        <span>Füllen Sie den Lückentext mit den entsprechenden Labeln aus.</span>
 *       <div class="slots">
 *           <article>
 *           Das ist das <div></div> vom <div></div>
 *           </article>

 *           <article>
 *             Für mehrere Paragraphen müssen mehrere <article> tags angegeben werden.
 *           </article>
 *       </div>
 *       <div class="repository" data-random>
 *         <div>Nikolaus</div>
 *         <div>Haus</div>
 *         <div>Finte</div>
 *       </div>
 *   </div>
 */
class DragAndDropCloze extends DragAndDropMatch {
    static get className() {
        return "iwmstudy_question_dndcloze"
    }

    restructureSlots() {
        let slots = this.slots.querySelectorAll("div")
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i]
            slot.className = "slot dropzone"
            slot.setAttribute("data-label", "")
            slot.id = "slot" + (i + 1)
        }
    }

    /**
     * Keys sind entsprechend Slotposition durchnummeriert, Werte sind Itemtexte
     */
    get data() {
        let data = {}
        console.log(this.slots)
        let slots = this.slots.querySelectorAll(".slot")
        slots.forEach((slot) => {
            const slotId = slot.getAttribute("id")
            const containedItem = slot.querySelector(".item")
            const value = containedItem ? containedItem.innerText : ""

            if (data[slotId] !== undefined) this.logDomError("Id '" + slotId + "'was overwritten with: " + value + ".")
            data[slotId] = value
        })
        return data
    }

    /**
     * Die Slots können im Lückentext kein random aufweisen!
     */
    shuffleSlots() {
        console.warn(
            "Du versuchst bei einem  " +
                this.constructor.name +
                "  die Steckplätze (.slots) zufällig anzuordnen, das ist nicht erlaubt! Entferne das [data-random] Attribut um diese Warnung nicht mehr zu erhalten.",
            this.element
        )
    }
}

class DragAndDropUtils {
    /**
     * Return's the pointer events page position.
     * @param {MouseEvent|TouchEvent} event - Event of the start interaction.
     */
    static getPagePositionFromMouseEvent(event) {
        return { x: event.pageX, y: event.pageY }
    }
}

/**
 *
 */
class DropZone {
    /**
     * Dropzone class wrapps an .dropzone element to
     * better handle interactions.
     *
     *
     * @param {DomElement} element - DropZone element to be wrapped.
     * @param {object} options - Options object.
     * @param {number} options.limit - Determines how many children a dropzone might have. Default value is one. If set to -1 it may have an unlimited amount children.
     */
    constructor(element, { limit = 1 } = {}) {
        this.element = element
        this.element.dropzone = this
        this.limit = limit
    }

    /**
     * Call the drop method to place dragitem inside the dropzone.
     * If too many items are inside the drop zone, they will be placed in their respective origin.
     *
     * @param {DragItem} draggable - Item to be dropped.
     */
    drop(draggable) {
        this.set(draggable)

        if (this.limit != -1) {
            let items = this.element.querySelectorAll(".item")
            items = Array.prototype.slice.call(items)

            // There may be a rare case, that the limit may be
            // smaller than the elements, that have their origin
            // inside the slot.
            let i = 0
            let loop_limit = 2

            while (items.length > this.limit && i++ < loop_limit) {
                let first = items[0]
                first.parentNode.removeChild(first)
                first.script.reset()
            }
            if (i == loop_limit - 1) {
                console.error("Es darf nur so viele Kindelemente bei einer Origin geben, wie es ihr jeweiliges Limit erlaubt!")
            }
        }
    }

    /**
     * Set's an DragItem to be the child of the DropZone.
     *
     * @private
     * @param {DragItem} draggable
     */
    set(draggable) {
        this.element.appendChild(draggable.element)
        draggable.disableTarget()
        this.draggables = draggable
    }
}

/**
 * Erzeuge ein draggbares Element.
 *
 * @class DragItem
 */
class DragItem {
    /**
     * Class wrapper for drag items.
     *
     * @param {DomElement} element - Element to be wrapped.
     * @param {object} options - Options object.
     * @param {function} start - A callback function that is called, when the item is activated.
     * @param {function} move - A callback function that is called, when the item is moved.
     * @param {function} end - A callback function that is called, when the item is released.
     */
    constructor(element, { start = () => {}, move = () => {}, end = () => {} } = {}) {
        this.element = element
        this.element.script = this
        this.origin = element.parentNode

        this.start = start
        this.move = move
        this.end = end

        this.enable = this.enable.bind(this)
        this.changed = this.changed.bind(this)
        this.disable = this.disable.bind(this)

        this.dragged = false
        this.element.addEventListener("touchstart", this.enable, { passive: false })
        this.element.addEventListener("mousedown", this.enable, { passive: false })

        this.container = this.element.parentNode
        this.startPosition = null
        this.startItemPosition = null
        this.target = null
        this.touches = []

        this.data = { distance: 0, starttime: null, endtime: null }
    }

    /**
     * @typedef DnDEvent
     * @property {number} id - Id des gedraggten Elementes.
     * @property {number} timestamp - Zeitpunkt des Events.
     * @property {Point} position - Position des gedraggten Elementes.
     * @property {string} eventType - EventTyp. Entweder 'mouse' oder 'touch'.
     */

    /**
     * Erzeugt ein Datenobjekt aus einem Mouse oder Touch Event.
     *
     * @param {MouseEvent | TouchEvent} event
     * @returns {DnDEvent} 

     * @memberof DragItem
     */
    getData(event) {
        let position = this.getPagePositionFromEvent(event)
        let eventDevice = event instanceof MouseEvent ? "mouse" : event instanceof TouchEvent ? "touch" : "undefined"

        return {
            id: this.element.getAttribute("id"),
            timestamp: performance.now(),
            position,
            eventDevice,
            eventType: event.type,
            touches: event.touches
        }
    }

    get position() {
        return Element.getPosition(this.element)
    }

    /**
     * Setzt das Objekt zurück zu seinem ursprünglichen Elternelement.
     *
     * @example <caption>Ein Element das in einem Repository initialisiert wurde befindet sich in einem Slot. Wird es aus dem Slot entfernt und in keiner anderen Dropzone abgelegt, dann wird es seinem ursprünglichen Parent - dem Repository - hinzugefügt. </caption>
     *
     * @memberof DragItem
     */
    reset() {
        this.origin.appendChild(this.element)
    }

    enable(event) {
        event.preventDefault()

        if (event instanceof TouchEvent) {
            for (let touch of Object.values(event.changedTouches)) {
                this.touches.push(touch.identifier)
            }
        }

        if (!this.dragged) {
            this.element.addEventListener("touchmove", this.changed)
            this.element.addEventListener("touchend", this.disable)
            this.element.addEventListener("touchcancel", this.disable)

            document.body.addEventListener("mousemove", this.changed)
            document.body.addEventListener("mouseup", this.disable)
            document.body.addEventListener("mouseleave", this.disable)

            this.dragged = true

            //Sets and increases the static dragId value.
            this.dragId = this.constructor.dragId = this.constructor.dragId ? this.constructor.dragId + 1 : 0

            this.startPosition = this.getPagePositionFromEvent(event)

            this.element.classList.add("dragged")

            let rect = this.element.getBoundingClientRect()
            console.log(rect)

            Object.assign(this.element.style, {
                pointerEvents: "none",
                position: "absolute",
                left: rect.left + "px",
                top: rect.top + "px"
            })

            document.body.appendChild(this.element)

            this.startItemPosition = this.position
            this.data.starttime = performance.now()
            this.data.startElement = this.element.parentNode.getAttribute("id")

            this.start(this, event)
        }
    }

    getPagePositionFromEvent(event) {
        let position = { x: 0, y: 0 }

        if (event instanceof MouseEvent) {
            position.x = event.pageX
            position.y = event.pageY
        } else if (event instanceof TouchEvent) {
            if (this.touches.length > 0) {
                let positions = []

                for (let touch of Object.values(event.touches)) {
                    if (this.touches.indexOf(touch.identifier) != -1) positions.push({ x: touch.pageX, y: touch.pageY })
                }

                position = Points.meanByMany(...positions)
            } else {
                console.error("There are no touched registered. This should not happen!")
            }
        } else {
            console.error("Event type is not implemented yet.")
        }

        return position
    }

    changed(event) {
        event.preventDefault()
        let position = this.getPagePositionFromEvent(event)
        let delta = Points.subtract(position, this.startPosition)

        const translation = "translateX(" + Math.round(delta.x) + "px) translateY(" + Math.round(delta.y) + "px)"
        this.element.style.transform = translation

        this.data.distance = Points.length(delta)
        this.move(this, event)
    }

    disable(event) {
        event.preventDefault()

        // Takes an array and removes all the touches that have changed from it.
        function removeTouchesFromTouchArray(arr) {
            if (event instanceof TouchEvent) {
                for (let eventTouch of event.changedTouches) {
                    const changedId = eventTouch.identifier
                    let idx = arr.indexOf(changedId)
                    if (idx != -1) {
                        arr.splice(idx, 1)
                    }
                }
            }
        }

        /**
         * A copy is created to check if the touch list would be empty
         */
        let tmpTouches = this.touches.slice()
        removeTouchesFromTouchArray(tmpTouches)

        if (tmpTouches == 0) {
            this.element.removeEventListener("touchmove", this.changed)
            this.element.removeEventListener("touchend", this.disable)

            document.body.removeEventListener("mousemove", this.changed)
            document.body.removeEventListener("mouseup", this.disable)
            document.body.removeEventListener("mouseleave", this.disable)

            this.dragged = false
            this.element.classList.remove("dragged")

            Object.assign(this.element.style, {
                pointerEvents: "all",
                position: "static",
                transform: "none"
            })

            this.data.endtime = performance.now()

            this.end(this, event)

            this.container = this.element.parentNode
            this.startPosition = null
            this.startItemPosition = null
        }

        /**
         * Remove the touches late, so that all end events
         * still can access them.
         */
        removeTouchesFromTouchArray(this.touches)
    }

    disableTarget() {
        if (this.target != null) {
            this.target.classList.remove("dropable")
            this.target = null
        }
    }
}

/*
 * Shows all touch points with id tags.
 */
class TouchVisualizer {
    constructor() {
        console.warn("Visualizer was attached to the window. This is for debugging only!")
        this.start = this.start.bind(this)
        this.move = this.move.bind(this)
        this.end = this.end.bind(this)

        window.addEventListener("touchstart", this.start, { passive: false })
        window.addEventListener("touchmove", this.move, { passive: false })
        window.addEventListener("touchend", this.end, { passive: false })
        window.addEventListener("touchcancel", this.end, { passive: false })

        this.visualZ = 10000
        this.visuals = new Map()
    }

    createVisual() {
        let visual = document.createElement("div")
        visual.style =
            "pointer-events:none; user-select:none;position:absolute;min-width: 10px; min-height:10px; background-color:tomato;border:1px solid indianred;top:0;left:0; padding:10px;border-radius:3px;"
        visual.style.zIndex = this.visualZ++
        return visual
    }

    moveVisual(visual, touch) {
        visual.innerText = touch.identifier

        let position = { x: touch.pageX, y: touch.pageY }
        let offset = { x: -20, y: -50 }
        position = Points.add(position, offset)

        visual.style.transform = `translate( ${position.x}px, ${position.y}px )`
    }

    start(event) {
        event.preventDefault()
        for (let touch of Object.values(event.changedTouches)) {
            let touchVisual = this.createVisual(touch)

            this.visuals.set(touch.identifier, touchVisual)
            document.body.appendChild(touchVisual)
            this.moveVisual(touchVisual, touch)
        }
    }

    move(event) {
        event.preventDefault()
        for (let touch of Object.values(event.changedTouches)) {
            let visual = this.visuals.get(touch.identifier)
            this.moveVisual(visual, touch)
        }
    }

    end(event) {
        event.preventDefault()
        for (let touch of Object.values(event.changedTouches)) {
            let visual = this.visuals.get(touch.identifier)
            this.visuals.delete(touch.identifier)
            visual.parentNode.removeChild(visual)
        }
    }
}

StudyComponent.initializePlugin(
    DragAndDropLabeling,
    DragAndDropText2Image,
    DragAndDropText2Text,
    DragAndDropImage2Image,
    DragAndDropImage2Text,
    DragAndDropImages2Image,
    DragAndDropList,
    DragAndDropCloze,
    DragAndDropMatch
).then((components) => {
    if (components.some((comp) => comp.debug)) new TouchVisualizer()
})

/**
 * TODO: These are useful utility functions that may be used acroll all plugins.
 * They were inside the obsolte plugins.js but now they have no obvious place to be.
 * Consider implementing them into the studyaddon.
 */

class Element {
    static getPosition(element) {
        let rect = element.getBoundingClientRect()
        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        }
    }
}

/**
 * Statische Klasse die Punktoperationen zur Verfügung stellt. Ein Punkt ist ein beliebiges Objekt
 * mit den Eigenschaften {x,y}.
 *
 * Bemerkung: Diese Klasse wurde von der iwmlib kopiert.
 */
class Points {
    /**
     * Berechnet den Mittelpunkt von einer Menge *points* von Punkten.
     * @param  {...Point} points - Punkte von denen der Mittelpunkt berechnet werden soll.
     * @returns {Point} - Der Mittelpunkt der angegebenen Punkte.
     */
    static meanByMany(...points) {
        let sum = { x: 0, y: 0 }

        points.forEach((point) => {
            sum = Points.add(sum, point)
        })
        const mean = Points.divideScalar(sum, points.length)
        return mean
    }

    /**
     * Berechnet die Länge eines Vektors.
     *
     * @param {Point} a
     * @returns {number}
     */
    static length(a) {
        return Math.sqrt(a.x * a.x + a.y * a.y)
    }

    /**
     * Berechnet die normalisierte Vektorform p_n eines Vektors p.
     * @param {Point} p
     * @returns {Point}
     */
    static normalize(p) {
        let len = this.length(p)
        return this.multiplyScalar(p, 1 / len)
    }

    /**
     * Berechnet den Durchschnitt zweier Vektoren
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static mean(a, b) {
        return Points.meanByMany(a, b)
    }

    /**
     * Subtrahiert zwei Punkte und gibt den resultierenden Vektor zurück.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static subtract(a, b) {
        return { x: a.x - b.x, y: a.y - b.y }
    }

    /**
     * Multipliziert zwei Punkte.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static multiply(a, b) {
        return { x: a.x * b.x, y: a.y * b.y }
    }

    /**
     * Dividiert zwei Punkte.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static divide(a, b) {
        return { x: a.x / b.x, y: a.y / b.y }
    }

    /**
     * Dividiert einen Punkt a mit einem festen Wert b.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static divideScalar(a, b) {
        return { x: a.x / b, y: a.y / b }
    }

    /**
     * Multipliziert einen Punkt a mit einem festen Wert b.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static multiplyScalar(a, b) {
        return { x: a.x * b, y: a.y * b }
    }

    /**
     * Addiert zwei Punkte.
     * @param {Point} a
     * @param {Point} b
     * @returns {Point}
     */
    static add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y }
    }

    /**
     * Multipliziert beide Werte eines Punktes mit -1.
     * @param {Point} a
     * @returns {Point}
     */
    static negate(p) {
        return { x: -p.x, y: -p.y }
    }

    /**
     * Berechnet den Winkel zwischen zwei Vektoren.
     * @param {Point} a
     * @param {Point} b
     * @returns {number} Der resultierende Winkel zwischen den zwei Vektoren als Radiant.
     */
    static angle(a, b) {
        return Math.atan2(a.y - b.y, p1.x - b.x)
    }

    /**
     * Berechnet die Distanz zwischen zwei Punkten.
     * @param {Point} a
     * @param {Point} b
     * @returns {number} - Die Distanz zwischen zwei Punkten.
     */
    static distance(a, b) {
        let dx = a.x - b.x
        let dy = a.y - b.y
        return Math.sqrt(dx * dx + dy * dy)
    }
}
