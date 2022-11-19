const { Hash } = require("crypto");
const fs = require("fs");
const { Hasher } = require("./key.js");

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

class Vault {
	static hashFilePath = "./hash";

	constructor() {
		this.passwords = [];
	}

	static existsMainPwd() {
		return fs.existsSync(Vault.hashFilePath);
	}

	setMainPassword(pwd) {
		const hash = Hasher.hash(pwd);
		fs.writeFileSync(Vault.hashFilePath, hash, {encoding: "base64"});
	}

	tryInputPassword(input_password) {
		if (Vault.existsMainPwd()) {
			const hash = fs.readFileSync(Vault.hashFilePath, { encoding: "base64" });
			return Hasher.compare(hash, input_password);
		} else {
			return false;
		}
	}

	getAllPasswordMetadata() {}

	getPassword(id) {}

	addPassword(password) {}

	removePassword(password) {}

	synchronize() {}
}

module.exports = { Vault, Password };
