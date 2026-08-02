import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("mcDesktop", {
  platform: process.platform,
  /** Pair Agent: fetch long-lived token via session and write secret store (ADR-0016) */
  pairAgent: async () => ({ ok: false, note: "implement with Clerk session + /api/agent/token" }),
});
