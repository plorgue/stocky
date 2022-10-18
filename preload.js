const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
	// Expose protected methods that allow the renderer process to use
	// the ipcRenderer without exposing the entire object
	send: (channel, data) => {
		const validChannels = ["app_version", "restart_app"];
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data);
		}
	},
	receive: (channel, func) => {
		const validChannels = ["app_version", "update_available", "update_downloaded", "update_not_available", "message"];
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
});
