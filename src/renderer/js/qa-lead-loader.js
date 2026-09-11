/**
 * qa-lead-loader.js
 * QA LEAD LOADER MODULE
 *
 * Tujuan: Mengambil nama QA Lead dari Google Sheets dan mengisinya ke input hidden #qaLead.
 */

const QaLeadLoader = (function () {
  // --- PRIVATE VARIABLES ---
  let qaLeadInput;

  console.log(
    '%c[System] QA Lead Loader Module: File Loaded ✅',
    'color: #0284c7; font-weight: bold;'
  );

  // --- PUBLIC METHODS ---
  return {
    /**
     * FUNGSI: init
     * Mengambil data via IPC dan mengisi elemen input.
     */
    init: async function () {
      console.log(
        '%c[System] QA Lead Loader Module: Starting Initialization... ⚙️',
        'color: #f59e0b; font-weight: bold;'
      );

      // --- REFERENSI ELEMEN ---
      qaLeadInput = document.getElementById('qaLead');

      if (!qaLeadInput) {
        console.warn('[Warning] Target element #qaLead not found in DOM ⚠️');
        return;
      }

      try {
        // Memanggil fungsi yang sudah di-expose di preload.js
        const response = await window.qaToolkit.getQaLead();

        if (response.success) {
          qaLeadInput.value = response.data;
          console.log(
            '%c[Action] QA Lead loaded successfully: ' + response.data,
            'color: #10b981; font-weight: bold;'
          );
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error(
          '%c[Error] QA Lead Loader Module: Initialization Failed! ❌',
          'color: #ef4444; font-weight: bold;',
          error
        );
      }
    },
  };
})();

// --- INITIALIZATION RUNNER ---
document.addEventListener('DOMContentLoaded', () => {
  QaLeadLoader.init();
});
