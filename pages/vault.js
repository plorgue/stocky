import StInput from "../components/st-input.js";
import StPasswordEdition from "../components/st-password-edition.js";
import StPasswordVisu from "../components/st-password-visu.js";

customElements.define("st-password-visu", StPasswordVisu);
customElements.define("st-password-edition", StPasswordEdition);
customElements.define("st-input", StInput);

const TABLE_COLUMNS = ["title", "link", "username", "description"];
const TABLE_COLUMNS_WIDTH = [20, 25, 25, 20, 7];

let search = document.getElementById("vault-search");
let table = document.querySelector("#vault-left table tbody");
// let passwordEditor = document.querySelector("st-password-edition");
let rightPanel = document.getElementById("vault-right");

let currentTableLength = -1;
let passwordMetadata = [];

function appendTableRow(pwd) {
    let row = document.createElement("tr");
    currentTableLength += 1;
    row.setAttribute("row", currentTableLength);

    TABLE_COLUMNS.forEach((colType, i) => {
        let col = document.createElement("td");
        col.classList.add(`w${TABLE_COLUMNS_WIDTH[i]}`);
        col.innerText = pwd[colType];
        row.appendChild(col);
        row.addEventListener("click", handleRowClick);
    });

    let delcol = document.createElement("td");
    delcol.classList.add(`w${TABLE_COLUMNS_WIDTH[4]}`, "text-center", "bin");
    delcol.addEventListener("click", handleDeleteClick);
    row.appendChild(delcol);
    table.appendChild(row);
}

function handleRowClick(e) {
    window.api.password("reveal", passwordMetadata[parseInt(e.target.parentNode.getAttribute("row"))].id);
}

function handleDeleteClick(e) {
    e.stopPropagation();
    window.api.password("delete", passwordMetadata[parseInt(e.target.parentNode.getAttribute("row"))].id);
}

search.shadowRoot.querySelector("input").focus();

window.api.receive("pwd_metadata", function (res) {
    let child = table.lastElementChild;
    while (child) {
        table.removeChild(child);
        child = table.lastElementChild;
    }
    currentTableLength = -1;
    res.forEach((pwd) => {
        appendTableRow(pwd);
    });
    passwordMetadata = res;
});

window.api.receive("password_revealed", function (res) {
    let visu = new StPasswordVisu(res);
    switch (rightPanel.firstElementChild.nodeName) {
        case "ST-PASSWORD-EDITION":
            rightPanel.replaceChild(visu, rightPanel.firstElementChild);
            visu.addEventListener("closeMe", () => {
                rightPanel.replaceChild(new StPasswordEdition(), rightPanel.firstElementChild);
            });
            break;
        case "ST-PASSWORD-VISU":
            rightPanel.firstElementChild.changePassword(res);
            break;
    }
});
