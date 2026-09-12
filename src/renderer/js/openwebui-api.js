/**
 * openwebui-api.js
 * MODUL PENGELOLAAN KONFIGURASI OPEN WEBUI API
 *
 * Deskripsi:
 * Mengelola koneksi antara aplikasi dengan Open WebUI, termasuk melakukan tes
 * koneksi, menyimpan/menghapus API Key di localStorage, serta memuat daftar model AI.
 * Menyertakan kontrol status tombol (Save/Reset) berdasarkan validitas koneksi.
 */

import { showToast } from './toast-notification.js';

document.addEventListener('DOMContentLoaded', async () => {
  // --- [1] REFERENSI ELEMEN DOM ---
  const form = document.getElementById('openwebui-settings-form');
  const tokenInput = document.getElementById('openwebui-api-key');
  const modelSelect = document.getElementById('openwebui-model-select');
  const connectionBanner = document.getElementById('openwebui-connection-banner');

  // Referensi tombol kontrol untuk sinkronisasi status disabled
  const saveBtn = document.querySelector('[data-action="save-openwebui"]');
  const resetBtn = document.querySelector('[data-action="reset-openwebui"]');

  // Helper untuk mencari elemen status berdasarkan atribut data
  const getStatusElement = (targetId) => document.getElementById(targetId);

  // --- [2] STATE MANAJEMEN ---
  let isWebUIConnected = false;

  // --- [3] FUNGSI HELPER (UTILITY FUNCTIONS) ---

  /**
   * Mengontrol status aktif/nonaktif tombol kontrol (Save & Reset).
   * Menyesuaikan perilaku dengan modul Jira API.
   * @param {boolean} isConnected - Apakah koneksi valid?
   */
  function updateControlButtons(isConnected) {
    if (saveBtn) saveBtn.disabled = !isConnected;
    if (resetBtn) resetBtn.disabled = !isConnected;
  }

  /**
   * Mengontrol visibilitas banner peringatan koneksi.
   * @param {boolean} isVisible - Apakah banner harus ditampilkan?
   */
  function updateBanner(isVisible) {
    if (connectionBanner) {
      if (isVisible) {
        connectionBanner.removeAttribute('hidden');
      } else {
        connectionBanner.setAttribute('hidden', '');
      }
    }
  }

  /**
   * Memperbarui tampilan teks dan warna elemen status.
   * @param {HTMLElement} element - Elemen target status.
   * @param {string} message - Pesan yang akan ditampilkan.
   * @param {string} color - Warna teks (misal: 'green', 'red', 'orange').
   */
  function updateStatus(element, message, color = 'black') {
    if (!element) return;
    element.textContent = message;
    element.style.color = color;
  }

  /**
   * Mengambil daftar model dari API dan mengisi elemen <select>.
   * @param {string} token - API Key yang valid.
   */
  async function populateModelDropdown(token) {
    if (!modelSelect) return;

    // Tampilkan status loading pada dropdown
    modelSelect.innerHTML = '<option value="">⏳ Loading models...</option>';

    try {
      const result = await window.qaToolkit.getOpenWebUIModels(token);

      if (result && result.success) {
        // Kosongkan dan isi dengan data model yang baru
        modelSelect.innerHTML = '<option value="" disabled selected>-- Pilih Model --</option>';

        result.data.forEach((model) => {
          const option = document.createElement('option');
          option.value = model.value; // ID model (misal: gpt-4o)
          option.textContent = model.label; // Nama tampilan (misal: GPT-4o)
          modelSelect.appendChild(option);
        });
      } else {
        modelSelect.innerHTML = '<option value="">❌ Gagal memuat model</option>';
        console.error('[openwebui-api] Model error:', result?.message);
      }
    } catch (err) {
      modelSelect.innerHTML = '<option value="">❌ Error sistem</option>';
      console.error('[openwebui-api] Dropdown error:', err);
    }
  }

  // --- [4] EVENT DELEGATION (PENANGANAN INTERAKSI USER) ---

  document.addEventListener('click', async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    if (!action) return;

    const statusTargetId = target.dataset.statusTarget;
    const statusElement = getStatusElement(statusTargetId);

    // --- AKSI A: TEST KONEKSI ---
    if (action === 'test-openwebui') {
      const token = tokenInput.value.trim();

      if (!token) {
        updateStatus(statusElement, '⚠️ API Key tidak boleh kosong', 'orange');
        updateControlButtons(false); // Matikan tombol jika input kosong
        return;
      }

      updateStatus(statusElement, '⏳ Mengetes koneksi...', 'orange');
      target.disabled = true; // Hindari double-click saat proses berlangsung

      try {
        const result = await window.qaToolkit.testOpenWebUI(token);

        if (result && result.success) {
          updateBanner(false); // Sembunyikan banner jika tes berhasil
          updateStatus(statusElement, result.message, 'green');
          isWebUIConnected = true;
          showToast('Connection successful!', 'success');

          // Aktifkan tombol kontrol setelah koneksi sukses
          updateControlButtons(true);

          // Muat daftar model setelah koneksi dipastikan sukses
          await populateModelDropdown(token);
        } else {
          updateBanner(true); // Tampilkan banner jika tes gagal
          updateStatus(statusElement, result?.message || '❌ Connection failed', 'red');
          isWebUIConnected = false;
          // Matikan tombol kontrol jika koneksi gagal
          updateControlButtons(false);
          showToast(result?.message || 'Connection failed', 'error');
        }
      } catch (err) {
        updateBanner(true);
        updateStatus(statusElement, '❌ System error occurred', 'red');
        isWebUIConnected = false;
        // Matikan tombol kontrol jika terjadi error sistem
        updateControlButtons(false);
        console.error(err);
      } finally {
        target.disabled = false;
      }
    }

    // --- AKSI B: SIMPAN KONFIGURASI ---
    if (action === 'save-openwebui') {
      const token = tokenInput.value.trim();
      localStorage.setItem('openWebUiApiKey', token);

      updateBanner(false); // Sembunyikan banner karena data sudah tersimpan aman
      showToast('Configuration saved locally!', 'success');
      updateStatus(statusElement, '💾 Configuration saved!', 'green');
    }

    // --- AKSI C: RESET KONFIGURASI ---
    if (action === 'reset-openwebui') {
      tokenInput.value = '';
      localStorage.removeItem('openWebUiApiKey');
      isWebUIConnected = false;

      // Matikan tombol kontrol setelah reset dilakukan
      updateControlButtons(false);

      if (modelSelect) modelSelect.innerHTML = '<option value="">-- Pilih Model --</option>';

      updateBanner(true); // Tampilkan banner karena koneksi dihapus
      updateStatus(statusElement, 'Configuration cleared.', 'gray');
      showToast('Configuration has been reset.', 'info');
    }
  });

  // --- [5] MONITORING INPUT (DIRTY STATE DETECTION) ---
  /**
   * Jika user mengubah input API Key secara manual, kita anggap koneksi saat ini
   * tidak lagi valid (dirty) dan segera menampilkan banner peringatan serta mematikan tombol.
   */
  tokenInput.addEventListener('input', () => {
    if (isWebUIConnected) {
      isWebUIConnected = false;
      updateBanner(true);
      // Matikan tombol save/reset jika input berubah agar user tes koneksi dulu
      updateControlButtons(false);
      console.info('[openwebui-api] Input changed: connection invalidated.');
    }
  });

  // --- [6] AUTO-CHECK PADA SAAT STARTUP (LOAD PAGE) ---
  /**
   * Fungsi ini berjalan saat aplikasi pertama kali dimuat untuk mengecek
   * apakah ada API Key yang tersimpan di localStorage dan apakah masih valid.
   */
  async function performStartupCheck() {
    const savedToken = localStorage.getItem('openWebUiApiKey');

    if (savedToken) {
      tokenInput.value = savedToken;
      console.log('[openwebui-api] Found saved token, checking connection...');

      try {
        const result = await window.qaToolkit.testOpenWebUI(savedToken);

        if (result && result.success) {
          isWebUIConnected = true;
          updateStatus(getStatusElement('openwebui-status'), result.message, 'green');

          // Sembunyikan banner jika token yang tersimpan sudah valid
          updateBanner(false);
          // Aktifkan tombol kontrol jika token valid
          updateControlButtons(true);

          await populateModelDropdown(savedToken);
        } else {
          console.warn('[openwebui-api] Saved token is invalid.');
          updateBanner(true); // Tampilkan banner jika token lama tidak valid lagi
          updateControlButtons(false);
        }
      } catch (err) {
        console.error('[openwebui-api] Startup check error:', err);
        updateBanner(true);
        updateControlButtons(false);
      }
    } else {
      // Jika benar-benar tidak ada token di penyimpanan, tampilkan banner dan matikan tombol
      updateBanner(true);
      updateControlButtons(false);
    }
  }

  // Jalankan pengecekan otomatis saat aplikasi dimuat
  performStartupCheck();
});
