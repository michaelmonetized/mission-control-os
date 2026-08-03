/**
 * Effect orchestration for Desktop (ADR-0011).
 * Tries real Effect program; falls back to sequential pipeline.
 */
import { ipcMain } from "electron";

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

    const healthFn = async () => {
      try {
        const res = await fetch(
          `${deps.controlPlane.replace(/\/$/, "")}/api/agent/heartbeat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: "desktop-effect" }),
          },
        );
        log("health", res.ok, `status ${res.status}`);
        return res.ok;
      } catch (e) {
        log("health", false, String(e));
        return false;
      }
    };

    const heartbeatFn = async () => {
      try {
        const secret = deps.readSecret();
        const res = await fetch(
          `${deps.controlPlane.replace(/\/$/, "")}/api/agent/heartbeat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "desktop-effect-heartbeat",
              agencyId: secret?.agencyId,
            }),
          },
        );
        const ok = res.ok;
        log("heartbeat", ok, `status ${res.status}`);
        return { ok };
      } catch (e) {
        log("heartbeat", false, String(e));
        return { ok: false };
      }
    };

    try {
      const { runAgentBootstrapEffect } = await import("./effect-program.mjs");
      const effectResult = await runAgentBootstrapEffect({
        pair: pairFn,
        install: installFn,
        health: healthFn,
        heartbeat: heartbeatFn,
      });
      return { ...effectResult, steps, engine: "effect" };
    } catch {
      // Sequential fallback
      await pairFn();
      await installFn();
      await healthFn();
      await heartbeatFn();
      const ok = steps.every((s) => s.ok || s.name === "install");
      return { ok, steps, engine: "sequential" };
    }
  });
}
