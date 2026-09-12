/**
 * build-script.js
 *
 * BUILD SECURITY SCRIPT - QA WORK TOOLKIT
 *
 * TUJUAN UTAMA:
 * 1. Membaca Google Service Account credential dari file .env.
 * 2. Membaca source asli dari src/main/main.js.
 * 3. Menyisipkan credential ke source khusus production.
 * 4. Melakukan obfuscation terhadap source production.
 * 5. Menghasilkan src/main/main-obfuscated.js.
 *
 * CATATAN KEAMANAN:
 * - File .env tidak dimasukkan ke aplikasi portable.
 * - File src/main/main.js asli tidak dimasukkan ke aplikasi portable.
 * - Credential hanya dimasukkan ke main-obfuscated.js saat proses build.
 * - main-obfuscated.js harus dimasukkan ke .gitignore.
 * - Obfuscation mempersulit pembacaan credential, tetapi bukan enkripsi.
 */

// Module bawaan Node.js untuk membaca dan menulis file.
const fs = require('fs');

// Module bawaan Node.js untuk membuat path yang aman lintas sistem operasi.
const path = require('path');

// Package yang digunakan untuk melakukan JavaScript obfuscation.
const JavaScriptObfuscator = require('javascript-obfuscator');

// Package dotenv digunakan hanya saat proses build untuk membaca file .env.
const dotenv = require('dotenv');

/**
 * ============================================================
 * PATH CONFIGURATION
 * ============================================================
 */

// Root project adalah folder tempat build-script.js berada.
const ROOT_DIR = __dirname;

// Path menuju file .env yang menyimpan Service Account credential.
const ENV_FILE = path.join(ROOT_DIR, '.env');

// Source asli Electron Main Process.
// File ini tetap bersih dan tidak berisi credential secara langsung.
const SOURCE_FILE = path.join(ROOT_DIR, 'src', 'main', 'main.js');

// File production hasil obfuscation.
// File inilah yang digunakan sebagai entry point Electron ketika release.
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'main', 'main-obfuscated.js');

/**
 * ============================================================
 * HELPER
 * ============================================================
 */

/**
 * Menghentikan proses build dengan pesan error.
 *
 * @param {string} message Pesan error yang akan ditampilkan.
 */
function failBuild(message) {
  console.error('');
  console.error('❌ [Build Security] BUILD FAILED');
  console.error(`❌ ${message}`);
  console.error('');

  process.exit(1);
}

/**
 * ============================================================
 * BUILD PROCESS
 * ============================================================
 */

console.log('');
console.log('============================================================');
console.log(' QA Work Toolkit - Secure Production Build');
console.log('============================================================');
console.log('');

/**
 * STEP 1
 *
 * Pastikan file .env tersedia.
 *
 * Build portable membutuhkan credential Service Account dari
 * file tersebut sebelum proses obfuscation dilakukan.
 */
console.log('[1/6] Checking .env file...');

if (!fs.existsSync(ENV_FILE)) {
  failBuild(`File .env tidak ditemukan di: ${ENV_FILE}`);
}

console.log('      ✓ .env ditemukan.');

/**
 * STEP 2
 *
 * Load isi .env secara eksplisit dari root project.
 */
console.log('[2/6] Loading build credentials...');

const envResult = dotenv.config({
  path: ENV_FILE,
});

/**
 * Jika dotenv gagal membaca file, hentikan build.
 */
if (envResult.error) {
  failBuild(`Gagal membaca .env: ${envResult.error.message}`);
}

/**
 * Ambil Google Service Account credential.
 *
 * Credential ini hanya tersedia selama proses build berjalan.
 */
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

const OPEN_WEBUI_URL = process.env.OPEN_WEBUI_URL;

/**
 * Validasi credential.
 *
 * Build tidak boleh dilanjutkan apabila salah satu credential
 * belum tersedia.
 */
if (!GOOGLE_CLIENT_EMAIL) {
  failBuild('GOOGLE_CLIENT_EMAIL tidak ditemukan di file .env.');
}

if (!GOOGLE_PRIVATE_KEY) {
  failBuild('GOOGLE_PRIVATE_KEY tidak ditemukan di file .env.');
}

if (!GOOGLE_SPREADSHEET_ID) {
  failBuild('GOOGLE_SPREADSHEET_ID tidak ditemukan di file .env.');
}

if (!OPEN_WEBUI_URL) {
  failBuild('OPEN_WEBUI_URL tidak ditemukan di file .env.');
}

console.log('      ✓ GOOGLE_CLIENT_EMAIL ditemukan.');
console.log('      ✓ GOOGLE_PRIVATE_KEY ditemukan.');
console.log('      ✓ GOOGLE_SPREADSHEET_ID ditemukan.');
console.log('      ✓ OPEN_WEBUI_URL ditemukan.');

/**
 * Jangan pernah mencetak nilai credential ke terminal.
 *
 * Contoh yang TIDAK BOLEH dilakukan:
 *
 * console.log(GOOGLE_PRIVATE_KEY);
 *
 * karena output terminal dapat tersimpan di log atau screenshot.
 */

/**
 * STEP 3
 *
 * Pastikan source main.js tersedia.
 */
console.log('[3/6] Reading Electron main process...');

if (!fs.existsSync(SOURCE_FILE)) {
  failBuild(`Source main.js tidak ditemukan di: ${SOURCE_FILE}`);
}

/**
 * Baca seluruh source main.js sebagai string.
 */
let mainSource;

try {
  mainSource = fs.readFileSync(SOURCE_FILE, 'utf8');
} catch (error) {
  failBuild(`Gagal membaca main.js: ${error.message}`);
}

if (!mainSource.trim()) {
  failBuild('main.js kosong. Build dibatalkan.');
}

console.log('      ✓ src/main/main.js berhasil dibaca.');

/**
 * STEP 4
 *
 * Hapus main-obfuscated.js lama jika masih ada.
 *
 * Tujuannya agar file hasil build lama tidak tertukar dengan
 * hasil build terbaru.
 */
console.log('[4/6] Preparing production source...');

if (fs.existsSync(OUTPUT_FILE)) {
  try {
    fs.unlinkSync(OUTPUT_FILE);

    console.log('      ✓ main-obfuscated.js lama dihapus.');
  } catch (error) {
    failBuild(`Gagal menghapus main-obfuscated.js lama: ${error.message}`);
  }
}

/**
 * Credential production disisipkan sebelum isi main.js.
 *
 * main.js menggunakan:
 *
 * process.env.GOOGLE_CLIENT_EMAIL
 * process.env.GOOGLE_PRIVATE_KEY
 *
 * Saat development:
 *
 * main.js membaca nilai tersebut dari .env melalui dotenv.
 *
 * Saat production:
 *
 * app.isPackaged bernilai true sehingga main.js tidak membaca .env.
 * Nilai process.env di bawah sudah tersedia karena dimasukkan oleh
 * build-script.js sebelum kode main.js dijalankan.
 *
 * JSON.stringify digunakan supaya karakter khusus pada credential,
 * termasuk newline, quote, dan backslash, ditulis sebagai JavaScript
 * string literal yang valid.
 */
const injectedCredentials = `
/**
 * PRODUCTION CONFIGURATION
 *
 * Generated automatically by build-script.js.
 * DO NOT EDIT MANUALLY.
 */
process.env.GOOGLE_CLIENT_EMAIL = ${JSON.stringify(GOOGLE_CLIENT_EMAIL)};
process.env.GOOGLE_PRIVATE_KEY = ${JSON.stringify(GOOGLE_PRIVATE_KEY)};
process.env.GOOGLE_SPREADSHEET_ID = ${JSON.stringify(GOOGLE_SPREADSHEET_ID)};
process.env.OPEN_WEBUI_URL = ${JSON.stringify(OPEN_WEBUI_URL)};

`;

/**
 * Gabungkan credential production dengan source main.js.
 *
 * Perubahan ini hanya terjadi di memori selama build.
 *
 * File src/main/main.js asli TIDAK dimodifikasi.
 */
const productionSource = injectedCredentials + mainSource;

console.log('      ✓ Production source berhasil disiapkan.');

/**
 * STEP 5
 *
 * Lakukan JavaScript obfuscation.
 */
console.log('[5/6] Obfuscating production code...');

let obfuscationResult;

try {
  obfuscationResult = JavaScriptObfuscator.obfuscate(productionSource, {
    /**
     * Menghasilkan kode dalam bentuk compact.
     *
     * Mengurangi whitespace dan membuat hasil production
     * lebih sulit dibaca secara langsung.
     */
    compact: true,

    /**
     * Mengubah struktur control flow kode.
     *
     * Membuat alur program lebih sulit dibaca setelah
     * source diekstrak.
     */
    controlFlowFlattening: true,

    /**
     * 0.75 berarti sekitar 75% node yang memenuhi syarat
     * dapat terkena control flow flattening.
     *
     * Nilai ini cukup agresif tetapi tidak dibuat maksimal
     * untuk menjaga kestabilan aplikasi.
     */
    controlFlowFlatteningThreshold: 0.75,

    /**
     * Mengubah sebagian angka menjadi expression.
     *
     * Contoh konseptual:
     *
     * 10
     *
     * dapat berubah menjadi bentuk expression lain yang
     * menghasilkan nilai yang sama.
     */
    numbersToExpressions: true,

    /**
     * Mengaktifkan optimasi/simplifikasi internal obfuscator.
     */
    simplify: true,

    /**
     * Memindahkan string ke internal string array.
     *
     * Ini penting karena credential Google berupa string.
     */
    stringArray: true,

    /**
     * Mengacak urutan string di dalam string array.
     */
    stringArrayShuffle: true,

    /**
     * Nilai 1 berarti seluruh string yang memenuhi syarat
     * akan dipertimbangkan untuk dipindahkan ke string array.
     */
    stringArrayThreshold: 1,

    /**
     * Memecah string panjang menjadi beberapa bagian.
     *
     * Berguna agar string seperti private key tidak tampil
     * sebagai satu string panjang yang mudah ditemukan.
     */
    splitStrings: true,

    /**
     * Panjang maksimum bagian string hasil split.
     */
    splitStringsChunkLength: 8,

    /**
     * Mengganti nama identifier menjadi format hexadecimal.
     *
     * Contoh konseptual:
     *
     * createGoogleAuth
     *
     * dapat berubah menjadi identifier seperti:
     *
     * _0x12ab34
     */
    identifierNamesGenerator: 'hexadecimal',

    /**
     * Tidak menggunakan debugProtection karena fitur tersebut
     * dapat menyulitkan debugging dan berpotensi menyebabkan
     * masalah kompatibilitas pada beberapa environment Electron.
     */
    debugProtection: false,

    /**
     * Tidak membuat interval anti-debugging.
     */
    debugProtectionInterval: 0,

    /**
     * Tidak menggunakan selfDefending.
     *
     * Tujuannya menjaga hasil build Electron tetap lebih stabil.
     */
    selfDefending: false,
  });
} catch (error) {
  failBuild(`JavaScript obfuscation gagal: ${error.message}`);
}

console.log('      ✓ Obfuscation selesai.');

/**
 * STEP 6
 *
 * Simpan hasil obfuscation menjadi main-obfuscated.js.
 */
console.log('[6/6] Writing production main process...');

try {
  fs.writeFileSync(OUTPUT_FILE, obfuscationResult.getObfuscatedCode(), 'utf8');
} catch (error) {
  failBuild(`Gagal membuat main-obfuscated.js: ${error.message}`);
}

/**
 * Validasi sederhana bahwa file benar-benar berhasil dibuat.
 */
if (!fs.existsSync(OUTPUT_FILE)) {
  failBuild('main-obfuscated.js tidak berhasil dibuat.');
}

/**
 * Pastikan file hasil bukan file kosong.
 */
const outputStats = fs.statSync(OUTPUT_FILE);

if (outputStats.size === 0) {
  failBuild('main-obfuscated.js berhasil dibuat tetapi file kosong.');
}

/**
 * BUILD SUCCESS
 */
console.log('      ✓ src/main/main-obfuscated.js berhasil dibuat.');
console.log('');
console.log('============================================================');
console.log(' ✅ Secure build preparation completed successfully.');
console.log('============================================================');
console.log('');
console.log('Production entry:');
console.log('src/main/main-obfuscated.js');
console.log('');
console.log('Source asli tidak diubah:');
console.log('src/main/main.js');
console.log('');
