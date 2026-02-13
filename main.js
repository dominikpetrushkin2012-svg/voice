const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();

  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Обновление",
    message: "Доступна новая версия. Скачиваем..."
  });
});

autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Обновление готово",
    message: "Перезапустить приложение для обновления?",
    buttons: ["Да"]
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});
