/**
 * project-type-loader.js
 * PROJECT TYPE LOADER MODULE - INTEGRATED VERSION (REFACTORED)
 *
 * TUJUAN UTAMA:
 * 1. Mengambil daftar "Tipe Proyek" dari file data.json dan memasukkannya ke dropdown.
 * 2. LOGIKA DINAMIS: Jika user memilih tipe yang mengandung kata "Update", maka kolom
 *    "Update Number" akan muncul. Jika tidak, kolom tersebut akan disembunyikan.
 */

const ProjectTypeLoader = (function () {
  // --- PRIVATE VARIABLES ---
  let projectTypeSelect; // Dropdown tipe proyek
  let updateNumberInput; // Input angka untuk update
  let updateNumberField; // Container pembungkus input angka

  console.log(
    '%c[System] Project Type Loader Module: File Loaded ✅',
    'color: #0284c7; font-weight: bold;'
  );

  // --- PRIVATE METHODS ---

  /**
   * MENCARI CONTAINER (PARENT)
   * Menggunakan .closest('.form-field') agar saat kolom input disembunyikan,
   * Label teksnya juga ikut hilang.
   */
  const _getUpdateField = () => {
    if (updateNumberInput) {
      return updateNumberInput.closest('.form-field');
    }
    return null;
  };

  /**
   * FUNGSI: isUpdateType
   * Kegunaan: Mengecek apakah teks yang dipilih user mengandung kata "update".
   */
  const _isUpdateType = (value) => {
    if (!value) return false;
    const val = value.toLowerCase().trim();
    return (
      val === 'update' ||
      val === 'upd' ||
      val.includes('update') ||
      val.includes('upd') ||
      val.includes('exp') ||
      val.includes('expansion')
    );
  };

  /**
   * FUNGSI: handleProjectTypeChange (Internal Logic)
   * Kegunaan: Pengatur tampilan (Show/Hide).
   */
  const _handleProjectTypeChange = () => {
    if (!projectTypeSelect || !updateNumberInput || !updateNumberField) return;

    const selectedValue = projectTypeSelect.value;
    if (_isUpdateType(selectedValue)) {
      updateNumberField.style.display = 'block'; // Tampilkan
    } else {
      updateNumberField.style.display = 'none'; // Sembunyikan
      updateNumberInput.value = ''; // Kosongkan isi input agar data tidak nyangkut
    }
  };

  // --- PUBLIC METHODS ---

  return {
    /**
     * FUNGSI: init
     * Kegunaan: Inisialisasi awal, mengambil data JSON, dan memasang event listener.
     */
    init: async function () {
      console.log(
        '%c[System] Project Type Loader Module: Starting Initialization... ⚙️',
        'color: #f59e0b; font-weight: bold;'
      );

      // --- REFERENSI ELEMEN ---
      projectTypeSelect = document.getElementById('project-type');
      updateNumberInput = document.getElementById('update-number');

      // Validasi awal
      if (!projectTypeSelect || !updateNumberInput) {
        console.warn('[Warning] Target elements not found in DOM ⚠️');
        return;
      }

      updateNumberField = _getUpdateField();

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
          projectTypeSelect.addEventListener('change', _handleProjectTypeChange);

          /**
           * JALANKAN PENGECEKAN AWAL
           * Penting agar jika halaman di-refresh dan browser mengisi otomatis (auto-fill),
           * tampilan kolom input langsung menyesuaikan dengan pilihan tersebut.
           */
          _handleProjectTypeChange();
        } else {
          console.warn('[Warning] Invalid JSON structure ⚠️');
        }
      } catch (error) {
        // --- PENANGANAN ERROR ---
        console.error(
          '%c[Error] Project Type Loader Module: Initialization Failed! ❌',
          'color: #ef4444; font-weight: bold;',
          error
        );
      }
    },

    /**
     * FUNGSI: updateVisibility (Public API)
     * Kegunaan: Dipanggil dari file lain (seperti report-builder-save-logic.js)
     * untuk memaksa pengecekan tampilan tanpa menunggu interaksi user.
     */
    updateVisibility: function () {
      if (projectTypeSelect) {
        _handleProjectTypeChange();
      }
    },
  };
})();

// --- INITIALIZATION RUNNER ---
document.addEventListener('DOMContentLoaded', () => {
  ProjectTypeLoader.init();
});
