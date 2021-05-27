const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require("path");

let mainWindow;
let notificationCounter = 0;

const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.131 Safari/537.36';
const windowStateKeeper = require('electron-window-state');


function createWindow() {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    titleBarStyle: process.platform == "darwin" ? 'hiddenInset' : '',
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL('http://messages.google.com/web/', { userAgent });
 // mainWindow.loadFile('test.html', { userAgent });

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.insertCSS('.main-nav-header, .header {-webkit-app-region: drag;}')
    if (process.platform == 'darwin') {
      mainWindow.webContents.insertCSS('.main-nav-header {margin-top: 16px;}')
      mainWindow.webContents.insertCSS('mw-settings-container .header {padding-top: 54px;}')
      mainWindow.webContents.insertCSS('@media (max-width: 560px) { .header { padding-top: 54px !important; } }')
    }
 });


  mainWindow.webContents.on('new-window', (event, url) => {
    shell.openExternal(url);
    event.preventDefault();
  });

  mainWindow.on('close', function (event) {
    if (app.quitting) {
      mainWindow = null
    } else {
      event.preventDefault()
      mainWindow.hide()
    }
  });

  mainWindow.on('focus', function (event) {
    resetBadge()
  });
}

function resetBadge() {
  if (notificationCounter > 0) {
    app.setBadgeCount(0)
    notificationCounter = 0
  }
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show()
  }
});
app.on('focus', function () {
  resetBadge()
});

app.on('before-quit', () => app.quitting = true)

ipcMain.on('notification', (event, arg) => {
  if (!mainWindow.isFocused()) {
    notificationCounter++
    app.setBadgeCount(notificationCounter)
  }
})