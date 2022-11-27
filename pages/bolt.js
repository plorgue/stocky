import StInput from "../components/st-input.js";

customElements.define("st-input", StInput);

window.api.send("default_pwd");
let isDefaultPwd = false;

let input = document.getElementById("bolt-pwd");
let input_confirm = document.getElementById("bolt-confirm-pwd");
let button = document.getElementById("bolt-open-button");
let message = document.getElementById("bolt-message");
let subtitle = document.getElementById("bolt-subtitle");

function onButtonClick() {
    const inputPassword = input.shadowRoot.querySelector("input").value;
    console.log(inputPassword);
    if (!isDefaultPwd) {
        window.api.send("try_input_password", inputPassword);
    } else {
        window.api.send("save_new_main", inputPassword);
        window.api.send("default_pwd");
    }
}

function newPasswordOnTypingHandler() {
    const inputPwd = input.shadowRoot.querySelector("input").value;
    const inputConfPwd = input_confirm.shadowRoot.querySelector("input").value;

    if (inputConfPwd === inputPwd && inputPwd.length > 12) {
        button.removeAttribute("disabled", true);
        message.classList.replace("visible", "invisible");
    } else if (inputPwd.length && inputConfPwd.length) {
        button.setAttribute("disabled", true);
        message.classList.replace("invisible", "visible");
        const differentPwdMsg = "Vérifier que les mots de passe sont identiques.";
        const tooSmallPwdMsg = "Les mots de passe doivent avoir plus de 12 caractères.";
        message.innerText = inputPwd !== inputConfPwd ? differentPwdMsg : tooSmallPwdMsg;
    }
}

input.shadowRoot.querySelector("input").focus();
input.addEventListener("onPress", () => {
    button.click();
});
input_confirm.addEventListener("onPress", () => {
    button.click();
});
button.addEventListener("click", onButtonClick);

window.api.receive("wrong_input_password", function () {
    message.innerText = "Mot de passe incorrect";
    message.classList.replace("invisible", "visible");
});
window.api.receive("default_pwd", function (res) {
    isDefaultPwd = res;
    if (res) {
        subtitle.classList.replace("hidden", "block");
        input_confirm.classList.replace("hidden", "block");
        input_confirm.addEventListener("onTyping", newPasswordOnTypingHandler);
        input.addEventListener("onTyping", newPasswordOnTypingHandler);
        button.innerText = "Enregistrer";
    } else {
        input.shadowRoot.querySelector("input").value = "";
        input_confirm.shadowRoot.querySelector("input").value = "";
        input.addEventListener("onTyping", () => {
            message.classList.replace("visible", "invisible");
        });

        subtitle.classList.replace("block", "hidden");
        input_confirm.classList.replace("block", "hidden");

        message.innerText = "Mot de passe incorrect";

        button.removeAttribute("disabled");
        button.innerText = "Ouvrir";
    }
});
