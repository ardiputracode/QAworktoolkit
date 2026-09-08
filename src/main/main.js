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

/**
 * [NEW] LOGIKA AMBIL JUMLAH TIKET DARI FILTER JIRA (IPC HANDLER)
 * Dipanggil dari renderer via window.qaToolkit.getJiraIssueCount({
 *   email, token, siteBaseUrl, jql, filterId
 * })
 *
 * - siteBaseUrl dikirim renderer hanya untuk divalidasi (harus sama dengan
 *   JIRA_BASE_URL yang dikonfigurasi di data.json) — request sesungguhnya
 *   tetap memakai JIRA_BASE_URL dari data.json, bukan host dari input user,
 *   supaya email+token tidak pernah dikirim ke domain sembarangan.
 * - jql dipakai langsung kalau ada. Kalau yang ada cuma filterId, kita ambil
 *   dulu JQL-nya lewat endpoint /rest/api/3/filter/{id}.
 */
ipcMain.handle(
  'get-jira-issue-count',
  async (event, { email, token, siteBaseUrl, jql, filterId }) => {
    try {
      const dataPath = path.join(__dirname, '../../src/renderer/js/data.json');

      if (!fs.existsSync(dataPath)) {
        return { success: false, message: `❌ File tidak ditemukan di: ${dataPath}` };
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const baseUrl = data.JIRA_BASE_URL;

      if (!baseUrl) {
        return { success: false, message: '❌ JIRA_BASE_URL tidak ada di data.json' };
      }

      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

      // Guard: URL filter yang di-paste user harus dari instance Jira yang sama
      // dengan yang dikonfigurasi, bukan domain lain.
      if (siteBaseUrl) {
        try {
          const configuredHost = new URL(normalizedBaseUrl).hostname;
          const filterHost = new URL(siteBaseUrl).hostname;
          if (configuredHost !== filterHost) {
            return {
              success: false,
              message: `❌ URL filter berasal dari domain lain (${filterHost}), bukan dari instance Jira yang dikonfigurasi (${configuredHost}).`,
            };
          }
        } catch {
          // Host tidak valid akan tetap tertangkap saat request beneran di bawah.
        }
      }

      const authHeaders = {
        Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
        Accept: 'application/json',
      };

      let finalJql = jql;

      // Kalau cuma ada filterId (URL berbentuk ?filter=12345), ambil dulu JQL-nya.
      if (!finalJql && filterId) {
        const filterResponse = await fetch(`${normalizedBaseUrl}/rest/api/3/filter/${filterId}`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!filterResponse.ok) {
          return {
            success: false,
            message: `❌ Gagal mengambil detail filter #${filterId} (Status: ${filterResponse.status})`,
          };
        }

        const filterData = await filterResponse.json();
        finalJql = filterData.jql;
      }

      if (!finalJql) {
        return {
          success: false,
          message: '❌ URL filter tidak mengandung jql maupun filter id yang valid.',
        };
      }

      // [FIX] Endpoint lama /rest/api/3/search (GET) sudah dihapus Atlassian
      // per Mei 2025 dan sekarang selalu balikin 410 Gone. Ganti pakai endpoint
      // resminya untuk hitung jumlah tiket dari JQL:
      // POST /rest/api/3/search/approximate-count -> { count: <number> }
      const countUrl = `${normalizedBaseUrl}/rest/api/3/search/approximate-count`;

      const countResponse = await fetch(countUrl, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jql: finalJql }),
      });

      if (!countResponse.ok) {
        return {
          success: false,
          message: `❌ Gagal mengambil jumlah tiket (Status: ${countResponse.status})`,
        };
      }

      const countData = await countResponse.json();
      return { success: true, count: countData.count };
    } catch (error) {
      console.error('Jira Issue Count Error:', error);
      return {
        success: false,
        message: `❌ ERROR: ${error.message}`,
      };
    }
  }
);

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
