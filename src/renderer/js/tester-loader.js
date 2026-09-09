/**
 * Fungsi untuk mengambil data tester dari Google Sheets
 * melalui IPC dan merender checkbox secara dinamis.
 */
async function loadTesters() {
  const container = document.getElementById('tester-list');
  if (!container) return;

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
  } catch (error) {
    console.error('Error loading testers:', error);
    container.innerHTML = `<p class="error-msg">Gagal memuat daftar tester: ${error.message}</p>`;
  }
}

// Jalankan fungsi saat DOM siap
document.addEventListener('DOMContentLoaded', loadTesters);
