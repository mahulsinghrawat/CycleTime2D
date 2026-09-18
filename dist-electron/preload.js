import { contextBridge, ipcRenderer } from "electron";
window.addEventListener("DOMContentLoaded", () => {
    console.log("Preload loaded");
});
contextBridge.exposeInMainWorld("electronAPI", {
    saveExcelFile: (defaultName, data) => ipcRenderer.invoke("save-excel-file", { defaultName, data }),
});
