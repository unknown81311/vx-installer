window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld("ipcRenderer", {
  send:(name,data) => {
    ipcRenderer.invoke(name, data);
  }
})


ipcRenderer.on('alreadyInstalled', function (evt, message) {
  alert("VX is already installed!");
  window.close();
});

ipcRenderer.on('finishedInstall', function (evt, message) {
  alert("VX is now installed!");
  window.close();
});