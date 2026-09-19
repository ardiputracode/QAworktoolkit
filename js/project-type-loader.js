/**
 * project-type-loader.js
 * PROJECT TYPE LOADER MODULE - INTEGRATED VERSION (REFACTORED)
 *
 * TUJUAN UTAMA:
 * 1. [UPDATED] Sekarang menggunakan data yang sudah terpasang langsung di HTML (Static).
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
     * Kegunaan: Inisialisasi awal dan memasang event listener.
     * [UPDATED] Menghapus proses fetch data.json karena data sudah ada di HTML.
     */
    init: function () {
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

      // --- TAHAP 1: DATA POPULATION ---
      // [UPDATED] Data sudah dipasang langsung di HTML, tidak perlu fetch() lagi.
      console.log('[Debug] Step 1: Using static data from HTML... ✅');

      // --- TAHAP 2: SETUP EVENT LISTENER (Menunggu perubahan user) ---
      projectTypeSelect.addEventListener('change', _handleProjectTypeChange);
      /**
       * JALANKAN PENGECEKAN AWAL
       * Penting agar jika halaman di-refresh dan browser mengisi otomatis (auto-fill),
       * tampilan kolom input langsung menyesuaikan dengan pilihan tersebut.
       */
      _handleProjectTypeChange();

      console.log(
        '%c[Action] Project Type logic initialized successfully! 🚀',
        'color: #10b981; font-weight: bold;'
      );
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
