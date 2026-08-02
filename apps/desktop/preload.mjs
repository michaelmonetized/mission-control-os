import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mcDesktop", {
  platform: () => ipcRenderer.invoke("mc:platform"),
  getAgentSecret: () => ipcRenderer.invoke("mc:getAgentSecret"),
  /** @param {{ bearer?: string, deviceLabel?: string }} opts */
  pairAgent: (opts) => ipcRenderer.invoke("mc:pairAgent", opts ?? {}),
  /** @param {{ binPath?: string }} opts */
  installAgentService: (opts) => ipcRenderer.invoke("mc:installAgentService", opts ?? {}),
  /** Effect-style bootstrap: pair → install → health (ADR-0011) */
  orchestrateAgentBootstrap: (opts) =>
    ipcRenderer.invoke("mc:orchestrateAgentBootstrap", opts ?? {}),
});
