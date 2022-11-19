let crypto = require("crypto-js");

class Hasher {
	static hash(str) {
		return crypto.enc.Base64.stringify(crypto.SHA256(str));
	}

	static compare(hash, str) {
		return Hasher.hash(str) === hash;
	}
}

class Encryptor {}

class Decryptor {}

module.exports = { Hasher, Encryptor, Decryptor };
