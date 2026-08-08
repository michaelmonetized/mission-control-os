/**
 * Effect orchestration for Desktop (ADR-0011).
 * Bootstrap + status + restart + unpair graphs; sequential fallback if Effect fails.
 */
import { ipcMain, app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * @typedef {{ refreshToken?: string, agencyId?: string, deviceLabel?: string, issuedAt?: number }} AgentSecret
 */

/**
 * @param {{
 *   pairAgent: (opts: any) => Promise<any>,
 *   installAgent: (opts: any) => Promise<any>,
 *   readSecret: () => any,
 *   writeSecret: (p: any) => void,
 *   controlPlane: string,
 * }} deps
 */
export function registerEffectOrchestration(deps) {
  async function fetchWithTimeout(url, init = {}, ms = 8000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  }

  const healthFn = async () => {
    try {
      const res = await fetchWithTimeout(
        `${deps.controlPlane.replace(/\/$/, "")}/api/agent/heartbeat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "desktop-effect" }),
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  };

  const heartbeatFn = async () => {
    try {
      const secret = deps.readSecret();
      const res = await fetchWithTimeout(
        `${deps.controlPlane.replace(/\/$/, "")}/api/agent/heartbeat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "desktop-effect-heartbeat",
            agencyId: secret?.agencyId,
            deviceLabel: secret?.deviceLabel,
          }),
        },
      );
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  };

  const stopFn = async () => {
    // Best-effort: launchctl unload — only ok when unload succeeds or plist missing
    try {
      if (process.platform === "darwin") {
        const plist = path.join(
          app.getPath("home"),
          "Library/LaunchAgents/com.missioncontrol.agent.plist",
        );
        if (!fs.existsSync(plist)) {
          return { ok: true, detail: "no plist" };
        }
        await execFileAsync("launchctl", ["unload", plist]);
        return { ok: true, detail: "unloaded" };
      }
      return { ok: false, error: "stop not implemented for this platform" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };

  const unpairFn = async () => {
    try {
      // Wipe secret store via empty write if main supports clear — rewrite empty
      const secretsPath = path.join(app.getPath("userData"), "agent-secrets.bin");
      if (fs.existsSync(secretsPath)) fs.unlinkSync(secretsPath);
      const agentDir =
        process.platform === "darwin"
          ? path.join(app.getPath("home"), "Library/Application Support/MissionControl/Agent")
          : path.join(app.getPath("home"), ".local/share/mission-control-agent");
      const cfg = path.join(agentDir, "config.json");
      if (fs.existsSync(cfg)) fs.unlinkSync(cfg);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };

  ipcMain.handle("mc:orchestrateAgentBootstrap", async (_evt, opts = {}) => {
    const steps = [];
    const log = (name, ok, detail) => {
      steps.push({ name, ok, detail, at: Date.now() });
    };

    const pairFn = async () => {
      const existing = deps.readSecret();
      if (existing?.refreshToken && !opts.forcePair) {
        log("pair", true, "existing secret");
        return { ok: true, agencyId: existing.agencyId };
      }
      const pair = await deps.pairAgent({
        bearer: opts.bearer,
        deviceLabel: opts.deviceLabel,
      });
      log("pair", Boolean(pair?.ok), pair?.agencyId ?? pair?.error);
      return pair;
    };

    const installFn = async () => {
      if (opts.install === false) {
        log("install", true, "skipped");
        return { ok: true };
      }
      const inst = await deps.installAgent({ binPath: opts.binPath });
      log("install", Boolean(inst?.ok), inst?.error ?? "ok");
      return inst;
    };

    const healthWrapped = async () => {
      const ok = await healthFn();
      log("health", ok, ok ? "ok" : "unhealthy");
      return ok;
    };

    const heartbeatWrapped = async () => {
      const hb = await heartbeatFn();
      log("heartbeat", Boolean(hb?.ok), hb?.ok ? "ok" : "fail");
      return hb;
    };

    try {
      const { runAgentBootstrapEffect } = await import("./effect-program.mjs");
      const effectResult = await runAgentBootstrapEffect({
        pair: pairFn,
        install: installFn,
        health: healthWrapped,
        heartbeat: heartbeatWrapped,
      });
      return { ...effectResult, steps, engine: "effect" };
    } catch {
      await pairFn();
      await installFn();
      await healthWrapped();
      await heartbeatWrapped();
      const ok = steps.every((s) => s.ok || s.name === "install");
      return { ok, steps, engine: "sequential" };
    }
  });

  ipcMain.handle("mc:orchestrateAgentStatus", async () => {
    const steps = [];
    try {
      const { runAgentStatusEffect } = await import("./effect-program.mjs");
      const healthWrapped = async () => {
        const ok = await healthFn();
        steps.push({ name: "health", ok, at: Date.now() });
        return ok;
      };
      const heartbeatWrapped = async () => {
        const hb = await heartbeatFn();
        steps.push({ name: "heartbeat", ok: Boolean(hb?.ok), at: Date.now() });
        return hb;
      };
      const result = await runAgentStatusEffect({
        health: healthWrapped,
        heartbeat: heartbeatWrapped,
      });
      return { ...result, steps, engine: "effect" };
    } catch {
      const ok = await healthFn();
      steps.push({ name: "health", ok, at: Date.now() });
      return { ok, result: { healthOk: ok, online: ok }, steps, engine: "sequential" };
    }
  });

  ipcMain.handle("mc:orchestrateAgentRestart", async (_evt, opts = {}) => {
    const steps = [];
    try {
      const { runAgentRestartEffect } = await import("./effect-program.mjs");
      const result = await runAgentRestartEffect({
        stop: async () => {
          const r = await stopFn();
          steps.push({ name: "stop", ok: r.ok, at: Date.now() });
          return r;
        },
        install: async () => {
          const inst = await deps.installAgent({ binPath: opts.binPath });
          steps.push({ name: "install", ok: Boolean(inst?.ok), at: Date.now() });
          return inst;
        },
        health: async () => {
          const ok = await healthFn();
          steps.push({ name: "health", ok, at: Date.now() });
          return ok;
        },
        heartbeat: async () => {
          const hb = await heartbeatFn();
          steps.push({ name: "heartbeat", ok: Boolean(hb?.ok), at: Date.now() });
          return hb;
        },
        pair: async () => ({ ok: true }),
      });
      return { ...result, steps, engine: "effect" };
    } catch (e) {
      return { ok: false, error: String(e), steps, engine: "sequential" };
    }
  });

  ipcMain.handle("mc:orchestrateAgentUnpair", async () => {
    try {
      const { runAgentUnpairEffect } = await import("./effect-program.mjs");
      return {
        ...(await runAgentUnpairEffect({ unpair: unpairFn })),
        engine: "effect",
      };
    } catch {
      const r = await unpairFn();
      return { ok: r.ok, result: r, engine: "sequential" };
    }
  });
}
