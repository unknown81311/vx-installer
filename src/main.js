const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("node:path");

let window;

app.once("ready", () => {
  window = new BrowserWindow({
    width: 780,
    height: 470,
    resizable: false,
    title: "VX - Installer",
    frame: false,
    webPreferences: {
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
      allowRunningInsecureContent: false,
      nodeIntegration: true
    }
  });

  window.loadFile(path.join(__dirname, "..", "index.html"));
});

ipcMain.on("app.getPath", (event, name) => {
  event.returnValue = app.getPath(name);
});
ipcMain.on("app.quit", (event, name) => {
  app.quit();
});
ipcMain.on("app.minimize", (event, name) => {
  window.minimize()
});