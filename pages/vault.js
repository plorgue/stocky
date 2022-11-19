import StInput from "../components/st-input.js";

customElements.define('st-input', StInput);

let button = document.getElementById("vault-test-button");

function onButtonClick() {
	window.api.send("open_vault_window", "zev");
}
button.addEventListener("click", onButtonClick);
