/**
 * theme-toggle.js
 * THEME TOGGLE MODULE - ADVANCED OBSERVABILITY VERSION
 *
 * TUJUAN UTAMA:
 * Mengelola fitur "Dark Mode" (Mode Gelap) dan "Light Mode" (Mode Terang).
 * Fitur ini memiliki "memori" agar pilihan user tetap tersimpan meskipun halaman di-refresh,
 * serta menggunakan animasi transisi yang sangat halus saat warna berubah.
 */

// --- TAHAP 1: LOADED (Konfirmasi file berhasil dimuat) ---
console.log('%c[System] Theme Module: File Loaded ✅', 'color: #4caf50; font-weight: bold;');

// Mengambil elemen-elemen yang dibutuhkan dari HTML
const themeToggle = document.getElementById('theme-toggle'); // Tombol switch
const themeIcon = document.getElementById('theme-icon'); // Ikon (Matahari/Bulan)
const htmlElement = document.documentElement; // Elemen utama <html> (Saklar Utama)

/**
 * FUNGSI: updateIcon
 * Kegunaan: Mengubah gambar ikon sesuai tema yang aktif.
 * @param {string} theme - 'dark' atau 'light'
 */
function updateIcon(theme) {
  // Guard clause: Jika elemen ikon tidak ada di HTML, jangan paksa jalan agar tidak error
  if (!themeIcon) {
    console.warn('[Warning] theme-icon not found in DOM.');
    return;
  }

  // Jika tema gelap, tampilkan bulan (🌙), jika terang tampilkan matahari (☀️)
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

/**
 * FUNGSI: applyTheme
 * Kegunaan: Inti dari perubahan tampilan. Melakukan semua aksi perubahan tema.
 * @param {string} theme - Tema yang ingin diterapkan ('dark' atau 'light')
 */
function applyTheme(theme) {
  console.log(
    `%c[Action] Applying theme: ${theme.toUpperCase()} ✨`,
    'color: #8b5cf6; font-weight: bold;'
  );

  /**
   * SUB-FUNGSI: commit
   * Kegunaan: Menjalankan instruksi perubahan secara nyata di layar.
   */
  const commit = () => {
    // 1. Mengubah atribut 'data-theme' pada HTML (Ini yang dibaca oleh CSS untuk ganti warna)
    htmlElement.setAttribute('data-theme', theme);

    // 2. Menyimpan pilihan ke "Memori Browser" (LocalStorage) agar tidak hilang saat refresh
    localStorage.setItem('user-theme', theme);

    // 3. Mengupdate ikon visual
    updateIcon(theme);

    // 4. Aksesibilitas: Memberi tahu pengguna tunanetra (pengguna screen reader)
    // tentang apa yang akan terjadi jika tombol diklik selanjutnya.
    if (themeToggle) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    }
  };

  // Mengecek apakah pengguna memiliki preferensi "mengurangi gerakan" (untuk kesehatan/kenyamanan)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * TEKNOLOGI MODERN: View Transitions API
   * Jika browser mendukung, kita menggunakan transisi otomatis yang sangat mulus (seperti crossfade).
   * Ini jauh lebih ringan bagi performa perangkat dibandingkan animasi CSS manual.
   */
  if (document.startViewTransition && !prefersReducedMotion) {
    // Jalankan transisi halus
    document.startViewTransition(commit);
  } else {
    // Jika browser lama atau user minta gerakan dikurangi, langsung ganti tanpa animasi
    commit();
  }
}

// --- TAHAP 2: INITIALIZATION SEQUENCE (Proses persiapan saat pertama kali buka web) ---
function initTheme() {
  console.log(
    '%c[System] Theme Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    // LANGKAH A: CEK MEMORI (LocalStorage)
    // Kita cek dulu, apakah sebelumnya user pernah memilih tema tertentu?
    console.log('[Debug] Step 1: Checking localStorage for saved preference...');
    const savedTheme = localStorage.getItem('user-theme');

    // Validasi apakah data yang tersimpan benar-benar format yang kita kenal ('light'/'dark')
    const isSavedValid = savedTheme === 'light' || savedTheme === 'dark';

    if (isSavedValid) {
      console.log(`[Debug] Step 1: Found saved theme in storage: ${savedTheme}`);
    } else {
      console.log('[Debug] Step 1: No valid saved theme found. Using default.');
    }

    // LANGKAH B: TENTUKAN TEMA AKHIR
    console.log('[Debug] Step 2: Determining final theme to apply...');

    // Jika tidak ada memori, kita ambil tema yang tertulis di HTML sebagai cadangan (fallback)
    const rawDefaultTheme = htmlElement.getAttribute('data-theme');
    const isDefaultValid = rawDefaultTheme === 'light' || rawDefaultTheme === 'dark';
    const defaultTheme = isDefaultValid ? rawDefaultTheme : 'dark';

    // Prioritas: Gunakan memori user > Jika tidak ada, gunakan tema bawaan HTML
    const themeToApply = isSavedValid ? savedTheme : defaultTheme;

    // LANGKAH C: EKSEKUSI
    applyTheme(themeToApply);

    console.log(
      '%c[System] Theme Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    console.error(
      '%c[Error] Theme Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
}

// --- TAHAP 3: INTERACTION (Menangani klik tombol oleh user) ---
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    console.log('%c[User Interaction] Button Clicked! 🖱️', 'color: #f59e0b; font-weight: bold;');

    // Ambil tema yang sedang aktif saat ini, lalu balikkan (jika gelap ke terang, dst)
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme);
  });
} else {
  console.warn('[Warning] Theme Toggle button not found in DOM.');
}

// Jalankan proses inisialisasi agar tema langsung terpasang saat halaman dibuka
initTheme();
