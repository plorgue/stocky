export default class StPasswordVisu extends HTMLElement {
    closeEvent = new CustomEvent("closeMe");
    modifyEvent = new CustomEvent("modifyMe");

    constructor(pwd) {
        super();
        this.shadow = this.attachShadow({ mode: "open" });

        this.initialStates = {
            username: "show",
            password: "hide",
            description: "hide",
        };

        const displayHTML = `
        <link rel="stylesheet" href="../style/base.css" />
        <link rel="stylesheet" href="../style/passwordVisu.css" />
        <link rel="stylesheet" href="../style/button.css" />
        <link rel="stylesheet" href="../style/checkbox.css"/>
        <link rel="stylesheet" href="../style/input.css"/>
        <div id="vault-visu" class="flex flex-col">
            <div class="flex flex-row justify-between">
                <p id="vault-visu_title" class="thin">${pwd.title}</p>
                <div id="vault-visu_close"></div>
            </div>
            ${pwd.link ? `<a class="medium" id="vault-visu_link" href="${pwd.link}">${pwd.link}</a>` : ""}
            ${
                pwd.username
                    ? `
            <div class="vault-visu_field">
                <div>
                    <p class="medium">Identifiant</p>
                    <div id="vault-visu-visibility_username" class="vault-visu_visibility ${
                        this.initialStates.username
                    }"></div>
                    <div id="vault-visu-clip_username" class="vault-visu_clip"></div>
                </div>
                <p id="vault-visu_username"> ${
                    this.initialStates.username === "show" ? pwd.username : "••••••••••••"
                } </p>
            </div>`
                    : ""
            }
            ${
                pwd.password
                    ? `
            <div class="vault-visu_field">
                <div>
                    <p class="medium">Mot de passe</p>
                    <div id="vault-visu-visibility_password" class="vault-visu_visibility ${
                        this.initialStates.password
                    }"></div>
                    <div id="vault-visu-clip_password" class="vault-visu_clip"></div>
                </div>
                <p id="vault-visu_password">${
                    this.initialStates.password === "show" ? pwd.password : "••••••••••••"
                } </p>
            </div>`
                    : ""
            }
            ${
                pwd.description
                    ? `
            <div class="vault-visu_field">
                <div>
                    <p class="medium">Commentaire</p>
                    <div id="vault-visu-visibility_description" class="vault-visu_visibility ${
                        this.initialStates.description
                    }"></div>
                    <div id="vault-visu-clip_description" class="vault-visu_clip"></div>
                </div>    
                <p id="vault-visu_description"> ${
                    this.initialStates.description === "show" ? pwd.description : "••••••••••••"
                } </p>
            </div>
            `
                    : ""
            }
            <button id="vault-visu_btn-valid" class="align-self-end">Modifier</button>
        </div>`;

        this.shadow.innerHTML = displayHTML;

        this.shadow.getElementById("vault-visu_close").addEventListener("click", () => {
            this.dispatchEvent(this.closeEvent);
        });

        const visibility_fields = ["username", "password", "description"];
        visibility_fields.forEach((field) => {
            if (pwd[field]) {
                this.shadow.getElementById(`vault-visu-visibility_${field}`).addEventListener("click", (e) => {
                    if (e.target.classList.contains("hide")) {
                        e.target.classList.replace("hide", "show");
                        this.shadow.getElementById(`vault-visu_${field}`).innerText = pwd[field];
                    } else {
                        e.target.classList.replace("show", "hide");
                        this.shadow.getElementById(`vault-visu_${field}`).innerText = "••••••••••••";
                    }
                });
            }
        });

        const clipable_fields = ["username", "password", "description"];
        clipable_fields.forEach((field) => {
            if (pwd[field]) {
                this.shadow.getElementById(`vault-visu-clip_${field}`).addEventListener("click", () => {
                    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
                        if (result.state == "granted" || result.state == "prompt") {
                            navigator.clipboard.writeText(pwd[field]);
                        }
                    });
                });
            }
        });

        this.shadow.getElementById("vault-visu_btn-valid").addEventListener("click", () => {
            this.dispatchEvent(this.modifyEvent);
        });
    }

    changePassword = (pwd) => {
        this.shadow.getElementById("vault-visu_title").innerText = pwd.title;
        this.shadow.getElementById("vault-visu_link").innerText = pwd.link;
        this.shadow.getElementById("vault-visu_link").setAttribute("href", pwd.link);
        this.shadow.getElementById("vault-visu_username").innerText = pwd.username;
        this.shadow.getElementById("vault-visu_password").innerText = pwd.password;
        this.shadow.getElementById("vault-visu_description").innerText = pwd.description;
    };
}
