/**
 * jira-api.js
 * JIRA API INTERFACE MODULE
 *
 * TUJUAN UTAMA:
 * Mengelola interaksi pengguna saat mencoba menghubungkan aplikasi ke Jira.
 * Skrip ini mengambil email dan token dari form, mengirimkannya ke mesin penguji (qaToolkit),
 * dan menampilkan pesan sukses atau gagal kepada pengguna di layar.
 */

// Konstanta untuk parsing fallback pesan sukses dari backend lama.
// Idealnya backend selalu mengirim `result.username` secara terstruktur,
// dan fallback string-parsing ini bisa dihapus di masa depan.
const LEGACY_USERNAME_MARKER = 'as: ';

// Daftar host Jira yang dipercaya untuk menampilkan avatar.
// Catatan: ini adalah defense-in-depth di sisi UI (mencegah <img> menunjuk ke domain asing
// jika `avatarUrl` pada respons pernah termodifikasi/di-tamper), BUKAN batas keamanan utama.
// Validasi/keamanan data yang sesungguhnya tetap harus dilakukan di service/main process
// sebelum data dikirim ke renderer.
// Avatar Jira/Atlassian disajikan lewat CDN `atl-paas.net`
// (contoh: avatar-management--avatars.us-west-2.prod.public.atl-paas.net),
// jadi `atlassian.com`/`atlassian.net` disertakan berjaga-jaga untuk kasus lain,
// sedangkan `atl-paas.net` yang dipakai untuk avatar saat ini.
const ALLOWED_AVATAR_HOSTS = ['atlassian.com', 'atlassian.net', 'atl-paas.net'];

// Regex validasi email sederhana (bukan RFC lengkap, cukup untuk menyaring typo umum).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Menunggu sampai seluruh struktur halaman HTML selesai dimuat agar elemen bisa ditemukan
document.addEventListener('DOMContentLoaded', () => {
  // --- REFERENSI ELEMEN (Mengambil elemen yang ada di HTML) ---
  const jiraForm = document.getElementById('jira-settings-form');
  const emailInput = document.getElementById('jira-email');
  const tokenInput = document.getElementById('jira-api-token');
  const testBtn = document.querySelector('[data-action="test-jira"]');
  const statusDiv = document.getElementById('jira-status');
  const userDisplay = document.getElementById('jira-connected-user');
  const avatarImg = document.getElementById('jira-avatar');

  // --- GUARD: Pastikan semua required DOM element tersedia ---
  // Jika ada yang hilang, hentikan initialization agar tidak error di tengah jalan.
  const requiredElements = {
    'jira-settings-form': jiraForm,
    'jira-email': emailInput,
    'jira-api-token': tokenInput,
    '[data-action="test-jira"]': testBtn,
    'jira-status': statusDiv,
    'jira-connected-user': userDisplay,
    'jira-avatar': avatarImg,
  };

  const missing = Object.entries(requiredElements)
    .filter(([, el]) => !el)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `[jira-api] DOM element(s) tidak ditemukan: ${missing.join(', ')}. Module tidak diinisialisasi.`
    );
    return;
  }
  console.info('[jira-api] 🚀 Module initialized.');

  // --- HELPER: Ubah state status (success/error/loading) tanpa menghapus class lain ---
  const STATUS_CLASSES = ['success', 'error', 'loading'];
  function setStatus(state, message) {
    STATUS_CLASSES.forEach((cls) => statusDiv.classList.remove(cls));
    statusDiv.classList.add(state);
    statusDiv.textContent = message;
  }

  // --- HELPER: Reset informasi connected user (username + avatar) ---
  function resetConnectedUser() {
    userDisplay.textContent = '-';
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
  }

  // --- HELPER: Sembunyikan avatar sekaligus pastikan tidak ada src lama yang tertinggal ---
  // Dipakai setiap kali avatar tidak tersedia atau tidak lolos validasi trusted host,
  // supaya tidak ada stale avatar URL yang nyangkut di DOM dari percobaan sebelumnya.
  function clearAvatar() {
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
  }

  // --- HELPER: Validasi format email secara ringan di sisi client ---
  // Tidak menggantikan validasi server-side, hanya menangkap typo umum lebih awal
  // supaya user tidak menunggu round-trip network untuk error yang jelas.
  function isValidEmail(value) {
    return EMAIL_REGEX.test(value);
  }

  // --- HELPER: Ekstrak username dari hasil response, dengan fallback yang di-log ---
  function extractUsername(result) {
    if (result.username) {
      return result.username;
    }

    // Fallback lama: parsing dari string pesan. Rapuh terhadap perubahan format,
    // jadi kita log warning supaya ketahuan kalau backend belum pernah diupdate
    // untuk mengirim field `username` secara terstruktur.
    if (result.message && result.message.includes(LEGACY_USERNAME_MARKER)) {
      console.warn(
        '[jira-api] `result.username` tidak ada, menggunakan fallback parsing dari `result.message`. ' +
          'Pertimbangkan update backend untuk selalu mengirim field `username`.'
      );
      // .trim() supaya whitespace sisa (misal spasi/newline di akhir pesan) tidak ikut terbawa.
      return result.message.split(LEGACY_USERNAME_MARKER)[1].trim();
    }

    return null;
  }

  // --- HELPER: Validasi bahwa avatarUrl berasal dari host Jira yang dipercaya ---
  // Ini defense-in-depth di UI, bukan pengganti validasi data di service/main process.
  function isTrustedAvatarUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      return ALLOWED_AVATAR_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
    } catch {
      // URL tidak valid/parseable
      return false;
    }
  }

  // --- EVENT: submit pada form sebagai trigger utama untuk Test Connection ---
  jiraForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah page reload saat form di-submit

    const email = emailInput.value.trim(); // .trim() menghilangkan spasi di depan/belakang input
    const token = tokenInput.value;

    // --- VALIDASI INPUT ---
    if (!email || !token) {
      setStatus('error', '⚠️ Please fill in both Email and Token');
      return;
    }

    // Validasi format email ringan di sisi client, sebelum kirim request.
    if (!isValidEmail(email)) {
      setStatus('error', '⚠️ Please enter a valid email address');
      return;
    }

    // --- GUARD: Pastikan qaToolkit sudah tersedia di halaman ---
    // `qaToolkit` diekspos ke renderer melalui preload script via `contextBridge`
    // (arsitektur Electron dengan context isolation). Guard ini menangani kasus
    // ketika preload gagal mengekspos API tersebut (mis. preload error, contextBridge
    // belum sempat expose saat script ini jalan, atau versi preload tidak cocok),
    // sehingga error-nya jelas bagi user alih-alih "Cannot read properties of undefined".
    if (!window.qaToolkit || typeof window.qaToolkit.testJiraConnection !== 'function') {
      setStatus('error', '❌ Service not available. Please refresh the page.');
      console.error('[jira-api] window.qaToolkit tidak tersedia.');
      return;
    }

    // --- RESET VISUAL STATE ---
    // Tampilkan status loading, nonaktifkan tombol agar user tidak klik berulang
    setStatus('loading', '⏳ Testing connection...');
    testBtn.disabled = true;

    try {
      // Kirim email & token ke qaToolkit untuk diuji koneksinya ke Jira
      const result = await window.qaToolkit.testJiraConnection({ email, token });

      // --- VALIDASI RESPONSE ---
      // Pastikan `result` benar-benar object sebelum membaca `result.success`.
      // Response yang bukan object (undefined, null, string, dll) berarti ada masalah
      // di sisi service/preload, bukan berarti credential pasti salah — jadi ini
      // diperlakukan sebagai internal/service error, bukan connection failure biasa.
      if (!result || typeof result !== 'object') {
        setStatus('error', '❌ Unexpected response from service. Please try again.');
        console.error('[jira-api] Response tidak valid dari qaToolkit.testJiraConnection.');
        resetConnectedUser();
        return;
      }

      if (result.success) {
        // === KONEKSI SUKSES ===
        setStatus('success', '✅ Connected');

        // Tampilkan nama user (lihat helper extractUsername untuk detail fallback)
        const username = extractUsername(result);
        userDisplay.textContent = username || '-';

        // Tampilkan avatar hanya jika URL-nya ada DAN berasal dari host yang dipercaya
        if (result.avatarUrl && isTrustedAvatarUrl(result.avatarUrl)) {
          avatarImg.src = result.avatarUrl;
          avatarImg.style.display = 'block'; // Munculkan gambar
        } else {
          if (result.avatarUrl) {
            console.warn('[jira-api] avatarUrl diabaikan karena bukan dari host yang dipercaya.');
          }
          // Hapus src lama (jika ada) sebelum disembunyikan, supaya tidak ada
          // stale avatar URL yang tertinggal di DOM dari percobaan sebelumnya.
          clearAvatar();
        }
      } else {
        // === KONEKSI GAGAL (respons dari server) ===
        setStatus(
          'error',
          result.message || '❌ Connection failed. Please check your credentials.'
        );
        resetConnectedUser();
      }
    } catch (err) {
      // === ERROR TAK TERDUGA (jaringan putus, CORS, bug di qaToolkit, dll) ===
      setStatus('error', '❌ Connection failed. Check your token or network connection.');
      // Logging konservatif: hanya catat nama/tipe error, bukan `err.message` atau
      // objek `err` secara utuh. `err.message` tidak selalu aman untuk di-log —
      // beberapa error (mis. dari lapisan network/IPC) bisa saja menyertakan
      // detail request di dalam message-nya. Ini cukup untuk debugging tanpa
      // berisiko mencetak request payload atau credential ke console/log service.
      const errorName = (err && err.name) || 'UnknownError';
      console.error('[jira-api] Test connection error:', errorName);
      resetConnectedUser();
    } finally {
      // Selalu aktifkan kembali tombol, apapun hasil sebelumnya
      testBtn.disabled = false;
    }
  });
});
