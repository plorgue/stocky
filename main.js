const { app, BrowserWindow, session, ipcMain } = require("electron");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { Vault } = require("./back/model.js");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

let vault = new Vault();

let bolt, vaultWin;

function sendStatusToWindow(text) {
    log.info(text);
    bolt.webContents.send("message", text);
}
function createDefaultWindow() {
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

    bolt = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // eslint-disable-line
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            nativeWindowOpen: true,
        },
    });

    // bolt.webContents.openDevTools();
    bolt.setMenu(null);
    bolt.on("closed", () => {
        bolt = null;
    });
    bolt.loadURL(`file://${__dirname}/pages/bolt.html`); // eslint-disable-line
    // bolt.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);

    return bolt;
}

ipcMain.on("default_pwd", () => {
    bolt.webContents.send("default_pwd", !Vault.existsMainPwd());
});

ipcMain.on("try_input_password", (_, input_password) => {
    const result = vault.tryInputPassword(input_password);
    if (result) {
        log.info("Valid main password");

        vaultWin = new BrowserWindow({
            webPreferences: {
                preload: path.join(__dirname, "preload.js"), // eslint-disable-line
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: true,
                nativeWindowOpen: true,
            },
        });
        vaultWin.maximize();
        vaultWin.setMenu(null);
        vaultWin.loadURL(`file://${__dirname}/pages/vault.html`); // eslint-disable-line
        vaultWin.webContents.openDevTools();

        vaultWin.show();
        bolt.hide();

        let passwordMetadata = vault.getAllPasswordMetadata();
        vaultWin.webContents.send("pwd_metadata", passwordMetadata);
        // mainPassword = input_password;
    } else {
        log.info("Wrong main password");
        bolt.webContents.send("wrong_input_password", result);
    }
});

ipcMain.on("save_new_main", (_, input_password) => {
    if (Vault.existsMainPwd()) {
        // TODO
    } else {
        vault.setMainPassword(input_password);
    }
});

// ------------------------------------------------------------------
// -------------------------- AUTO UPDATER --------------------------
// ------------------------------------------------------------------

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
    createDefaultWindow();
});
app.on("window-all-closed", () => {
    app.quit();
});

app.on("ready", function () {
    autoUpdater.checkForUpdatesAndNotify();
});
