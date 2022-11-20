import StInput from "../components/st-input.js";

customElements.define('st-input', StInput);

let search = document.getElementById("vault-search");

search.shadowRoot.querySelector("input").focus();