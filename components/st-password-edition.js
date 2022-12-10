export default class StPasswordEdition extends HTMLElement {
    newPasswordEvent = (args) => new CustomEvent("newPassword", { detail: args });

    previousLenPwd = 16;
    constructor() {
        super();

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
<link rel="stylesheet" href="../style/checkbox.css"/>
<link rel="stylesheet" href="../style/input.css"/>
<div id="vault-edit" class="flex flex-col">
    <p id="vault-edit_title" class="thin">Nouveau mot de passe</p>
    <st-input label="Titre" hint="Google" class="block" new-value="google"></st-input>
    <st-input label="Lien" hint="google.com" class="block" new-value="www.google"></st-input>
    <st-input label="Identifiant" hint="moi@quelque.part" class="block" new-value="macin@truc.com"></st-input>
    <st-input label="Mot de passe" hint="chuut.." is-password class="block"></st-input>
	<div id="generate-pwd-container" class="flex flex-row justify-evenly">	
		<div class="flex flex-col">
			<p>
				<input type="checkbox" id="cbox-min" checked>
				<label for="cbox-min"  aria-describedby="label">Minuscules</label>
			</p>
			<p>
				<input type="checkbox" id="cbox-maj" checked>
				<label for="cbox-maj"  aria-describedby="label">Majuscules</label>
			</p>
			<p>
				<input type="checkbox" id="cbox-num" checked>
				<label for="cbox-num"  aria-describedby="label">Chiffres</label>
			</p>
			<p>
				<input type="checkbox" id="cbox-spe" checked>
				<label for="cbox-spe"  aria-describedby="label">Caractères spéciaux</label>
			</p>
		</div>
		<div class="flex flex-col justify-between">
			<p>
				<label for="input-len"  aria-describedby="label">Longueur</label>
				<input id="input-len" type="number" maxlength="2" value="16">
			</p>
			<button id="generate-pwd-btn">Générer</button>
		</div>
	</div>
    <st-input label="Commentaire" hint="blabla" class="block"></st-input>
    <button id="vault-edit_btn-valid" class="align-self-end">Ajouter</button>
</div>`;

        if (this.state == "display") {
            // eslint-disable-line
        } else {
            this.shadow.innerHTML = newHTML();
            if (this.state == "edition") {
                // eslint-disable-line
            }
        }

        this.shadow.getElementById("vault-edit_btn-valid").addEventListener("click", () => {
            if (this.state == "new") {
                const pwd = {
                    title: this.getInputValueFromLabel("Titre"),
                    link: this.getInputValueFromLabel("Lien"),
                    username: this.getInputValueFromLabel("Identifiant"),
                    password: this.getInputValueFromLabel("Mot de passe"),
                    description: this.getInputValueFromLabel("Commentaire"),
                };
                this.dispatchEvent(this.newPasswordEvent(pwd));
                window.api.password("create", pwd);
            }
        });

        this.shadow.getElementById("generate-pwd-btn").addEventListener("click", () => {
            //   this.shadow.querySelector("st-input[label='Mot de passe']").shadowRoot.querySelector("input").value =
            this.shadow
                .querySelector("st-input[label='Mot de passe']")
                .setAttribute(
                    "new-value",
                    this.generatePassword(
                        this.shadow.getElementById("cbox-min").checked,
                        this.shadow.getElementById("cbox-maj").checked,
                        this.shadow.getElementById("cbox-num").checked,
                        this.shadow.getElementById("cbox-spe").checked,
                        this.shadow.getElementById("input-len").value,
                    ),
                );
        });

        this.shadow.getElementById("input-len").addEventListener("blur", (e) => {
            console.log("ehePfor");
            if (isNaN(parseInt(e.target.value))) {
                this.shadow.getElementById("input-len").value = this.previousLenPwd;
                return;
            }
            const len = parseInt(e.target.value);
            if (len < 8) {
                this.shadow.getElementById("input-len").value = 8;
                this.previousLenPwd = 8;
            } else if (len > 32) {
                this.shadow.getElementById("input-len").value = 32;
                this.previousLenPwd = 32;
            } else {
                this.previousLenPwd = parseInt(e.target.value);
            }
        });
    }
    getInputValueFromLabel = (label) => {
        return this.shadow.querySelector(`st-input[label='${label}']`).shadowRoot.querySelector("input").value;
    };

    generatePassword = (withMin, withMaj, withNumbers, withSpChar, lenght) => {
        const min = "azertyuiopqsdfghjklmwxcvbn";
        const maj = "AZERTYUIOPQSDFGHJKLMWXCVBN";
        const spe = "~!@#$%^&*_-+='|\\(){}[]:;\"'<>,.?/";
        const num = "12345678901234567890";

        let chars = "";
        if (withMin) chars += min + min;
        if (withMaj) chars += maj + maj;
        if (withNumbers) chars += num + num;
        if (withSpChar) chars += spe;
        if (chars.length == 0) return "";

        const allTypePresent = [false, false, false, false];
        const pwd = [];
        pwd.length = lenght;
        let validPwd = false;
        while (!validPwd) {
            for (let i = 0; i < lenght; i += 1) {
                let randomChar = chars[Math.floor(Math.random() * chars.length)];
                pwd[i] = randomChar;
                if (!allTypePresent[0] && min.includes(randomChar)) allTypePresent[0] = true;
                if (!allTypePresent[1] && maj.includes(randomChar)) allTypePresent[1] = true;
                if (!allTypePresent[2] && num.includes(randomChar)) allTypePresent[2] = true;
                if (!allTypePresent[3] && spe.includes(randomChar)) allTypePresent[3] = true;
            }
            validPwd =
                allTypePresent[0] + allTypePresent[1] + allTypePresent[2] + allTypePresent[3] ===
                withMin + withMaj + withNumbers + withSpChar;
        }
        return pwd.join("");
    };
}
