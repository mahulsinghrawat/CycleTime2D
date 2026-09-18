
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

ipcMain.handle(
  "save-excel-file",
  async (
    event,
    { defaultName, data }: { defaultName: string; data: Uint8Array },
  ) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    const saveDialogOptions = {
      title: "Save Motion Sequence Report",
      defaultPath: defaultName,
      filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
    };

    const result = win
      ? await dialog.showSaveDialog(win, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions);

    if (result.canceled || !result.filePath) {
      return { canceled: true as const };
    }

    await writeFile(result.filePath, Buffer.from(data));
    return { canceled: false as const, filePath: result.filePath };
  },
);

function createWindow() {
  const preloadJsPath = join(__dirname, "preload.js");
  const preloadTsPath = join(__dirname, "preload.ts");
  const preloadPath = existsSync(preloadJsPath) ? preloadJsPath : preloadTsPath;
  const isDev = !app.isPackaged;

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true
    }
  });

  const emitCanvasCommand = (command: string) => {
    win.webContents.send(command);
    void win.webContents
      .executeJavaScript(
        `window.dispatchEvent(new CustomEvent(${JSON.stringify(command)}));`,
        true,
      )
      .catch((error) => {
        console.error(`Failed to dispatch ${command} in renderer`, error);
      });
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: () => {
            emitCanvasCommand("app:canvas-undo");
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+=",
          click: () => {
            emitCanvasCommand("app:canvas-zoom-in");
          },
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            emitCanvasCommand("app:canvas-zoom-out");
          },
        },
        {
          label: "Reset View",
          accelerator: "CmdOrCtrl+0",
          click: () => {
            emitCanvasCommand("app:canvas-zoom-reset");
          },
        },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Electron Documentation",
          click: async () => {
            await shell.openExternal("https://www.electronjs.org/docs/latest");
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
}).catch((err) => {
  console.error('Error during app startup:', err);
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});