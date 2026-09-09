# Panduan Keamanan Kredensial untuk Electron Portable App

Membangun aplikasi **Electron Portable** (`.exe` yang bisa langsung dijalankan tanpa install) memiliki tantangan keamanan tersendiri.

**⚠️ FAKTA PENTING TENTANG ELECTRON:**
Secara default, Electron membungkus kode Anda dalam file bernama `app.asar`. File ini **bukanlah enkripsi**, melainkan hanya arsip (seperti `.zip`). Siapapun bisa mengekstrak `app.asar` dan membaca semua file di dalamnya, termasuk `credentials.json` atau `.env` Anda.

Jika Private Key Google Service Account Anda bocor, orang lain bisa mengakses atau menghapus Google Sheets Anda.

Untuk mengatasi ini, ada **2 Pendekatan**:

1. **Pendekatan Ideal (100% Aman):** Membuat API penengah (Backend). Electron tidak menyimpan kunci sama sekali.
2. **Pendekatan Praktis (Client-Side Obfuscation):** Menyembunyikan kunci di dalam kode yang sudah disandikan (diacak) agar sangat sulit dibaca manusia.

Karena Anda ingin membuat aplikasi portable yang mandiri, kita akan menggunakan **Pendekatan ke-2 (Obfuscation + Variabel di memori)**.

---

## Langkah 1: Mengubah Kredensial File menjadi Objek di Kode

Google API memungkinkan kita login menggunakan objek langsung, tanpa perlu membaca file `credentials.json`.

Buka file `credentials.json` Anda. Anda hanya membutuhkan 2 data dari sana:

1. `client_email`
2. `private_key`

Ubah inisialisasi auth di `main.js` Anda menjadi seperti ini:

```javascript
// main.js (Versi Baru)
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { google } = require("googleapis");

// 1. Simpan rahasia dalam variabel string
const GOOGLE_CLIENT_EMAIL = "nama-bot@project-anda.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\nMIIEv...\n...s=\n-----END PRIVATE KEY-----\n";

// 2. Gunakan properti 'credentials' alih-alih 'keyFile'
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// ... (sisa kode getDropdownData dan createWindow sama seperti sebelumnya) ...
```

---

## Langkah 2: Mengacak Kode (Obfuscation)

Karena kunci sekarang ada di dalam `main.js`, kita harus mengacak (obfuscate) file `main.js` tersebut sebelum di-build (di-package) menjadi aplikasi portable.

Kita akan menggunakan package bernama `javascript-obfuscator`.

### 2.1. Install dependencies untuk Build & Keamanan

Buka terminal dan jalankan:

```bash
npm install --save-dev javascript-obfuscator electron-builder
```

### 2.2. Buat Script Build Khusus

Buat file baru bernama `build-script.js` di root folder (sejajar dengan `main.js`):

```javascript
// build-script.js
const fs = require("fs");
const JavaScriptObfuscator = require("javascript-obfuscator");

console.log("1. Memulai proses obfuscation main.js...");

// Baca isi main.js
const code = fs.readFileSync("./main.js", "utf8");

// Acak kodenya
const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  numbersToExpressions: true,
  simplify: true,
  stringArrayShuffle: true,
  splitStrings: true,
  stringArrayThreshold: 1,
});

// Simpan hasilnya ke file baru: main-obfuscated.js
fs.writeFileSync("./main-obfuscated.js", obfuscationResult.getObfuscatedCode());

console.log("2. Obfuscation selesai. File main-obfuscated.js berhasil dibuat.");
```

---

## Langkah 3: Konfigurasi Electron Builder untuk Aplikasi Portable

Sekarang kita atur `package.json` agar membungkus aplikasi menggunakan file yang sudah diacak (`main-obfuscated.js`), dan menghasilkan output Portable.

Buka `package.json` dan edit menjadi seperti ini:

```json
{
  "name": "electron-sheets-demo",
  "version": "1.0.0",
  "description": "Demo Aplikasi Portable dengan Keamanan Ekstra",
  "main": "main-obfuscated.js",
  "scripts": {
    "start": "electron main.js",
    "prebuild": "node build-script.js",
    "build": "electron-builder --win portable"
  },
  "dependencies": {
    "googleapis": "^140.0.0"
  },
  "devDependencies": {
    "electron": "^31.0.0",
    "electron-builder": "^24.13.3",
    "javascript-obfuscator": "^4.1.0"
  },
  "build": {
    "appId": "com.perusahaananda.appdemo",
    "productName": "Aplikasi Data Klien",
    "files": [
      "main-obfuscated.js",
      "preload.js",
      "index.html",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["portable"]
    },
    "portable": {
      "artifactName": "${productName} Portable.${ext}"
    }
  }
}
```

**Penjelasan penting dari package.json di atas:**

1. `"main": "main-obfuscated.js"`: Memberitahu Electron untuk menggunakan file yang sudah diacak.
2. `"prebuild": "node build-script.js"`: Script ini akan otomatis dijalankan _sebelum_ proses build dimulai, sehingga file acak selalu _up-to-date_.
3. Array `"files"`: **KITA TIDAK MEMASUKKAN** `main.js` asli atau `credentials.json` ke dalam package. Hanya file yang sudah diacak dan file pendukung yang dimasukkan.

---

## Langkah 4: Proses Build

1. Pastikan Anda sudah tidak menggunakan file `credentials.json` lagi dan sudah memindahkannya (atau menghapusnya dari folder project) agar aman.
2. Buka terminal, jalankan perintah ini:
   ```bash
   npm run build
   ```
3. Tunggu prosesnya selesai.
4. Buka folder baru bernama **`dist`** yang baru saja muncul di folder project Anda.
5. Anda akan menemukan file berekstensi `.exe` (misalnya: `Aplikasi Data Klien Portable.exe`).

🎉 **Selesai!** Anda bisa meng-copy file `.exe` tersebut ke flashdisk atau mengirimnya ke komputer lain. Aplikasi bisa langsung diklik ganda dan dijalankan tanpa perlu instalasi, dan Private Key Google Anda tersimpan dengan aman (teracak) di dalam kode biner aplikasi.
