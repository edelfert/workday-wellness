// Preload script — runs in a sandboxed renderer context before the page loads.
// Exposes only what the renderer needs from Node/Electron via contextBridge.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info so the renderer can adapt if needed
  platform: process.platform,

  // Allow the renderer to open URLs externally
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
