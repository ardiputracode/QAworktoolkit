/**
 * Fungsi untuk mengambil data tester dari data.json
 * dan merender checkbox ke dalam DOM secara dinamis.
 */
async function loadTesters() {
  const container = document.getElementById('tester-list');
  if (!container) return;

  try {
    // 1. Ambil data dari data.json
    const response = await fetch('./js/data.json');
    if (!response.ok) {
      throw new Error('Gagal mengambil data JSON');
    }
    const data = await response.json();

    // 2. Ambil array testers (pastikan fallback ke array kosong jika tidak ada)
    const testers = data.testers || [];

    // 3. Bersihkan container sebelum mengisi (agar tidak duplikat)
    container.innerHTML = '';

    // 4. Loop melalui data tester dan buat elemen HTML-nya
    testers.forEach((testerName, index) => {
      const label = document.createElement('label');
      label.className = 'field-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'testers'; // Sama dengan name di form original
      checkbox.value = testerName; // Value adalah nama tester
      // Jika Anda ingin value tetap format "tester-1", gunakan:
      // checkbox.value = `tester-${index + 1}`;

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
    container.innerHTML = `<p class="error-msg">Gagal memuat daftar tester.</p>`;
  }
}

// Jalankan fungsi saat script dimuat atau DOM siap
document.addEventListener('DOMContentLoaded', loadTesters);
