# Panduan Lengkap: Integrasi Google Sheets dan Electron (Service Account)

Panduan ini akan menuntun Anda dari nol untuk membuat aplikasi desktop menggunakan **Electron** yang dapat membaca data dari **Google Sheets**. Kita akan menggunakan metode **Service Account**, sehingga aplikasi dapat berjalan otomatis _tanpa perlu login akun Google (OAuth)_ dari sisi pengguna.

---

## 📋 Persyaratan Sistem

Sebelum memulai, pastikan Anda telah memiliki:

1. Akun Google aktif (untuk mengakses Google Cloud dan Google Sheets).
2. **Node.js** terinstal di komputer Anda. Cek dengan menjalankan `node -v` dan `npm -v` di terminal.
3. Code Editor (contoh: Visual Studio Code).

---

## 🚀 Langkah 1: Pengaturan di Google Cloud Console

Langkah ini bertujuan untuk membuat "Akun Bot" (Service Account) yang akan mewakili aplikasi Anda untuk mengambil data.

### 1.1. Membuat Project Baru

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login menggunakan akun Google Anda.
3. Di pojok kiri atas (sebelah logo Google Cloud), klik **Dropdown Project** lalu klik tombol **New Project**.
4. Beri nama project Anda (misalnya: `Electron Sheets Demo`), lalu klik **Create**.
5. Tunggu beberapa saat, lalu pastikan project yang baru dibuat sudah **terpilih** di dropdown atas.

### 1.2. Mengaktifkan Google Sheets API

1. Buka menu navigasi (garis tiga di kiri atas) > **APIs & Services** > **Library**.
2. Pada kolom pencarian, ketik **Google Sheets API**.
3. Klik hasil pencariannya, lalu klik tombol biru **Enable**.

### 1.3. Membuat Service Account

1. Setelah API aktif, buka menu navigasi > **APIs & Services** > **Credentials**.
2. Di bagian atas, klik **+ CREATE CREDENTIALS** lalu pilih **Service account**.
3. Isi **Service account name** (misal: `electron-bot`). Bagian _Service account ID_ akan terisi otomatis.
4. Klik **Create and Continue**.
5. (Opsional) Pada bagian _Grant this service account access to project_, Anda bisa melewatinya. Klik **Continue**, lalu klik **Done**.

### 1.4. Mengunduh Kunci JSON (credentials.json)

1. Anda akan kembali ke halaman **Credentials**. Di bagian paling bawah, temukan Service Account yang baru saja Anda buat.
2. Salin (copy) **alamat email** Service Account tersebut (formatnya mirip: `nama-bot@nama-project.iam.gserviceaccount.com`). _Simpan email ini, kita akan membutuhkannya di Langkah 2._
3. Klik pada baris email Service Account tersebut untuk masuk ke detailnya.
4. Pindah ke tab **KEYS**.
5. Klik **Add Key** > **Create new key**.
6. Pilih format **JSON**, lalu klik **Create**.
7. File `.json` akan otomatis terunduh ke komputer Anda. Ubah nama file tersebut menjadi **`credentials.json`**.

---

## 📊 Langkah 2: Persiapan Data di Google Sheets

Sekarang kita akan membuat datanya dan memberikan akses kepada "Akun Bot" yang sudah dibuat.

1. Buka [Google Sheets](https://docs.google.com/spreadsheets).
2. Buat Spreadsheet baru (Blank). Beri nama, misalnya `Data Karyawan`.
3. Pada sheet pertama (`Sheet1`), isi data berikut pada kolom A:
   - **A1:** Nama Perusahaan
   - **A2:** PT. Teknologi Maju
   - **A3:** CV. Berkah Sentosa
   - **A4:** Makmur Jaya Abadi
4. Klik tombol hijau **Share** (Bagikan) di pojok kanan atas.
5. Pada kolom "Add people and groups", **paste alamat email Service Account** yang Anda salin di Langkah 1.4.
6. Pastikan perannya adalah **Viewer** (Pelihat), hilangkan centang _Notify people_ jika ada, lalu klik **Share** (atau _Share anyway_ jika ada peringatan domain eksternal).
7. Perhatikan **URL** di browser Anda. Salin **Spreadsheet ID**-nya.
   - Format URL: `https://docs.google.com/spreadsheets/d/`**`[SPREADSHEET_ID]`**`/edit...`
   - Contoh: Jika URL-nya `https://docs.google.com/spreadsheets/d/1BxiMVs0X_xyz_123/edit`, maka ID-nya adalah `1BxiMVs0X_xyz_123`.

---

## 💻 Langkah 3: Membuat Project Electron

Buka terminal/Command Prompt, lalu ikuti perintah berikut secara berurutan:

### 3.1. Inisialisasi Project

```bash
# Buat folder baru untuk project
mkdir electron-sheets-demo
cd electron-sheets-demo

# Inisialisasi project Node.js (tekan enter terus sampai selesai)
npm init -y

# Install dependensi yang dibutuhkan (Electron dan Google API)
npm install electron googleapis
```

### 3.2. Struktur File

Buatlah file-file berikut di dalam folder `electron-sheets-demo` Anda. Pindahkan juga file **`credentials.json`** yang diunduh tadi ke dalam folder ini.

Struktur folder harus terlihat seperti ini:

```text
electron-sheets-demo/
│
├── node_modules/
├── package.json
├── package-lock.json
├── credentials.json      <-- (File dari Google Cloud)
├── main.js               <-- (Buat file ini)
├── preload.js            <-- (Buat file ini)
└── index.html            <-- (Buat file ini)
```

---

## 📝 Langkah 4: Menulis Kode

Buka folder project di Code Editor Anda, lalu isi file-file berikut:

### 1. `main.js` (Proses Utama / Backend)

> **PENTING:** Ganti `ISI_DENGAN_SPREADSHEET_ID_ANDA` dengan ID yang didapat pada Langkah 2.

```javascript
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { google } = require("googleapis");

// Inisialisasi Autentikasi Google menggunakan kredensial Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

async function getDropdownData() {
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    // GANTI ID DI BAWAH INI SESUAI SPREADSHEET ANDA
    spreadsheetId: "ISI_DENGAN_SPREADSHEET_ID_ANDA",
    range: "Sheet1!A2:A", // Mengambil data di Sheet1 dari cell A2 ke bawah
  });
  return response.data.values ? response.data.values.flat() : [];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Keamanan wajib aktif
      nodeIntegration: false,
    },
  });

  // Hilangkan menu default jika tidak perlu
  win.setMenu(null);
  win.loadFile("index.html");
}

app.whenReady().then(() => {
  // Mendengarkan permintaan data dari Frontend (HTML)
  ipcMain.handle("fetch-sheet-data", async () => {
    try {
      console.log("Mengambil data dari Google Sheets...");
      return await getDropdownData();
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      return [];
    }
  });

  createWindow();
});

// Menutup aplikasi jika semua jendela ditutup (kecuali di macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

### 2. `preload.js` (Jembatan Keamanan)

```javascript
const { contextBridge, ipcRenderer } = require("electron");

// Mengekspos fungsi yang aman ke antarmuka web (Renderer)
contextBridge.exposeInMainWorld("api", {
  getDropdownData: () => ipcRenderer.invoke("fetch-sheet-data"),
});
```

### 3. `index.html` (Antarmuka Pengguna)

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <title>Integrasi Electron & Google Sheets</title>
    <style>
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        padding: 30px;
        background-color: #f4f7f6;
        color: #333;
      }
      .container {
        background: white;
        padding: 20px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        margin: auto;
      }
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
      }
      select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
      }
      .status {
        margin-top: 15px;
        font-size: 14px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Pilih Klien Perusahaan</h2>
      <label for="company-data">Daftar Klien (Live dari Sheets):</label>
      <select id="company-data" disabled>
        <option value="">⏳ Sedang memuat data...</option>
      </select>
      <div id="status-text" class="status">
        Menyambungkan ke Google Sheets...
      </div>
    </div>

    <script>
      async function loadDropdown() {
        const selectElement = document.getElementById("company-data");
        const statusText = document.getElementById("status-text");

        try {
          // Memanggil API yang diekspos melalui preload.js
          const data = await window.api.getDropdownData();

          selectElement.innerHTML =
            '<option value="">-- Pilih Perusahaan --</option>';

          if (data.length === 0) {
            statusText.innerHTML = "⚠️ Data kosong atau gagal diakses.";
            return;
          }

          // Loop data dan masukkan ke dalam Dropdown
          data.forEach((item) => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
          });

          // Aktifkan dropdown setelah data terisi
          selectElement.disabled = false;
          statusText.innerHTML = `✅ Berhasil memuat ${data.length} data.`;
        } catch (error) {
          statusText.innerHTML = "❌ Terjadi kesalahan saat memuat data.";
          console.error(error);
        }
      }

      // Jalankan fungsi saat halaman dimuat
      loadDropdown();
    </script>
  </body>
</html>
```

### 4. Konfigurasi `package.json`

Buka file `package.json` Anda. Pastikan pada bagian `main` terisi dengan `main.js`. Lalu, tambahkan _script_ `"start"` untuk menjalankan electron:

```json
{
  "name": "electron-sheets-demo",
  "version": "1.0.0",
  "description": "",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron": "^X.X.X",
    "googleapis": "^X.X.X"
  }
}
```

---

## 🏃 Langkah 5: Menjalankan Aplikasi

1. Buka kembali terminal Anda.
2. Pastikan Anda berada di direktori project (`electron-sheets-demo`).
3. Jalankan perintah berikut:
   ```bash
   npm start
   ```
4. Aplikasi Desktop Anda akan terbuka. Jika pengaturan benar, Anda akan melihat dropdown "Pilih Klien Perusahaan" otomatis terisi dengan data yang Anda tulis di Google Sheets!

### 💡 Tips Keamanan (Catatan Penting)

- **JANGAN** pernah mengunggah file `credentials.json` ke repository publik seperti GitHub. Jika Anda menggunakan Git, masukkan `credentials.json` ke dalam file `.gitignore`.
- Saat Anda akan melakukan _packaging_ aplikasi ini (membungkusnya menjadi `.exe` atau `.dmg`), file kredensial JSON sebaiknya tidak dibiarkan dalam bentuk _plaintext_ (teks biasa) di dalam folder build. Pertimbangkan untuk menggunakan _Environment Variables_ (.env) atau sistem enkripsi tambahan.
