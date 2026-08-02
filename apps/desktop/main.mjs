/**
 * Mission Control Desktop — Electron shell (ADR-0011/0016)
 * Supervises Agent install/pairing; does not host crawl process (ADR-0012).
 */
import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { registerEffectOrchestration } from "./effect-runtime.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEB_URL = process.env.MC_WEB_URL ?? "http://127.0.0.1:5173";
const CONTROL_PLANE = process.env.MC_CONTROL_PLANE ?? WEB_URL;

function secretsPath() {
  return path.join(app.getPath("userData"), "agent-secrets.bin");
}

function writeAgentSecret(payload) {
  const json = JSON.stringify(payload);
  if (safeStorage.isEncryptionAvailable()) {
    const enc = safeStorage.encryptString(json);
    fs.writeFileSync(secretsPath(), enc);
  } else {
    // Fallback (dev): still under userData, not world-readable by default
    fs.writeFileSync(secretsPath(), Buffer.from(json, "utf8"), { mode: 0o600 });
  }
}

function readAgentSecret() {
  const p = secretsPath();
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(buf));
    }
    return JSON.parse(buf.toString("utf8"));
  } catch {
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    backgroundColor: "#1e1e2e",
    title: "Mission Control",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(WEB_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("mc:platform", () => process.platform);

ipcMain.handle("mc:getAgentSecret", () => {
  const s = readAgentSecret();
  if (!s) return null;
  return {
    agencyId: s.agencyId,
    deviceLabel: s.deviceLabel,
    hasRefreshToken: Boolean(s.refreshToken),
    issuedAt: s.issuedAt,
  };
});

// pairAgent registered below after shared impl

async function installAgentService({ binPath } = {}) {
  const installSh = path.join(__dirname, "../agent/install/install.sh");
  if (!fs.existsSync(installSh)) {
    return { ok: false, error: `install script missing: ${installSh}` };
  }
  try {
    const args = [];
    if (binPath) args.push("--bin", binPath);
    args.push("--control-plane", CONTROL_PLANE);
    const { stdout, stderr } = await execFileAsync("bash", [installSh, ...args], {
      env: { ...process.env, MC_CONTROL_PLANE: CONTROL_PLANE },
    });
    return { ok: true, stdout, stderr };
  } catch (e) {
    return { ok: false, error: String(e), stdout: e.stdout, stderr: e.stderr };
  }
}

ipcMain.handle("mc:installAgentService", async (_evt, opts) => installAgentService(opts ?? {}));

// Extract pair logic for Effect orchestration
async function pairAgentImpl({ bearer, deviceLabel } = {}) {
  try {
    const res = await fetch(`${CONTROL_PLANE.replace(/\/$/, "")}/api/agent/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ deviceLabel: deviceLabel ?? `desktop-${process.platform}` }),
    });
    const json = await res.json();
    if (!json?.ok) {
      return { ok: false, error: json?.error?.message ?? "token issue failed" };
    }
    const data = json.data ?? {};
    writeAgentSecret({
      refreshToken: data.refreshToken,
      agencyId: data.agencyId,
      deviceLabel: deviceLabel ?? `desktop-${process.platform}`,
      issuedAt: Date.now(),
      expiresIn: data.expiresIn,
    });
    const agentDir =
      process.platform === "darwin"
        ? path.join(app.getPath("home"), "Library/Application Support/MissionControl/Agent")
        : path.join(app.getPath("home"), ".local/share/mission-control-agent");
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(
      path.join(agentDir, "config.json"),
      JSON.stringify(
        {
          refresh_token: data.refreshToken,
          agency_id: data.agencyId,
          control_plane: CONTROL_PLANE,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    return { ok: true, agencyId: data.agencyId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

ipcMain.handle("mc:pairAgent", async (_evt, opts) => pairAgentImpl(opts ?? {}));

registerEffectOrchestration({
  pairAgent: pairAgentImpl,
  installAgent: installAgentService,
  readSecret: readAgentSecret,
  writeSecret: writeAgentSecret,
  controlPlane: CONTROL_PLANE,
});

app.whenReady().then(async () => {
  createWindow();
  // Effect-style bootstrap on open (ADR-0011/0016)
  const existing = readAgentSecret();
  if (existing?.refreshToken) {
    console.log("[mc-desktop] agent secret present", {
      agencyId: existing.agencyId,
      issuedAt: existing.issuedAt,
    });
  } else {
    console.log("[mc-desktop] no agent secret — pair from UI or run orchestrateAgentBootstrap");
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
