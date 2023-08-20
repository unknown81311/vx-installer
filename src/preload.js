const { remote, ipcRenderer, contextBridge } = require("electron/renderer");
const path = require("node:path");
const fs = require("original-fs");
const request = require("./request");

function downloadAsar() {
  const vxDirectory = path.join(appData, ".vx");

  return new Promise((resolve, reject) => {
    request("https://api.github.com/repos/doggybootsy/vx/releases", {
      headers: {
        "User-Agent": "VX~Installer"
      }
    }, (err, res, body) => {
      if (err) return reject(err);
  
      const releases = JSON.parse(body.toString("utf-8"));
      const release = releases.at(0);
      const asset = release.assets.find((asset) => asset.name === "vx.asar");

      request(asset.url, {
        headers: {
          "User-Agent": "VX~Installer",
          "Accept": "application/octet-stream"
        }
      }, (err, res, body) => {
        if (err) return reject(err);
        fs.writeFileSync(path.join(vxDirectory, "vx.asar"), body);
        resolve();
      });
    });
  });
};


const localAppData = path.join(ipcRenderer.sendSync("app.getPath", "appData"), "..", "local");

const appData = path.join(ipcRenderer.sendSync("app.getPath", "appData"));

async function ensureDirectory() {
  const vxDirectory = path.join(appData, ".vx");
  if (!fs.existsSync(vxDirectory)) fs.mkdirSync(vxDirectory);
  
  await downloadAsar();
};

async function getDiscordCorePath(release) {
  try {
    const discordName = `discord${release === "stable" ? "" : release}`;
    const appDir = (await fs.promises.readdir(path.join(localAppData, discordName))).filter(m => m.startsWith("app-")).reverse().at(0);
    const core = (await fs.promises.readdir(path.join(localAppData, discordName, appDir, "modules"))).filter(m => m.startsWith("discord_desktop_core-")).reverse().at(0);
    return path.join(localAppData, discordName, appDir, "modules", core, "discord_desktop_core");
  } catch (error) {
    return null;
  }
};

/**
 * 
 * @param {"stable" | "ptb" | "canary"} release 
 */
async function install(release) {
  if (![ "stable", "ptb", "canary" ].includes(release)) throw new Error(`Release '${release}' is not allowed`);

  const discordCorePath = await getDiscordCorePath(release);
  if (!discordCorePath) throw new Error("Discord core path wasn't found!");

  const vxDirectory = path.join(appData, ".vx");
  await ensureDirectory();
  
  await fs.promises.writeFile(path.join(discordCorePath, "index.js"), `require(${JSON.stringify(path.join(vxDirectory, "vx.asar"))});\nmodule.exports = require('./core.asar');`);
}
/**
 * 
 * @param {"stable" | "ptb" | "canary"} release 
 */
async function uninstall(release) {
  if (![ "stable", "ptb", "canary" ].includes(release)) throw new Error(`Release '${release}' is not allowed`);
  
  const discordCorePath = await getDiscordCorePath(release);
  if (!discordCorePath) throw new Error("Discord core path wasn't found!");

  await fs.promises.writeFile(path.join(discordCorePath, "index.js"), "module.exports = require('./core.asar');");
}
function quit() {
  ipcRenderer.send("app.quit");
};
function minimize() {
  ipcRenderer.send("app.minimize");
};

contextBridge.exposeInMainWorld("VX", window.VX = { install, uninstall, quit, minimize, getDiscordCorePath });
