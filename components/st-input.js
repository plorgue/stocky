export default class StInput extends HTMLElement {

	pressEvent = new CustomEvent('onPress');
	typingEvent = new CustomEvent('onTyping');

	constructor() {
		super();

		this.shadow = this.attachShadow({ mode: "open" });

		// this.hint = this.getAttribute("hint");
		// this.label = this.getAttribute("label");
		this.isPassword = this.getAttribute("isPassword") !== null;
		this.isLarge = this.getAttribute("large") !== null;

		this.type = this.isPassword ? "password" : "text";

// WARNING: path in innerHTML are ralative to the parent that import the component (here /pages only)
		this.shadow.innerHTML = `
<link rel="stylesheet" href="../style/input.css" />
<link rel="stylesheet" href="../style/base.css" />
<div class="flex flex-row">
    <input id="input_main-pwd" type="${this.type}"/>
    <span id="input_hide-show-toggle" class="input_show-hide show"></span>
</div>
      `;

	  	let input = this.shadow.querySelector("input"); 
		input.addEventListener("keypress", (e) => {
			if(e.key === "Enter") {
				e.preventDefault()
				this.dispatchEvent(this.pressEvent);
			}
		})
		input.addEventListener('input', (e) => {
			e.preventDefault()
			this.dispatchEvent(this.typingEvent);
		})
		// input.addEventListener('')
		if (this.isLarge) input.classList.add("large");

		this.shadow.getElementById("input_hide-show-toggle").addEventListener("click", this.onClickHideShowToggle);
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
}
