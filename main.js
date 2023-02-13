const { app, BrowserWindow, session, ipcMain, clipboard } = require("electron");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { Vault } = require("./back/models.js");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

let boltWin;
let vaultWin;
let vault = new Vault();

function initWindow(url, maximaize = false, devTool = false) {
    const newWin = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // eslint-disable-line
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            nativeWindowOpen: true,
        },
        show: false,
    });

    if (devTool) newWin.webContents.openDevTools();
    if (maximaize) newWin.maximize();
    newWin.setMenu(null);
    newWin.loadURL(url);
    return newWin;
}

app.on("ready", function () {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [
                    "default-src 'unsafe-inline'; script-src-elem 'self'; style-src-elem 'self' https://fonts.googleapis.com; img-src 'self'; font-src https://fonts.gstatic.com",
                ],
            },
        });
    });
    boltWin = initWindow(`file://${__dirname}/pages/bolt.html`); // eslint-disable-line
    boltWin.show();
});

app.on("window-all-closed", () => {
    app.quit();
});

// ------------------------------------------------------------------
// ---------------------------- ROUTING -----------------------------
// ------------------------------------------------------------------

let mainPassword = null;

ipcMain.on("default_pwd", () => {
    boltWin.webContents.send("default_pwd", !Vault.existsMainPwd());
});

ipcMain.on("try_input_password", (_, input_password) => {
    const result = vault.tryInputPassword(input_password);
    if (result) {
        log.info("Valid main password");
        vaultWin = initWindow(`file://${__dirname}/pages/vault.html`, true, true); // eslint-disable-line
        vaultWin.show();
        boltWin.hide();

        mainPassword = input_password;

        let passwordMetadata = vault.getAllPasswordMetadata(input_password);

        vaultWin.on("ready-to-show", function () {
            vaultWin.webContents.send("pwd_metadata", passwordMetadata);
        });
    } else {
        log.info("Wrong main password");
        boltWin.webContents.send("wrong_input_password", result);
    }
});

ipcMain.on("save_new_main", (_, input_password) => {
    if (Vault.existsMainPwd()) {
        // TODO
    } else {
        vault.setMainPassword(input_password);
    }
});

ipcMain.on("create_pwd", (e, pwd) => {
    vault.addPassword(pwd, mainPassword);
    vaultWin.send("pwd_metadata", vault.getAllPasswordMetadata(mainPassword));
});

ipcMain.on("delete_pwd", (e, id) => {
    vault.deletePassword(id);
    vaultWin.send("pwd_metadata", vault.getAllPasswordMetadata(mainPassword));
});

ipcMain.on("reveal_pwd", (e, id) => {
    let pwd = vault.getPassword(id, mainPassword);
    vaultWin.send("password_revealed", pwd);
});

ipcMain.on("modify_pwd", (e, pwd) => {
    vault.patchPassword(pwd, mainPassword);
    vaultWin.send("pwd_metadata", vault.getAllPasswordMetadata(mainPassword));
});

ipcMain.on("clip_password", (e, id) => {
    let pwd = vault.getPassword(id, mainPassword);
    clipboard.writeText(pwd.password);
});

// ------------------------------------------------------------------
// -------------------------- AUTO UPDATER --------------------------
// ------------------------------------------------------------------
function sendStatusToWindow(text) {
    log.info(text);
    // boltWin.webContents.send("message", text);
}

autoUpdater.on("checking-for-update", () => {
    sendStatusToWindow("Checking for update...");
});
autoUpdater.on("update-available", () => {
    sendStatusToWindow("Update available.");
});
autoUpdater.on("update-not-available", () => {
    sendStatusToWindow("Update not available.");
});
autoUpdater.on("error", (err) => {
    sendStatusToWindow("Error in auto-updater. " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressObj.percent + "%";
    log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
    sendStatusToWindow(log_message);
});
autoUpdater.on("update-downloaded", () => {
    sendStatusToWindow("Update downloaded");
});
app.on("ready", function () {
    autoUpdater.checkForUpdatesAndNotify();
});
