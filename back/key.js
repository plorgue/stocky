let crypto = require("crypto-js");

class Crypto {
    static hash(str) {
        return crypto.enc.Base64.stringify(crypto.SHA256(str));
    }

    static compare(hash, str) {
        return Crypto.hash(str) === hash;
    }

    static encryptString(string, password) {
        let ciphertext = crypto.AES.encrypt(string, password).toString();
        return ciphertext;
    }

    static encryptJSONValues(content, password) {
        let encrypted = {};
        Object.entries(content).forEach(([key, value]) => {
            encrypted[key] = this.encryptString(value, password);
        });
        return encrypted;
    }

    static decryptString(crypted, password) {
        let originaltext = crypto.AES.decrypt(crypted, password).toString(crypto.enc.Utf8);
        return originaltext;
    }

    static decryptJSONValues(content, password) {
        let decrypted = {};
        Object.entries(content).forEach(([key, value]) => {
            decrypted[key] = this.decryptString(value, password);
        });
        return decrypted;
    }

    static decryptJSONValuesWithKeys(content, password, keys) {
        let decrypted = {};
        Object.entries(content).forEach(([key, value]) => {
            if (keys.includes(key)) {
                decrypted[key] = this.decryptString(value, password);
            }
        });
        return decrypted;
    }
}

class Encryptor {}

class Decryptor {}

module.exports = { Crypto, Encryptor, Decryptor };
