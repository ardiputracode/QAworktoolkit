const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

// --- CONFIGURATION & ENV ---
if (!app.isPackaged) {
  require('dotenv').config({
    path: path.join(__dirname, '../../.env'),
  });
}

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const OPEN_WEBUI_URL = process.env.OPEN_WEBUI_URL; // Di-inject saat build

// --- HELPER: Google Auth ---
function createGoogleAuth() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials tidak ditemukan.');
  }
  return new google.auth.GoogleAuth({
    credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

// --- WINDOW MANAGEMENT ---
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

/**
 * [NEW] LOGIKA KIRIM PROMPT KE OPEN WEBUI (IPC HANDLER)
 */
ipcMain.handle(
  'send-openwebui-prompt',
  async (event, { token, model, systemPrompt, userPrompt }) => {
    try {
      if (!OPEN_WEBUI_URL) throw new Error('URL Open WebUI tidak dikonfigurasi.');
      if (!token) throw new Error('API Token diperlukan.');

      const apiUrl = `${OPEN_WEBUI_URL.replace(/\/$/, '')}/api/chat/completions`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gagal mengirim prompt (Status: ${response.status})`);
      }

      const data = await response.json();
      // Ambil konten jawaban dari struktur OpenAI/OpenWebUI
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error('AI memberikan respon kosong.');

      return { success: true, data: content };
    } catch (error) {
      console.error('Error sending prompt to Open WebUI:', error);
      return { success: false, message: error.message };
    }
  }
);

/**
 * [NEW] LOGIKA AMBIL DAFTAR MODEL DARI OPEN WEBUI (IPC HANDLER)
 */
ipcMain.handle('get-openwebui-models', async (event, token) => {
  try {
    if (!OPEN_WEBUI_URL) throw new Error('URL tidak dikonfigurasi.');
    if (!token) throw new Error('Token diperlukan untuk mengambil model.');

    // Endpoint standar Open WebUI/OpenAI adalah /api/models
    const apiUrl = `${OPEN_WEBUI_URL.replace(/\/$/, '')}/api/models`;

    console.log(`[Main] Fetching models from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil model (Status: ${response.status})`);
    }

    const data = await response.json();

    // Struktur OpenAI/OpenWebUI biasanya: { data: [ { id: 'model-name', ... }, ... ] }
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format data model tidak sesuai.');
    }

    // Transformasi ke format label/value agar mudah digunakan di dropdown
    const models = data.data.map((m) => ({
      label: m.id, // Nama yang dilihat user (misal: "gpt-4o")
      value: m.id, // Nilai yang dikirim ke server (misal: "gpt-4o")
    }));

    return { success: true, data: models };
  } catch (error) {
    console.error('Error fetching Open WebUI models:', error);
    return { success: false, message: error.message };
  }
});

// main.js

// ... existing code ...

// ============================================================
// [FIXED] LOGIKA TEST KONEKSI OPEN WEBUI (IPC HANDLER)
// ============================================================
ipcMain.handle('test-openwebui', async (event, token) => {
  try {
    if (!OPEN_WEBUI_URL) throw new Error('URL Open WebUI tidak ditemukan dalam konfigurasi build.');
    if (!token) throw new Error('API Token tidak boleh kosong.');

    console.log(`[Main] Mengetes koneksi dengan endpoint terlindungi ke: ${OPEN_WEBUI_URL}`);

    // [FIX] Jangan tembak URL utama, tembak /api/models atau /api/user agar token benar-benar divalidasi
    const testApiUrl = `${OPEN_WEBUI_URL.replace(/\/$/, '')}/api/models`;

    const response = await fetch(testApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Sekarang kita mengecek apakah token benar-benar bisa mengakses data model
    if (response.ok) {
      return { success: true, message: '✅ Connected to Open WebUI' };
    } else if (response.status === 401 || response.status === 403) {
      // Jika token salah, sekarang ini akan tertangkap dengan benar
      return { success: false, message: `❌ Invalid Token (Status: ${response.status})` };
    } else {
      return { success: false, message: `❌ Server Error (Status: ${response.status})` };
    }
  } catch (error) {
    console.error('Open WebUI Test Error:', error);
    return { success: false, message: `❌ ERROR: ${error.message}` };
  }
});

// ... rest of the code ...

/**
 * Membuat Google Authentication menggunakan Service Account.
 *
 * Fungsi ini belum melakukan request ke Google Sheets.
 * Authentication baru akan digunakan ketika fitur Google Sheets
 * ditambahkan nanti.
 *
 * Scope dibuat read-only agar aplikasi hanya memiliki izin
 * membaca spreadsheet dan tidak dapat mengubah atau menghapus data.
 */
function createGoogleAuth() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials tidak ditemukan.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

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
 * [NEW] LOGIKA AMBIL QA LEAD DARI GOOGLE SHEETS (IPC HANDLER)
 * Mengambil data dari sel A2 pada sheet tertentu.
 */
ipcMain.handle('get-qa-lead', async () => {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID tidak ditemukan di .env');
    }

    // --- KONFIGURASI ---
    // Assumption: Nama sheet tempat menyimpan QA Lead adalah 'Settings'
    const SHEET_NAME = 'Tester';
    const range = `'${SHEET_NAME}'!A2`; // Hanya mengambil sel A2

    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    // Jika sel kosong, kembalikan string kosong
    if (!rows || !rows[0] || !rows[0][0]) {
      return { success: true, data: '' };
    }

    // Kembalikan nilai dari A2
    return { success: true, data: rows[0][0].trim() };
  } catch (error) {
    console.error('Error fetching QA Lead from Sheets:', error);
    return { success: false, message: error.message };
  }
});

/**
 * [NEW] LOGIKA AMBIL DAFTAR TESTER DARI GOOGLE SHEETS (IPC HANDLER)
 * Struktur Sheet: Kolom B berisi nama-nama Tester.
 */
ipcMain.handle('get-testers', async () => {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID tidak ditemukan di .env');
    }

    // KONFIGURASI (Sesuaikan jika nama tab bukan Sheet1)
    const SHEET_NAME = 'Tester';
    const range = `'${SHEET_NAME}'!B2:B`; // Ambil Kolom B mulai baris ke-2

    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return { success: true, data: [] };
    }

    // Transformasi baris menjadi array string sederhana: ["Tester A", "Tester B"]
    const testers = rows.map((row) => row[0]?.trim()).filter((name) => name);

    return { success: true, data: testers };
  } catch (error) {
    console.error('Error fetching testers from Sheets:', error);
    return { success: false, message: error.message };
  }
});

/**
 * [FIXED] LOGIKA AMBIL DAFTAR PROYEK DARI GOOGLE SHEETS
 */
ipcMain.handle('get-project-names', async () => {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID tidak ditemukan di .env');
    }

    // --- KONFIGURASI SHEET (SESUAIKAN DI SINI) ---
    const SHEET_NAME = 'Project info'; // <--- PASTIKAN INI SAMA PERSIS dengan nama tab di spreadsheet kamu!
    // Jika nama tab adalah "Project List", tulis: const SHEET_NAME = 'Project List';

    // Kita gunakan A2:A100 (memberi batas baris agar parser API lebih mudah)
    const range = `'${SHEET_NAME}'!A2:A100`;
    // ----------------------------------------------

    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    // Jika tidak ada data (atau hanya header), kembalikan array kosong dengan sukses
    if (!rows || rows.length === 0) {
      return { success: true, data: [] };
    }

    // Transformasi data
    const projectNames = rows
      .map((row) => ({
        label: row[0]?.trim(), // Gunakan trim() untuk hapus spasi tidak sengaja di spreadsheet
        value: row[0]?.trim(),
      }))
      .filter((item) => item.label); // Filter agar baris kosong/null tidak masuk ke dropdown

    return { success: true, data: projectNames };
  } catch (error) {
    console.error('Error fetching project names from Sheets:', error);
    // Jika error karena range salah, berikan pesan yang lebih jelas di UI
    if (error.message && error.message.includes('Unable to parse range')) {
      return {
        success: false,
        message: `❌ Error: Nama Sheet tidak ditemukan atau salah format. Pastikan nama tab adalah '${SHEET_NAME}'`,
      };
    }
    return { success: false, message: error.message };
  }
});

/**
 * LOGIKA JIRA CONNECTION TEST (IPC HANDLER)
 */
ipcMain.handle('test-jira-connection', async (event, { email, token }) => {
  try {
    // SESUAIKAN: Path menuju data.json berdasarkan struktur kamu
    // Dari src/main/ naik dua kali ke root, lalu masuk ke src/renderer/js/data.json
    const dataPath = path.join(__dirname, '../../src/renderer/js/data.json');

    if (!fs.existsSync(dataPath)) {
      return {
        success: false,
        message: `❌ File tidak ditemukan di: ${dataPath}`,
      };
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const baseUrl = data.JIRA_BASE_URL;

    if (!baseUrl) {
      return {
        success: false,
        message: '❌ JIRA_BASE_URL tidak ada di data.json',
      };
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
        return {
          success: false,
          message: `❌ File tidak ditemukan di: ${dataPath}`,
        };
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

      const baseUrl = data.JIRA_BASE_URL;

      if (!baseUrl) {
        return {
          success: false,
          message: '❌ JIRA_BASE_URL tidak ada di data.json',
        };
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

      return {
        success: true,
        count: countData.count,
      };
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
