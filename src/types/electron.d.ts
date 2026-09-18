export {};

declare global {
  interface Window {
    electronAPI?: {
      saveExcelFile: (
        defaultName: string,
        data: Uint8Array,
      ) => Promise<{ canceled: true } | { canceled: false; filePath: string }>;
    };
  }
}
