const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    send: (channel, data) => {
        const validChannels = ["app_version", "restart_app", "try_input_password", "default_pwd", "save_new_main"];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = [
            "app_version",
            "update_available",
            "update_downloaded",
            "update_not_available",
            "message",
            "default_pwd",
            "wrong_input_password",
            "pwd_metadata",
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },

    removeAllListeners: (channel) => {
        const validChannels = ["app_version", "update_available", "update_downloaded", "update_not_available"];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },

    password: (type, data) => {
        switch (type) {
            case "create":
                ipcRenderer.send("create_pwd", data);
                break;
            case "modify":
                ipcRenderer.send("modify_pwd", data);
                break;
            case "delete":
                ipcRenderer.send("delete_pwd", data);
                break;
            case "reveal":
                ipcRenderer.send("reveal_pwd", data);
                break;
            default:
                return null;
        }
    },
});
