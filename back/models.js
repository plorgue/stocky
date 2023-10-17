const fs = require("fs");
const { Crypto } = require("./key.js");
const { authenticate, retrieveFile, saveFile } = require("./remote.js");
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
        password.updatedAt = new Date().toISOString();
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

    patchPassword(password, mainPassword) {
        const raw = fs.readFileSync(Vault.listPwdPath);
        let passwords = JSON.parse(raw);
        let index = passwords.list.findIndex((pwd) => {
            if (pwd.id === password.id) return true;
            return false;
        });
        const keepId = password.id;
        password.updatedAt = new Date().toISOString();
        const encryptedPassword = Crypto.encryptJSONValues(password, mainPassword);
        encryptedPassword.id = keepId;
        passwords.list.splice(index, 1, encryptedPassword);
        fs.writeFileSync(Vault.listPwdPath, JSON.stringify(passwords, null, 4));
    }

    async synchronizeWithRemote(passwordMetadata, mainPassword) {
        let localNewToBeSaved = false;
        let remoteNewToBeSaved = false;
        const oauth2Client = await authenticate();
        const remoteJson = JSON.parse(await retrieveFile(oauth2Client));
        const remotePasswordMetadata = [];
        remoteJson["list"].forEach((pwdC) => {
            let pwd = Crypto.decryptJSONValuesWithKeys(pwdC, mainPassword, Vault.tableColumns);
            pwd.id = pwdC.id;
            remotePasswordMetadata.push(pwd);
        });
        const [remoteIdUpdated, remoteIdValue] = remotePasswordMetadata.list.reduce(
            (acc, pwd) => {
                acc[0][pwd.id] = pwd.updatedAt;
                acc[1][pwd.id] = pwd;
                return acc;
            },
            [{}, {}],
        );

        let localIds = [];
        passwordMetadata = passwordMetadata.map((pwd) => {
            localIds.push(pwd.id);
            if (Object.keys(remoteIdUpdated).includes(pwd.id)) {
                if (new Date(pwd.updatedAt) > new Date(remoteIdUpdated[pwd.id])) {
                    remoteNewToBeSaved = true || newFromLocal.length > 0;
                    return pwd;
                } else if (pwd.updatedAt < remoteIdUpdated[pwd.id]) {
                    localNewToBeSaved = true || newFromRemote.length > 0;
                    return remoteIdValue[pwd.id];
                } else {
                    return pwd;
                }
            }
        });

        const newFromRemote = remotePasswordMetadata.filter((pwd) => !localIds.includes(pwd.id));
        localNewToBeSaved = true || newFromRemote.length > 0;

        const newFromLocal = passwordMetadata.filter((pwd) => !Object.keys(remoteIdUpdated).includes(pwd.id));
        remoteNewToBeSaved = true || newFromLocal.length > 0;

        if (remoteNewToBeSaved) {
            // TODO: encrypt id/updated_at
            await saveFile(oauth2Client, JSON.stringify({ list: passwordMetadata }, null, 4));
        }
        if (localNewToBeSaved) {
            // TODO: encrypt id/updated_at
            fs.writeFileSync(Vault.listPwdPath, JSON.stringify({ list: passwordMetadata }, null, 4));
        }
        return passwordMetadata.concat(newFromRemote);
    }
}

module.exports = { Vault };
