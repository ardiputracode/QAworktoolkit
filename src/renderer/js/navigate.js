/**
 * Navigasi Work Toolkit
 * Mengatur perpindahan antar section (halaman) dalam satu file (SPA style).
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Seleksi semua elemen yang dibutuhkan
  const navContainer = document.querySelector('.app-nav');
  const navLinks = document.querySelectorAll('[data-page-link]');
  const pages = document.querySelectorAll('.page');

  // 2. Gunakan Event Delegation untuk menangani klik pada navigasi
  navContainer.addEventListener('click', (event) => {
    // Mencari elemen link terdekat yang memiliki attribute data-page-link
    // Ini berguna jika di dalam <a> ada elemen lain seperti <span> atau <i>
    const clickedLink = event.target.closest('[data-page-link]');

    // Jika yang diklik bukan bagian dari nav-link, abaikan
    if (!clickedLink) return;

    // Mencegah perilaku default (agar halaman tidak scroll meloncat ke ID)
    event.preventDefault();

    // 3. Ambil ID target dari atribut href (misal: "#page-home" menjadi "page-home")
    const targetId = clickedLink.getAttribute('href').replace('#', '');
    const targetPage = document.getElementById(targetId);

    // 4. Jalankan fungsi update tampilan jika halaman target ditemukan
    if (targetPage) {
      updateUI(clickedLink, targetPage);

      // Opsional: Update URL di browser tanpa reload (memungkinkan tombol Back bekerja)
      window.history.pushState(null, null, `#${targetId}`);
    }
  });

  /**
   * Fungsi untuk memperbarui tampilan navigasi dan konten
   * @param {HTMLElement} activeLink - Link yang sedang aktif
   * @param {HTMLElement} activePage - Section yang ingin ditampilkan
   */
  function updateUI(activeLink, activePage) {
    // --- Update Navigasi (Link) ---
    navLinks.forEach((link) => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });

    activeLink.classList.add('is-active');
    activeLink.setAttribute('aria-current', 'page');

    // --- Update Konten (Sections/Pages) ---
    pages.forEach((page) => {
      page.classList.remove('is-active');
      page.setAttribute('hidden', ''); // Sembunyikan semua halaman
    });

    activePage.classList.add('is-active');
    activePage.removeAttribute('hidden'); // Tampilkan halaman yang dipilih
  }

  // 5. Menangani tombol Back/Forward pada browser
  window.addEventListener('popstate', () => {
    const currentHash = window.location.hash || '#page-home';
    const targetLink = document.querySelector(`[href="${currentHash}"]`);
    const targetPage = document.getElementById(currentHash.replace('#', ''));

    if (targetLink && targetPage) {
      updateUI(targetLink, targetPage);
    }
  });
});
