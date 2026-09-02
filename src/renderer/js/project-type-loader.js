/**
 * PROJECT TYPE LOADER MODULE - INTEGRATED VERSION
 *
 * TUJUAN UTAMA:
 * 1. Mengambil daftar "Tipe Proyek" dari file data.json dan memasukkannya ke dropdown.
 * 2. LOGIKA DINAMIS: Jika user memilih tipe yang mengandung kata "Update", maka kolom
 *    "Update Number" akan muncul. Jika tidak, kolom tersebut akan disembunyikan.
 */

console.log(
  '%c[System] Project Type Loader Module: File Loaded ✅',
  'color: #0284c7; font-weight: bold;'
);

document.addEventListener('DOMContentLoaded', async () => {
  console.log(
    '%c[System] Project Type Loader Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  // --- REFERENSI ELEMEN (Mencari elemen di HTML) ---
  const projectTypeSelect = document.getElementById('project-type'); // Dropdown tipe proyek
  const updateNumberInput = document.getElementById('update-number'); // Input angka untuk update

  // Validasi awal: Pastikan kedua elemen tersebut ada di halaman sebelum lanjut
  if (!projectTypeSelect || !updateNumberInput) {
    console.warn('[Warning] Target elements not found in DOM ⚠️');
    return;
  }

  /**
   * MENCARI CONTAINER (PARENT)
   * Kita menggunakan .closest('.form-field') agar saat kolom input disembunyikan,
   * Label teksnya juga ikut hilang (karena label berada di dalam satu pembungkus yang sama).
   */
  const updateNumberField = updateNumberInput.closest('.form-field');

  // --- FUNGSI LOGIKA VISIBILITAS ---

  /**
   * FUNGSI: isUpdateType
   * Kegunaan: Mengecek apakah teks yang dipilih user mengandung kata "update".
   * Cara kerja: Mengubah teks ke huruf kecil, membuang spasi kosong,
   * lalu mencari apakah ada kata 'update' atau singkatan 'upd'.
   */
  const isUpdateType = (value) => {
    if (!value) return false;
    const val = value.toLowerCase().trim();
    return val === 'update' || val === 'upd' || val.includes('update') || val.includes('upd');
  };

  /**
   * FUNGSI: handleProjectTypeChange
   * Kegunaan: Pengatur tampilan (Show/Hide).
   * Cara kerja:
   * - Jika tipe adalah "Update" -> Tampilkan kolom input angka.
   * - Jika bukan -> Sembunyikan kolom input DAN hapus isinya agar data tidak nyangkut.
   */
  const handleProjectTypeChange = () => {
    const selectedValue = projectTypeSelect.value;
    if (isUpdateType(selectedValue)) {
      updateNumberField.style.display = 'block'; // Tampilkan
    } else {
      updateNumberField.style.display = 'none'; // Sembunyikan
      updateNumberInput.value = ''; // Kosongkan isi input
    }
  };

  // --- TAHAP 1: FETCH & POPULATE DATA (Mengambil data dari JSON) ---
  try {
    console.log('[Debug] Step 1: Fetching project types...');
    const response = await fetch('./js/data.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Memastikan struktur JSON memiliki array 'projectTypes'
    if (data.projectTypes && Array.isArray(data.projectTypes)) {
      console.log('[Debug] Step 2: Populating dropdown...');

      // Mengisi dropdown dengan data dari JSON
      data.projectTypes.forEach((type) => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        projectTypeSelect.appendChild(option);
      });

      console.log(
        '%c[Action] Project Types loaded successfully! 🚀',
        'color: #10b981; font-weight: bold;'
      );

      // --- TAHAP 2: SETUP EVENT LISTENER (Menunggu perubahan user) ---

      /**
       * Menambahkan 'Event Listener': Setiap kali user mengganti pilihan di dropdown,
       * fungsi handleProjectTypeChange akan dijalankan secara otomatis.
       */
      projectTypeSelect.addEventListener('change', handleProjectTypeChange);

      /**
       * JALANKAN PENGECEKAN AWAL
       * Penting agar jika halaman di-refresh dan browser mengisi otomatis (auto-fill),
       * tampilan kolom input langsung menyesuaikan dengan pilihan tersebut.
       */
      handleProjectTypeChange();
    } else {
      console.warn('[Warning] Invalid JSON structure ⚠️');
    }
  } catch (error) {
    /**
     * PENANGANAN ERROR
     * Jika file JSON tidak ditemukan atau rusak, pesan error akan muncul di console.
     */
    console.error(
      '%c[Error] Project Type Loader Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
});
