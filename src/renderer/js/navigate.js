/**
 * navigate.js
 * NAVIGATE MODULE - ADVANCED OBSERVABILITY VERSION
 *
 * TUJUAN UTAMA:
 * Membuat sistem navigasi "Single Page" (SPA). Alih-alih memuat ulang seluruh halaman
 * saat menu diklik, skrip ini hanya akan menyembunyikan bagian (section) yang sedang
 * tidak aktif dan menampilkan bagian yang dipilih. Ini membuat website terasa sangat cepat.
 */

// --- TAHAP 1: LOADED (Konfirmasi bahwa file berhasil dibaca oleh browser) ---
console.log('%c[System] Navigate Module: File Loaded ✅', 'color: #0284c7; font-weight: bold;');

document.addEventListener('DOMContentLoaded', () => {
  // --- TAHAP 2: INITIALIZATION SEQUENCE (Persiapan awal saat halaman dimuat) ---
  console.log(
    '%c[System] Navigate Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    /**
     * LANGKAH A: MENCARI ELEMEN NAVIGASI DAN HALAMAN
     * Kita mencari semua link yang memiliki atribut 'data-page-link' (sebagai menu)
     * dan semua elemen dengan class 'page' (sebagai konten halaman).
     */
    console.log('[Debug] Step 1: Searching for navigation links and pages...');
    const navLinks = document.querySelectorAll('[data-page-link]'); // Semua link di menu
    const pages = document.querySelectorAll('.page'); // Semua konten halaman

    // Jika tidak ada link atau tidak ada halaman, berikan peringatan
    if (navLinks.length === 0 || pages.length === 0) {
      console.warn('[Warning] Navigation elements not found. Check your HTML structure.');
    }

    /**
     * LANGKAH B: MENDEFINISIKAN LOGIKA NAVIGASI (Inti dari sistem ini)
     * Fungsi ini bertanggung jawab untuk melakukan proses "tukar tampilan".
     *
         /**
         /**
     * @param {string} targetId - ID dari elemen halaman atau elemen di dalamnya yang ingin dituju.
     */
    function navigateTo(targetId) {
      const id = targetId.replace('#', '');
      const targetElement = document.getElementById(id);

      // 1. Validasi: Jika target tidak ditemukan
      if (!targetElement) {
        console.warn(`[Warning] Target not found: ${targetId} ⚠️`);
        return;
      }

      // 2. Cari Induk Section (.page) dari elemen yang diklik
      const actualPage = targetElement.closest('.page');

      if (!actualPage) {
        console.warn(`[Warning] Target is not inside a .page section ⚠️`);
        return;
      }

      const pageIdToDisplay = actualPage.id;

      console.log(
        `%c[Action] Switched to page: ${pageIdToDisplay.toUpperCase()} 🗺️`,
        'color: #8b5cf6; font-weight: bold;'
      );

      // --- PROSES PERPINDAHAN HALAMAN (Sama seperti sebelumnya) ---

      // PROSES 1: SEMBUNYIKAN SEMUA HALAMAN
      pages.forEach((page) => {
        page.setAttribute('hidden', '');
        page.classList.remove('is-active');
      });

      // PROSES 2: TAMPILKAN HALAMAN INDUK (Actual Page)
      actualPage.removeAttribute('hidden');
      actualPage.classList.add('is-active');

      // PROSES 3: UPDATE STATUS MENU (Highlight Menu Aktif)
      navLinks.forEach((link) => {
        const linkHref = link.getAttribute('href');
        if (linkHref === `#${pageIdToDisplay}`) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });

      // --- [FIX] PROSES 4: LOGIKA SCROLLING YANG CERDAS ---

      if (targetElement === actualPage) {
        // KONDISI A: Jika yang diklik adalah menu utama (misal: #page-home)
        // Kita ingin layar kembali ke posisi paling atas halaman.
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // KONDISI B: Jika yang diklik adalah elemen di dalam halaman (misal: form dari banner)
        // Kita melompat tepat ke elemen tersebut.
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    /**
     * LANGKAH C: MEMASANG EVENT LISTENER (Menunggu interaksi user)
     * Kita memberikan instruksi kepada setiap link di menu agar "mendengarkan" jika diklik.
     */
    console.log('[Debug] Step 3: Attaching event listeners to nav links...');
    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        /**
         * --- TAHAP 4: USER INTERACTION ---
         * Saat user mengklik link...
         */
        console.log(
          '%c[User Interaction] Navigation Link Clicked! 🖱️',
          'color: #f59e0b; font-weight: bold;'
        );

        // event.preventDefault() sangat penting!
        // Ini mencegah browser melakukan perilaku aslinya (seperti reload halaman atau lompat ke ID).
        // Kita ingin kita sendiri yang mengontrol perpindahannya lewat fungsi navigateTo.
        event.preventDefault();

        // Ambil nilai href dari link tersebut dan jalankan navigasi
        const targetId = link.getAttribute('href');
        navigateTo(targetId);
      });
    });

    // TAHAP 3: SUCCESS (Konfirmasi bahwa sistem sudah siap bekerja)
    console.log(
      '%c[System] Navigate Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    /**
     * PENANGANAN ERROR
     * Jika terjadi kesalahan teknis dalam proses inisialisasi.
     */
    console.error(
      '%c[Error] Navigate Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
});
