/**
 * Mission Control Desktop — Electron + Effect orchestration (ADR-0011)
 * Supervises Agent install/pairing; does not host crawl process (ADR-0012).
 */
import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEB_URL = process.env.MC_WEB_URL ?? "http://127.0.0.1:5173";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    backgroundColor: "#1e1e2e",
    title: "Mission Control",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
    },
  });
  win.loadURL(WEB_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  // TODO: Effect runtime — issue Agent Token, write OS secret store, ensure user-level service unit
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
