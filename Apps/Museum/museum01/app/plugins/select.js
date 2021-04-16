class SelectComponent extends StudyComponent {
    constructor(element) {
        super(element)
        if (!this.element.id) console.error("Select container needs an id!")
        this.id = this.element.id        
    }    
    
    static get className() {
        return "iwmstudy_component_select"
    }

    getAllSelectables() {
        return this.element.querySelectorAll("." + this.itemClassName)
    }

    get itemClassName() {
        return "select_item"
    }

    validate() {
        let items = this.getAllSelectables()
        for (let item of items) {
            if (!item.querySelector("input:checked")) {
                return false
            }
        }

        return true
    }

    actionFromEvent(event) {
        const target = event.target.closest(".select_item")

        return {
            id: target.id,
            value: event.target.id,
            timestamp: Date.now(),
        }
    }

    get data() {
        const data = {}
        let selectables = this.getAllSelectables()
        selectables.forEach((selectable) => {
            let id = selectable.getAttribute("id")
            if(this.id.split("_")[0].startsWith("store")){
                let compkey = this.id.split("_")
                compkey.shift()
                compkey = compkey.join("_")
                let selectkey = id.split("_")
                selectkey.pop()
                selectkey = selectkey.join("_")
                if(compkey == selectkey){
                    id = selectable.getAttribute("id").split("_").pop()
                }
            }
            const checked = selectable.querySelector("input:checked")
            let value = document.getElementById(checked.id + "_label").innerText
            data[id] = checked != null ? value : null
        })

        return data
    }
}

class SelectCloze extends SelectComponent {
    static get className() {
        return "iwmstudy_question_selectcloze"
    }

    setup() {
        let inputs = this.element.querySelectorAll("input")
        console.log("SETUP", inputs)

        inputs.forEach((input) => {
            input.addEventListener("input", this.changed.bind(this))
        })
    }

    restructure() {
        let templateElements = this.element.querySelectorAll("article > div")
        let exercise_name = this.element.getAttribute("id")
        exercise_name = exercise_name.replace(/^(storeopt_)|^(store_)/, "")

        templateElements.forEach((template, index) => {
            const content = template.textContent
            template.innerText = ""
            template.className = "select_item"
            let answers = content.split("|")

            const selectId = template.hasAttribute("id") ? template.getAttribute("id") : [exercise_name, index + 1].join("_")
            template.setAttribute("id", selectId)

            answers.forEach((answer) => {
                let radio = document.createElement("input")
                radio.setAttribute("type", "radio")
                radio.setAttribute("name", selectId)

                function trim(str) {
                    return str.trim().toLowerCase().replace(/ /g, "_")
                }

                exercise_name = trim(exercise_name)
                const id = trim(answer)
                radio.setAttribute("data-value", id)

                const radioId = [selectId, id].join("_")
                radio.setAttribute("id", radioId)
                template.appendChild(radio)

                let label = document.createElement("label")
                label.setAttribute("for", radioId)
                label.setAttribute("id", radioId + "_label")
                label.innerText = answer
                template.appendChild(label)
            })
        })
    }

    validateTemplate() {
        let valid = true
        if (!this.element.hasAttribute("id")) {
            valid = false
            this.elementError(this.element, "Id wurde am Element nicht gesetzt.")
        } else {
            const id = this.element.getAttribute("id")
            let result = document.querySelectorAll("#" + id)
            if (result.length > 1) {
                this.elementError(this.element, "Die id '" + id + "' ist nicht eindeutig!")
                valid = false
            }
        }

        const answers = this.element.querySelectorAll("div")

        answers.forEach((answer) => {
            let content = answer.textContent
            content.trim()
            if (content === "") {
                this.elementError(this.element, "Es wurde kein Inhalt angegeben.")
                valid = false
            } else {
                let answers = content.split("|")
                if (answers.length < 2) {
                    this.elementError(this.element, "Ein Feld benötigt mindestens zwei Optionen.")
                    valid = false
                }
            }
        })

        return valid
    }

    validateStructure() {
        let errors = []
        let containers = this.element.querySelectorAll(".select_item")

        containers.forEach((container) => {
            let labels = container.querySelectorAll("label")
            let inputs = container.querySelectorAll("input")

            if (labels.length != inputs.length) errors.push("Unterschiedliche Anzahl von Labels und Radio Buttons. Kontaktiere den Support!")
            labels.forEach((label) => {
                let forAttr = label.getAttribute("for")
                if (!forAttr) errors.push("Ein 'for' Attribut wurde nicht gesetzt. Kontaktiere den Support!")
                else {
                    let targets = document.querySelectorAll("#" + forAttr)
                    if (targets.length > 1) errors.push("Es gibt mehrere Elemente mit der selben Id '" + forAttr + "'.")
                    else if (targets.length == 0) errors.push("Es fehlt ein Input-Feld für ein Label (" + forAttr + "). Kontaktiere den Support.")
                }
            })
        })

        errors.forEach((error) => this.elementError(container, error))
        return errors.length === 0
    }
}

StudyComponent.initializePlugin(SelectCloze)
