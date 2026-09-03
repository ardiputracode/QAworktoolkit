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
     * @param {string} targetId - ID dari elemen halaman yang ingin ditampilkan.
     */
    function navigateTo(targetId) {
      // Menghapus tanda '#' agar kita mendapatkan ID murni (contoh: '#home' menjadi 'home')
      const id = targetId.replace('#', '');
      const targetPage = document.getElementById(id);

      // Jika halaman yang dituju tidak ada di HTML, batalkan proses
      if (!targetPage) {
        console.warn(`[Warning] Target page not found: ${targetId} ⚠️`);
        return;
      }

      // --- TAHAP 3: ACTION (Proses perpindahan halaman secara visual) ---
      console.log(
        `%c[Action] Switched to page: ${id.toUpperCase()} 🗺️`,
        'color: #8b5cf6; font-weight: bold;'
      );

      /**
       * PROSES 1: SEMBUNYIKAN SEMUA HALAMAN
       * Kita melakukan perulangan pada semua halaman dan memberikan atribut 'hidden'.
       * Ini membuat semua halaman tidak terlihat oleh pengguna.
       */
      pages.forEach((page) => {
        page.setAttribute('hidden', ''); // Membuat elemen hilang dari pandangan
        page.classList.remove('is-active'); // Menghapus class aktif (untuk styling CSS)
      });

      /**
       * PROSES 2: TAMPILKAN HALAMAN TARGET
       * Sekarang, kita hanya menampilkan halaman yang dipilih dengan menghapus atribut 'hidden'.
       */
      targetPage.removeAttribute('hidden');
      targetPage.classList.add('is-active');

      /**
       * PROSES 3: UPDATE STATUS MENU (Highlight Menu Aktif)
       * Agar user tahu mereka sedang di menu mana, kita memberi tanda 'is-active'
       * pada link yang sesuai dengan halaman saat ini.
       */
      navLinks.forEach((link) => {
        const linkHref = link.getAttribute('href');
        if (linkHref === targetId) {
          // Jika href link sama dengan ID halaman, beri tanda aktif
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page'); // Standar aksesibilitas untuk pembaca layar
        } else {
          // Jika tidak, hapus tandanya
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
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
