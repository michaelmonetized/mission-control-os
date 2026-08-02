/**
 * Lightweight Effect-style orchestration for Desktop (ADR-0011).
 * Uses the Effect library when available; falls back to a sequential pipeline.
 *
 * Services: AgentPair · AgentInstall · SecretStore · HealthCheck
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

    try {
      // 1. Pair / ensure token
      const existing = deps.readSecret();
      if (existing?.refreshToken && !opts.forcePair) {
        log("pair", true, "existing secret");
      } else {
        const pair = await deps.pairAgent({
          bearer: opts.bearer,
          deviceLabel: opts.deviceLabel,
        });
        if (!pair?.ok) {
          log("pair", false, pair?.error ?? "pair failed");
          return { ok: false, steps };
        }
        log("pair", true, pair.agencyId);
      }

      // 2. Install user-level service (best-effort)
      if (opts.install !== false) {
        const inst = await deps.installAgent({ binPath: opts.binPath });
        log("install", Boolean(inst?.ok), inst?.error ?? inst?.stdout?.slice?.(0, 200));
      } else {
        log("install", true, "skipped");
      }

      // 3. Health check control plane
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
      } catch (e) {
        log("health", false, String(e));
      }

      const ok = steps.every((s) => s.ok || s.name === "install");
      return { ok, steps };
    } catch (e) {
      log("fatal", false, String(e));
      return { ok: false, steps };
    }
  });
}
