/**
 * project-name-loader.js
 * PROJECT NAME LOADER MODULE (GOOGLE SHEETS VERSION)
 */
console.log(
  '%c[System] Project Name Loader Module: File Loaded ✅',
  'color: #0284c7; font-weight: bold;'
);

document.addEventListener('DOMContentLoaded', async () => {
  console.log(
    '%c[System] Project Name Loader Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    const projectNameSelect = document.getElementById('project-name');

    if (!projectNameSelect) {
      console.warn('[Warning] Target element #project-name not found in DOM ⚠️');
      return;
    }

    // --- PERUBAHAN UTAMA: Memanggil API lewat Preload, bukan fetch file lokal ---
    const response = await window.qaToolkit.getProjectNames();

    if (!response || !response.success) {
      throw new Error(response?.message || 'Gagal mengambil data dari Google Sheets');
    }

    const projectData = response.data;

    // Manipulasi DOM untuk mengisi dropdown
    if (Array.isArray(projectData)) {
      console.log('[Debug] Populating project name options from Google Sheets...');

      projectData.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.value; // Diambil dari kolom B di Sheet
        option.textContent = item.label; // Diambil dari kolom A di Sheet
        projectNameSelect.appendChild(option);
      });

      console.log(
        '%c[Action] Project Names loaded from Google Sheets! 🚀',
        'color: #10b981; font-weight: bold;'
      );

      // ✅ BARU: Notifikasi ke modul lain bahwa options sudah siap.
      // Ini memungkinkan fillForm di report-builder-save-logic.js
      // untuk set value dengan benar.
      projectNameSelect.dispatchEvent(
        new CustomEvent('project-names-ready', { bubbles: true })
      );
    } else {
      console.warn('[Warning] Data format dari Sheets tidak valid ⚠️');
      // Tetap fire event supaya fillForm tidak nunggu selamanya
      projectNameSelect.dispatchEvent(
        new CustomEvent('project-names-ready', { bubbles: true })
      );
    }
  } catch (error) {
    console.error(
      '%c[Error] Project Name Loader Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
    // Tetap fire event supaya fillForm tidak nunggu selamanya
    const select = document.getElementById('project-name');
    if (select) {
      select.dispatchEvent(new CustomEvent('project-names-ready', { bubbles: true }));
    }
  }
});