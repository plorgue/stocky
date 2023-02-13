import StInput from "../components/st-input.js";
import StPasswordEdition from "../components/st-password-edition.js";
import StPasswordVisu from "../components/st-password-visu.js";

customElements.define("st-password-visu", StPasswordVisu);
customElements.define("st-password-edition", StPasswordEdition);
customElements.define("st-input", StInput);

const TABLE_COLUMNS = ["title", "link", "username", "description"];
const TABLE_COLUMNS_WIDTH = [20, 30, 25, 25];

let search = document.getElementById("vault-search");
let table = document.querySelector("#vault-left table tbody");
// let passwordEditor = document.querySelector("st-password-edition");
let rightPanel = document.getElementById("vault-right");

let currentTableLength = -1;
let passwordMetadata = [];
let passwordMetadataFiltered = [];
let searchFilter = "";

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
    delcol.classList.add("text-center", "bin");
    delcol.addEventListener("click", handleDeleteClick);
    row.appendChild(delcol);
    table.appendChild(row);
}

function refreshTable() {
    let child = table.lastElementChild;
    while (child) {
        table.removeChild(child);
        child = table.lastElementChild;
    }
    currentTableLength = -1;
    passwordMetadataFiltered.forEach((pwd) => {
        appendTableRow(pwd);
    });

    fixTableHeaderColWidth();
}

function handleRowClick(e) {
    window.api.password("reveal", passwordMetadataFiltered[parseInt(e.target.parentNode.getAttribute("row"))].id);
}

function handleDeleteClick(e) {
    e.stopPropagation();
    window.api.password("delete", passwordMetadataFiltered[parseInt(e.target.parentNode.getAttribute("row"))].id);
}

function handleSearch(e) {
    e.stopPropagation();
    searchFilter = e.detail.input;
    filterPasswordList();
    refreshTable();
}

function filterPasswordList() {
    if (searchFilter.length > 0) {
        passwordMetadataFiltered = passwordMetadata.filter(
            (pwd) =>
                pwd.title.includes(searchFilter) ||
                pwd.link.includes(searchFilter) ||
                pwd.description.includes(searchFilter),
        );
    } else {
        passwordMetadataFiltered = passwordMetadata;
    }
}

search.shadowRoot.querySelector("input").focus();

search.addEventListener("onTyping", handleSearch);
search.addEventListener("onPress", () => {
    window.api.send("clip_password", passwordMetadataFiltered[0].id);
    document.querySelector("#vault-left > table > tbody > tr:nth-child(1)").classList.add("clip_animation");
    setTimeout(() => {
        document.querySelector("#vault-left > table > tbody > tr:nth-child(1)").classList.remove("clip_animation");
    }, 500);
});

// Adjust the width of thead cells when window resizes
window.addEventListener("resize", fixTableHeaderColWidth); // Trigger resize handler
function fixTableHeaderColWidth() {
    // Get the tbody columns width array
    let colWidth = Array.prototype.map.call(
        document.querySelector("#vault-left table tbody tr").children,
        (td) => `${td.clientWidth}px`,
    );

    // Set the width of thead columns
    Array.prototype.forEach.call(
        document.querySelector("#vault-left table thead tr").children,
        (th, i) => (th.width = colWidth[i]),
    );
}

window.api.receive("pwd_metadata", function (res) {
    passwordMetadata = res;
    filterPasswordList();
    refreshTable();
});

window.api.receive("password_revealed", function (res) {
    let visu = new StPasswordVisu(res);
    visu.addEventListener("closeMe", () => {
        rightPanel.replaceChild(new StPasswordEdition(null), rightPanel.firstElementChild);
    });
    switch (rightPanel.firstElementChild.nodeName) {
        case "ST-PASSWORD-EDITION":
            rightPanel.replaceChild(visu, rightPanel.firstElementChild);
            visu.addEventListener("modifyMe", () => {
                let edit = new StPasswordEdition(res);
                rightPanel.replaceChild(edit, rightPanel.firstElementChild);
                edit.addEventListener("closeMe", (args) => {
                    window.api.password("reveal", args.detail.id);
                });
                edit.addEventListener("cancel", () => {
                    window.api.password("reveal", res.id);
                });
            });
            break;
        case "ST-PASSWORD-VISU":
            rightPanel.firstElementChild.changePassword(res);
            break;
    }
});
