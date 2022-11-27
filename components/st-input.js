export default class StInput extends HTMLElement {
    pressEvent = new CustomEvent("onPress");
    typingEvent = new CustomEvent("onTyping");

    static get observedAttributes() {
        return ["new-value"];
    }

    constructor() {
        super();

        this.shadow = this.attachShadow({ mode: "open" });

        this.newValue = this.getAttribute("new-value");
        this.hint = this.getAttribute("hint");
        this.label = this.getAttribute("label");
        // this.icon = this.getAttribute("icon");
        this.isBlue = this.hasAttribute("blue");
        this.isPassword = this.hasAttribute("is-password");
        this.isLarge = this.hasAttribute("large");

        this.type = this.isPassword ? "password" : "text";

        const labelHTML = `<p id="input_label" class="regular">${this.label}</p>`;
        const hintHTML = `<span id="input_hint">${this.hint}</span>`;
        // const iconHTML = `<span id="input_icon"></span>`;

        // WARNING: path in innerHTML are ralative to the parent that import the component (here /pages only)
        this.shadow.innerHTML = `
<link rel="stylesheet" href="../style/input.css" />
<link rel="stylesheet" href="../style/base.css" />
${this.label !== null ? labelHTML : ""}
<div class="flex flex-row items-center">
	${this.hint !== null ? hintHTML : ""}
    <input id="input_main-pwd" type="${this.type}"/>
	${this.isPassword ? '<span id="input_hide-show-toggle" class="input_show-hide show"></span>' : ""}
</div>
      `;

        let input = this.shadow.querySelector("input");
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.dispatchEvent(this.pressEvent);
            }
        });
        input.addEventListener("input", (e) => {
            this.dispatchEvent(this.typingEvent);
            this.handlerValueChange(input.value);
            e.preventDefault();
        });
        // input.addEventListener('')
        if (this.isLarge) input.classList.add("large");
        if (this.isBlue) input.classList.add("blue");

        if (this.isPassword) {
            this.shadow.getElementById("input_hide-show-toggle").addEventListener("click", this.onClickHideShowToggle);
        }

        if (this.hint !== null) {
            this.shadow.getElementById("input_hint").addEventListener("click", () => {
                input.focus();
            });
        }
    }

    onClickHideShowToggle = (e) => {
        if (this.type === "password") {
            this.type = "text";
            e.target.classList.replace("show", "hide");
            this.shadow.getElementById("input_main-pwd").type = "text";
        } else {
            this.type = "password";
            e.target.classList.replace("hide", "show");
            this.shadow.getElementById("input_main-pwd").type = "password";
        }
    };
    handlerValueChange = (value) => {
        if (value.length) {
            this.shadow.getElementById("input_hint").innerText = "";
        } else {
            this.shadow.getElementById("input_hint").innerText = this.hint;
        }
    };

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "new-value":
                this.shadow.querySelector("input").value = newValue;
                this.handlerValueChange(newValue);
                break;
        }
    }
}
