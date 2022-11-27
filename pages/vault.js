import StInput from "../components/st-input.js";
import StPasswordEdition from "../components/st-password-edition.js";

customElements.define("st-password-edition", StPasswordEdition);
customElements.define("st-input", StInput);

const TABLE_COLUMNS = ["title", "link", "username", "description"];
const TABLE_COLUMNS_WIDTH = [20, 25, 30, 20];

let search = document.getElementById("vault-search");
let table = document.querySelector("#vault-left table tbody");
let passwordEditor = document.querySelector("st-password-edition");

//#region  tempo
let btn = document.getElementById("test-button");
class Password {
    constructor(id, title, link, username, password, description) {
        this.id = id;
        this.title = title;
        this.link = link;
        this.username = username;
        this.password = password;
        this.description = description;
    }
}
const demoPwd = new Password(
    null,
    "Google",
    "http://www.google.com/login",
    "paullorgue@gmail.com",
    null,
    "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora, temporibus?",
);
//#endregion

let passwords = [];
let currentTableLength = 0;

btn.addEventListener("click", () => {
    passwords.push(demoPwd);
    appendTableRow(demoPwd);
});

passwordEditor.addEventListener("newPassword", (e) => appendTableRow(e.detail));

function appendTableRow(pwd) {
    console.log(pwd);
    let row = document.createElement("tr");
    row.setAttribute("row", currentTableLength);
    currentTableLength += 1;

    TABLE_COLUMNS.forEach((colType, i) => {
        let col = document.createElement("td");
        col.classList.add(`w${TABLE_COLUMNS_WIDTH[i]}`);
        col.innerText = pwd[colType];
        row.appendChild(col);
        row.addEventListener("click", handleRowClick);
    });
    table.appendChild(row);
}

function handleRowClick(e) {
    console.log(e.target.parentNode.getAttribute("row"));
}

search.shadowRoot.querySelector("input").focus();
