const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      // SESUAIKAN: Karena preload.js ada di folder yang sama dengan main.js
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // SESUAIKAN: Menuju ke renderer/index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

/**
 * LOGIKA JIRA CONNECTION TEST (IPC HANDLER)
 */
ipcMain.handle('test-jira-connection', async (event, { email, token }) => {
  try {
    // SESUAIKAN: Path menuju data.json berdasarkan struktur kamu
    // Dari src/main/ naik dua kali ke root, lalu masuk ke src/renderer/js/data.json
    const dataPath = path.join(__dirname, '../../src/renderer/js/data.json');

    if (!fs.existsSync(dataPath)) {
      return { success: false, message: `❌ File tidak ditemukan di: ${dataPath}` };
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const baseUrl = data.JIRA_BASE_URL;

    if (!baseUrl) {
      return { success: false, message: '❌ JIRA_BASE_URL tidak ada di data.json' };
    }

    const apiUrl = `${baseUrl.replace(/\/$/, '')}/rest/api/3/myself`;
    const authString = Buffer.from(`${email}:${token}`).toString('base64');

    // Menggunakan fetch (Node.js 18+)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authString}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const userData = await response.json();

      const avatarUrl =
        userData.avatarUrls?.['48x48'] ||
        userData.avatarUrls?.['32x32'] ||
        userData.avatarUrls?.['24x24'] ||
        userData.avatarUrls?.['16x16'] ||
        userData.avatarUrls?.large ||
        null;

      return {
        success: true,
        message: `✅ OK - Connected as: ${userData.displayName || email}`,
        avatarUrl,
      };
    } else {
      return {
        success: false,
        message: `❌ FAILED (Status: ${response.status})`,
      };
    }
  } catch (error) {
    console.error('Jira Test Error:', error);
    return {
      success: false,
      message: `❌ ERROR: ${error.message}`,
    };
  }
});

// --- Lifecycle App ---
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
