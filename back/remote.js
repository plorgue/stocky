const { google } = require("googleapis");
const fs = require("fs");
const http = require("http");
const url = require("url");
const open = require("open");
const destroyer = require("server-destroy");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = "gdrive/token.json"; // path to your OAuth2 token file
const FOLDER_NAME = "Stocky";
const FILE_NAME = "ckysto";

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function authenticate() {
    let oAuth2Client;
    if (fs.existsSync(TOKEN_PATH)) {
        // list file in directory
        let files = fs.readdirSync(".");
        console.log(files.length);
        files.forEach((file) => {
            console.log(file);
        });

        const credentials = JSON.parse(fs.readFileSync("./back/gdrive/credentials.json"));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    } else {
        oAuth2Client = await getAuthenticatedClient();
    }

    return oAuth2Client;

    // testFolderExists(oAuth2Client, FOLDER_NAME)
    // 	.then(([exists, folderId]) => {
    // 		if (exists) {
    // 			return folderId
    // 		} else {
    // 			return createFolder(oAuth2Client, FOLDER_NAME);
    // 		}
    // 	})
    // 	.then((folderId) => {
    // 		// return content of file
    // 		await testFileExists(oAuth2Client, FILE_NAME, folderId)

    // 		// return createOrUpdateFile(oAuth2Client, folderId, FILE_NAME, "Secret file");
    // 	})
    // 	.then(console.log)
    // 	.catch(console.error);
}

/**
 * Create a new OAuth2Client, and go through the OAuth2 content
 * workflow.  Return the full client to the callback.
 */
function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
        // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
        // which should be downloaded from the Google Developers Console.
        const credentials = JSON.parse(fs.readFileSync("./back/gdrive/credentials.json"));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        // const oAuth2Client = new OAuth2Client(
        // 	keys.web.client_id,
        // 	keys.web.client_secret,
        // 	keys.web.redirect_uris[0]
        // );

        // Generate the url that will be used for the consent dialog.
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });

        // Open an http server to accept the oauth callback. In this simple example, the
        // only request to our webserver is to /oauth2callback?code=<code>
        const server = http
            .createServer(async (req, res) => {
                try {
                    if (req.url.indexOf("/oauth2callback") > -1) {
                        // acquire the code from the querystring, and close the web server.
                        const qs = new url.URL(req.url, "http://localhost:3000").searchParams;
                        const code = qs.get("code");
                        console.log(`Code is ${code}`);
                        res.end("Authentication successful! Please return to the console.");
                        server.destroy();

                        // Now that we have the code, use that to acquire tokens.
                        const r = await oAuth2Client.getToken(code);
                        // Make sure to set the credentials on the OAuth2 client.
                        oAuth2Client.setCredentials(r.tokens);
                        console.info("Tokens acquired.");
                        resolve(oAuth2Client);
                        const content = fs.readFileSync("./back/gdrive/credentials.json");
                        const keys = JSON.parse(content);
                        const key = keys.installed || keys.web;
                        const payload = JSON.stringify({
                            type: "authorized_user",
                            client_id: key.client_id,
                            client_secret: key.client_secret,
                            ...oAuth2Client.credentials,
                        });
                        fs.writeFileSync(TOKEN_PATH, payload);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                open(authorizeUrl, { wait: false }).then((cp) => cp.unref());
            });
        destroyer(server);
    });
}

async function saveFile(auth, fileContent) {
    // const drive = google.drive({ version: "v3", auth });
    const [folderExists, folderId] = await testFolderExists(auth, FOLDER_NAME);
    if (folderExists) {
        console.log("Folder exists");
    } else {
        console.log("Folder does not exist");
        const folderId = await createFolder(auth, FOLDER_NAME);
        console.log(`Folder created with ID: ${folderId}`);
    }
    const fileId = await createOrUpdateFile(auth, folderId, FILE_NAME, fileContent);
    return await retrieveFileContent(auth, fileId);
}

async function retrieveFile(auth) {
    // const drive = google.drive({ version: "v3", auth });
    const [folderExists, folderId] = await testFolderExists(auth, FOLDER_NAME);
    if (folderExists) {
        console.log("Folder exists");
    } else {
        console.log("Folder does not exist");
        const folderId = await createFolder(auth, FOLDER_NAME);
        console.log(`Folder created with ID: ${folderId}`);
    }
    let [exists, fileId] = await testFileExists(auth, FILE_NAME, folderId);
    if (exists) {
        console.log("File exists");
    } else {
        console.log("File does not exist");
    }
    return await retrieveFileContent(auth, fileId);
}

/**
 * Creates a new folder in Google Drive and uploads a file to it.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} folderName The name of the folder to create.
 */
async function createFolder(auth, folderName) {
    const drive = google.drive({ version: "v3", auth });
    const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
    };
    return await drive.files
        .create({
            resource: folderMetadata,
            fields: "id",
        })
        .then((res) => {
            return res.data.id;
        });
}

/**
 * Creates or updates a file in Google Drive.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} folderId The ID of the folder to create or update the file in.
 * @param {string} FILE_NAME The name of the file to create or update.
 * @param {string} fileContent The content of the file to create or update.
 */
async function createOrUpdateFile(auth, folderId, fileName, fileContent) {
    const drive = google.drive({ version: "v3", auth });
    const fileMetadata = {
        name: fileName,
        mimeType: "text/plain",
    };
    const media = {
        mimeType: "text/plain",
        body: fileContent,
    };
    // Check if the file already exists in the folder
    // const res = await drive.files.list({
    // 	q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
    // 	fields: "nextPageToken, files(id)",
    // });
    let [exists, fileId] = await testFileExists(auth, fileName, folderId);
    // const files = res.data.files;
    if (exists) {
        // File already exists, update it
        console.log("Update file");
        // const fileId = files[0].id;
        return drive.files
            .update({
                fileId: fileId,
                resource: fileMetadata,
                media: media,
                fields: "id",
            })
            .then((res) => {
                return res.data.id;
            });
    } else {
        // File does not exist, create it
        console.log("Create file");
        return drive.files
            .create({
                resource: {
                    parents: [folderId],
                    ...fileMetadata,
                },
                media: media,
                // addParents: folderId,
                fields: "id",
            })
            .then((res) => {
                return res.data.id;
            });
    }
}

async function retrieveFileContent(auth, fileId) {
    const drive = google.drive({ version: "v3", auth });
    const res = await drive.files.get({
        fileId: fileId,
        alt: "media",
    });
    console.log(res.data);
    return res.data;
}

/**
 * Tests if a folder exists at the root of the Google Drive.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} folderName The name of the folder to test.
 */
async function testFolderExists(auth, folderName) {
    const drive = google.drive({ version: "v3", auth });
    const res = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName}' and 'root' in parents`,
        fields: "files(id, name)",
    });
    return res.data.files.length > 0 ? [true, res.data.files[0].id] : [false, null];
}

/**
 * Tests if a folder exists at the root of the Google Drive.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} fileName The name of the folder to test.
 */
async function testFileExists(auth, fileName, folderId) {
    const drive = google.drive({ version: "v3", auth });
    const res = await drive.files.list({
        q: `mimeType!='application/vnd.google-apps.folder' and trashed=false and name='${fileName}' and '${folderId}' in parents`,
        fields: "files(id, name)",
    });
    return res.data.files.length > 0 ? [true, res.data.files[0].id] : [false, null];
}

// async function getFile(auth, fileId) {
// 	const drive = google.drive({ version: "v3", auth });
//     try {
//         const file = await drive.files.get({
//         fileId: fileId,
//         alt: 'media',
//         });
//         console.log(file)
//         return file.status;
//     } catch (err) {
//         // TODO(developer) - Handle error
//         throw err;
//     }
// }

exports.authenticate = authenticate;
exports.saveFile = saveFile;
exports.retrieveFile = retrieveFile;
