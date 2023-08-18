const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
const { spawnSync } = require("child_process")
const { join } = require("path")
const { existsSync, readdirSync, readFileSync, writeFileSync} = require("fs");

const appdata = app.getPath("appData");

function createWindow() {
    const win = new BrowserWindow({
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#ffffff',
        },
        resizable: false,
        maximizable: false,
        width: 780,
        height: 470,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    win.loadFile('index.html');
    win.$ = require('jquery');
    return win;
}

function install(indexFolder, win) {
    if (process.platform === "win32") {
        let text = readFileSync(indexFolder, {
            encoding: 'utf8'
        });
        let requirePath = join(appdata, ".vx", "vx.asar");
        let requireText = `require("${requirePath.replaceAll("\\","/")}")`;
        if(!text.includes(requireText))
            {
                writeFileSync(indexFolder, `${requireText}\n` + text);
                win.webContents.send('finishedInstall');
            }
        else
            {
                win.webContents.send('alreadyInstalled');
            }
    }
}

app.whenReady().then(() => {
    win = createWindow();

    ipcMain.handle('install', async (event) => {
        install(path, win);
    });

    let path = join(getDiscordPath(), "modules/discord_desktop_core-1/discord_desktop_core/index.js")

    console.log()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


const getDiscordPath = (release = "") => {

    if (process.platform === "win32") {
        const [, , , task] = spawnSync("PowerShell.exe", [
            `tasklist /fi "imagename eq Discord${release}.exe"`
        ]).stdout.toString().split("\n")
        const matched = task ? task.match(/[0-9]+/) : false
        if (matched) {
            const [, , , path] = spawnSync("PowerShell.exe", [
                `Get-Process -Id ${matched.pop()} -FileVersionInfo | Select FileName`
            ]).stdout.toString().split("\n")

            return join(path, "..")
        }
        const discordPath = join(appdata, "..", "Local", `Discord${release}`)
        if (!existsSync(discordPath)) return false
        const app = readdirSync(discordPath).filter(m => m.startsWith("app-")).sort().pop()
        return join(discordPath, app)
    }
    if (process.platform === "darwin") {
        const path = `/Applications/Discord${release}.app/Contents`
        if (existsSync(path)) return path
        return false
    }
    const path = `/usr/share/discord${release}/Resources`
    if (existsSync(path)) return path
    return false
}

const pathes = {
    stable: getDiscordPath(""),
    ptb: getDiscordPath("PTB"),
    canary: getDiscordPath("Canary")
}