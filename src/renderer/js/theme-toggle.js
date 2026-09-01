/**
 * Theme Toggle Module - Advanced Observability Version
 */

// --- TAHAP 1: LOADED (File berhasil masuk ke browser) ---
console.log('%c[System] Theme Module: File Loaded ✅', 'color: #4caf50; font-weight: bold;');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

function updateIcon(theme) {
  // Tambahkan guard untuk themeIcon agar tidak error jika elemen tidak ditemukan
  if (!themeIcon) {
    console.warn('[Warning] theme-icon not found in DOM.');
    return;
  }

  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function applyTheme(theme) {
  // Log saat tema benar-benar diterapkan ke DOM
  console.log(
    `%c[Action] Applying theme: ${theme.toUpperCase()} ✨`,
    'color: #8b5cf6; font-weight: bold;'
  );

  htmlElement.setAttribute('data-theme', theme);
  localStorage.setItem('user-theme', theme);
  updateIcon(theme);

  // Tambahkan accessibility pada tombol theme
  if (themeToggle) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
  }
}

// --- TAHAP 2: INITIALIZATION SEQUENCE ---
function initTheme() {
  console.log(
    '%c[System] Theme Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    // Langkah A: Cek LocalStorage
    console.log('[Debug] Step 1: Checking localStorage for saved preference...');
    const savedTheme = localStorage.getItem('user-theme');

    // Validasi nilai dari localStorage
    const isSavedValid = savedTheme === 'light' || savedTheme === 'dark';

    if (isSavedValid) {
      console.log(`[Debug] Step 1: Found saved theme in storage: ${savedTheme}`);
    } else {
      console.log('[Debug] Step 1: No valid saved theme found. Using default.');
    }

    // Langkah B: Tentukan tema mana yang akan dipakai
    console.log('[Debug] Step 2: Determining final theme to apply...');

    // Validasi nilai data-theme dari HTML
    const rawDefaultTheme = htmlElement.getAttribute('data-theme');
    const isDefaultValid = rawDefaultTheme === 'light' || rawDefaultTheme === 'dark';
    const defaultTheme = isDefaultValid ? rawDefaultTheme : 'dark';

    // Gunakan savedTheme jika valid, jika tidak gunakan defaultTheme (yang sudah divalidasi)
    const themeToApply = isSavedValid ? savedTheme : defaultTheme;

    // Langkah C: Eksekusi penerapan tema
    applyTheme(themeToApply);

    // TAHAP 3: SUCCESS (Semua langkah selesai)
    console.log(
      '%c[System] Theme Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    // Jika terjadi kegagalan di tengah jalan
    console.error(
      '%c[Error] Theme Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
}

// --- TAHAP 4: INTERACTION (Event Listener) ---
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    console.log('%c[User Interaction] Button Clicked! 🖱️', 'color: #f59e0b; font-weight: bold;');
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });
} else {
  console.warn('[Warning] Theme Toggle button not found in DOM.');
}

// Jalankan proses inisialisasi
initTheme();
