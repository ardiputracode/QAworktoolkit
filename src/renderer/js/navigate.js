/**
 * Navigate Module - Advanced Observability Version
 */

// --- TAHAP 1: LOADED (File berhasil masuk ke browser) ---
console.log('%c[System] Navigate Module: File Loaded ✅', 'color: #0284c7; font-weight: bold;');

document.addEventListener('DOMContentLoaded', () => {
  // --- TAHAP 2: INITIALIZATION SEQUENCE ---
  console.log(
    '%c[System] Navigate Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    // Langkah A: Mencari elemen navigasi
    console.log('[Debug] Step 1: Searching for navigation links and pages...');
    const navLinks = document.querySelectorAll('[data-page-link]');
    const pages = document.querySelectorAll('.page');

    if (navLinks.length === 0 || pages.length === 0) {
      console.warn('[Warning] Navigation elements not found. Check your HTML structure.');
    }

    // Langkah B: Mendefinisikan fungsi navigasi
    console.log('[Debug] Step 2: Defining navigation logic...');

    /**
     * Fungsi untuk berpindah halaman
     * @param {string} targetId - ID dari section yang ingin dituju
     */
    function navigateTo(targetId) {
      const id = targetId.replace('#', '');
      const targetPage = document.getElementById(id);

      if (!targetPage) {
        console.warn(`[Warning] Target page not found: ${targetId} ⚠️`);
        return;
      }

      // --- TAHAP 3: ACTION (Proses perpindahan halaman) ---
      console.log(
        `%c[Action] Switched to page: ${id.toUpperCase()} 🗺️`,
        'color: #8b5cf6; font-weight: bold;'
      );

      // Sembunyikan semua halaman
      pages.forEach((page) => {
        page.setAttribute('hidden', '');
        page.classList.remove('is-active');
      });

      // Tampilkan halaman target
      targetPage.removeAttribute('hidden');
      targetPage.classList.add('is-active');

      // Update status menu navigasi
      navLinks.forEach((link) => {
        const linkHref = link.getAttribute('href');
        if (linkHref === targetId) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
    }

    // Langkah C: Memasang Event Listener
    console.log('[Debug] Step 3: Attaching event listeners to nav links...');
    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        // --- TAHAP 4: USER INTERACTION ---
        console.log(
          '%c[User Interaction] Navigation Link Clicked! 🖱️',
          'color: #f59e0b; font-weight: bold;'
        );

        event.preventDefault();
        const targetId = link.getAttribute('href');
        navigateTo(targetId);
      });
    });

    // TAHAP 3: SUCCESS (Semua langkah selesai)
    console.log(
      '%c[System] Navigate Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    // Jika terjadi kegagalan di tengah jalan
    console.error(
      '%c[Error] Navigate Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
});
