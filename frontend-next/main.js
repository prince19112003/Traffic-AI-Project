const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "TRAFFICGUARD AI COMMAND CENTER",
    backgroundColor: '#020617', // Match slate-950
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/favicon.ico') // Optional: if you have one
  });

  // Remove top menu bar for a clean dashboard look
  Menu.setApplicationMenu(null);

  // Load the Next.js local server
  // Note: During production build, you'd load the static export file
  win.loadURL('http://localhost:3000');

  // Open the DevTools (Optional: for debugging)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
