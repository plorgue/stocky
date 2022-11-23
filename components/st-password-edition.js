export default class StPasswordEdition extends HTMLElement {
	newPasswordEvent = (args) => new CustomEvent("newPassword", {detail: args});
	constructor() {
		super();

		//#region
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
		//#endregion

		this.shadow = this.attachShadow({ mode: "open" });

		// "edition", "display", "new"
		this.state = this.getAttribute("state");
		if (this.state == null) {
			this.state = "new";
		}

		const newHTML = () => `
<link rel="stylesheet" href="../style/base.css" />
<link rel="stylesheet" href="../style/passwordEdition.css" />
<link rel="stylesheet" href="../style/button.css" />
<div id="vault-edit" class="h-full flex flex-col">
    <p id="vault-edit_title" class="thin">Nouveau mot de passe</p>
    <st-input label="Titre" hint="Google" class="block"></st-input>
    <st-input label="Lien" hint="google.com" class="block"></st-input>
    <st-input label="Identifiant" hint="moi@quelque.part" class="block"></st-input>
    <st-input label="Mot de passe" hint="chuut.." isPassword class="block"></st-input>
    <st-input label="Commentaire" hint="blabla" class="block"></st-input>
    <button id="vault-edit_btn-valid" class="align-self-end">Ajouter</button>
</div>`;

		if (this.state == "display") {
		} else {
			this.shadow.innerHTML = newHTML();
			if (this.state == "edition") {
			}
		}

		this.shadow.getElementById("vault-edit_btn-valid").addEventListener("click", () => {
			switch (this.state) {
				case "new":
					const pwd = new Password(
						null,
						this.getInputValueFromLabel('Titre'),
						this.getInputValueFromLabel('Lien'),
						this.getInputValueFromLabel('Identifiant'),
						this.getInputValueFromLabel('Mot de passe'),
						this.getInputValueFromLabel('Commentaire')
					);
					this.dispatchEvent(this.newPasswordEvent(pwd));
			}
		});

	}
    getInputValueFromLabel = (label) => {
        return this.shadow.querySelector(`st-input[label='${label}']`).shadowRoot.querySelector("input").value
    }
}
