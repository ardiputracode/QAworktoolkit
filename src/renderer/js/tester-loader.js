/**
 * Fungsi untuk mengambil data tester dari Google Sheets
 * melalui IPC dan merender checkbox secara dinamis.
 */

/**
 * Menandai bahwa proses loading tester sudah selesai.
 *
 * Fungsi ini melakukan dua hal:
 * 1. Menyimpan status pada data attribute container agar script lain
 *    bisa mengetahui jika tester sudah selesai dimuat sebelumnya.
 * 2. Mengirim custom event "testers-ready" agar script lain yang sedang
 *    menunggu proses ini dapat melanjutkan pekerjaannya.
 *
 * Event ini penting untuk mencegah race condition antara:
 * - tester-loader.js yang membuat checkbox secara async dari Google Sheets
 * - report-builder-save-logic.js yang memulihkan tester dari IndexedDB
 *
 * @param {HTMLElement} container - Container daftar tester.
 */
function notifyTestersReady(container) {
  if (!container) return;

  // Tandai bahwa proses load tester sudah selesai.
  container.dataset.testersReady = 'true';

  // Beri tahu script lain bahwa checkbox tester sudah siap digunakan.
  document.dispatchEvent(new CustomEvent('testers-ready'));
}

/**
 * Fungsi untuk mengambil data tester dari Google Sheets
 * melalui IPC dan merender checkbox secara dinamis.
 */
async function loadTesters() {
  const container = document.getElementById('tester-list');
  if (!container) return;

  // Reset status ready sebelum proses load baru dimulai.
  // Ini penting jika loadTesters() suatu saat dipanggil ulang.
  delete container.dataset.testersReady;

  try {
    // 1. Ambil data dari Google Sheets (bukan lagi file JSON lokal)
    const response = await window.qaToolkit.getTesters();

    if (!response || !response.success) {
      throw new Error(response?.message || 'Gagal mengambil data tester dari Google Sheets');
    }

    const testers = response.data; // Ini adalah array string [ "Nama 1", "Nama 2" ]

    // 2. Bersihkan container sebelum mengisi (agar tidak duplikat)
    container.innerHTML = '';

    if (testers.length === 0) {
      container.innerHTML = `<p class="empty-msg" style="padding: 1rem; color: var(--text-muted)">No testers found.</p>`;

      // Walaupun daftar kosong, proses loading tetap dianggap selesai
      // agar report-builder tidak menunggu sampai timeout.
      notifyTestersReady(container);
      return;
    }

    // 3. Loop melalui data tester dan buat elemen HTML-nya
    testers.forEach((testerName) => {
      const label = document.createElement('label');
      label.className = 'field-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'testers';
      checkbox.value = testerName;

      const span = document.createElement('span');
      span.textContent = testerName;

      // Susun elemen: label -> [checkbox, span]
      label.appendChild(checkbox);
      label.appendChild(span);

      // Masukkan ke dalam container
      container.appendChild(label);
    });

    // 4. Beri tahu script lain bahwa seluruh checkbox tester
    // sudah selesai dibuat dan tersedia di DOM.
    notifyTestersReady(container);

    console.log(
      `%c[System] Testers loaded successfully. Total: ${testers.length} ✅`,
      'color: #10b981;'
    );
  } catch (error) {
    console.error('Error loading testers:', error);
    container.innerHTML = `<p class="error-msg">Gagal memuat daftar tester: ${error.message}</p>`;

    // Tetap tandai proses sebagai selesai walaupun gagal.
    // Tujuannya agar proses restore autosave tidak terhenti
    // menunggu event tester sampai timeout.
    notifyTestersReady(container);
  }
}

// Jalankan fungsi saat DOM siap
document.addEventListener('DOMContentLoaded', loadTesters);
