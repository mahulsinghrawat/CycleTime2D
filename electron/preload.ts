import { contextBridge, ipcRenderer } from "electron";

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload loaded");
});

contextBridge.exposeInMainWorld("electronAPI", {
  saveExcelFile: (defaultName: string, data: Uint8Array) =>
    ipcRenderer.invoke("save-excel-file", { defaultName, data }) as Promise<
      { canceled: true } | { canceled: false; filePath: string }
    >,
});
