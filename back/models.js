const fs = require("fs");
const { Crypto } = require("./key.js");
const { v4: uuidv4 } = require("uuid");

// class Password {
//     constructor(id, title, link, username, password, description) {
//         this.id = id;
//         this.title = title;
//         this.link = link;
//         this.username = username;
//         this.password = password;
//         this.description = description;
//     }

//     toJSON() {
//         return {
//             id: uuidv4(),
//             title: title,
//             link: link,
//             username: username,
//             password: password,
//             description: description,
//         };
//     }
// }

class Vault {
    static hashFilePath = "./hash";
    static listPwdPath = "./list.json";

    static tableColumns = ["title", "link", "username", "description"];

    constructor() {
        this.passwords = [];
        if (!fs.existsSync(Vault.listPwdPath)) {
            const defaultData = { list: [] };
            fs.writeFileSync(Vault.listPwdPath, JSON.stringify(defaultData));
        }
    }

    static existsMainPwd() {
        return fs.existsSync(Vault.hashFilePath);
    }

    setMainPassword(pwd) {
        const hash = Crypto.hash(pwd);
        fs.writeFileSync(Vault.hashFilePath, hash, { encoding: "base64" });
    }

    tryInputPassword(input_password) {
        if (Vault.existsMainPwd()) {
            const hash = fs.readFileSync(Vault.hashFilePath, { encoding: "base64" });
            return Crypto.compare(hash, input_password);
        } else {
            return false;
        }
    }

    getAllPasswordMetadata(mainPassword) {
        const pwdsPartial = [];
        const raw = fs.readFileSync(Vault.listPwdPath);
        let passwordsCiphers = JSON.parse(raw);
        passwordsCiphers["list"].forEach((pwdC) => {
            let pwd = Crypto.decryptJSONValuesWithKeys(pwdC, mainPassword, Vault.tableColumns);
            pwd.id = pwdC.id;
            pwdsPartial.push(pwd);
        });
        return pwdsPartial;
    }

    addPassword(password, mainPassword) {
        // TODO: assert mainpassword !== null
        let secret = Crypto.encryptJSONValues(password, mainPassword);
        secret.id = uuidv4();

        const raw = fs.readFileSync(Vault.listPwdPath);
        let passwords = JSON.parse(raw);
        passwords.list.push(secret);
        try {
            fs.writeFileSync(Vault.listPwdPath, JSON.stringify(passwords, null, 4));
        } catch {
            console.error(`Can't write in json file: ${Vault.listPwdPath}`);
        }
    } // eslint-disable-line

    deletePassword(id) {
        const raw = fs.readFileSync(Vault.listPwdPath);
        let passwords = JSON.parse(raw);
        passwords.list = passwords.list.filter((pwd) => pwd.id !== id);
        try {
            fs.writeFileSync(Vault.listPwdPath, JSON.stringify(passwords, null, 4));
        } catch {
            // TODO: handle catch
            console.error(`Can't write in json file: ${Vault.listPwdPath}`);
        }
    } // eslint-disable-line

    getPassword(id, mainPassword) {
        const raw = fs.readFileSync(Vault.listPwdPath);
        let passwords = JSON.parse(raw);
        let pwdC = passwords.list.find((pwd) => pwd.id === id);
        if (pwdC) {
            return Crypto.decryptJSONValues(pwdC, mainPassword);
        } else {
            //TODO: handle error
        }
    }

    synchronize() {}
}

module.exports = { Vault };
