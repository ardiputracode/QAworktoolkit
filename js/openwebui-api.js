/**
 * openwebui-api.js
 * MODUL PENGELOLAAN KONFIGURASI OPEN WEBUI API
 *
 * TUJUAN:
 * Mengelola konfigurasi Open WebUI pada UI:
 *
 * - Test connection
 * - Load model
 * - Save API Token
 * - Reset configuration
 * - Startup connection check
 *
 * NETWORK FLOW:
 *
 * openwebui-api.js
 *        ↓
 * window.qaToolkit
 *        ↓
 * web-api-bridge.js
 *        ↓
 * openwebui-direct.js
 *        ↓
 * Open WebUI Internal
 *
 * Request Open WebUI TIDAK melewati Vercel.
 */

import { showToast } from './toast-notification.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ============================================================
  // [1] REFERENSI DOM
  // ============================================================

  const form = document.getElementById('openwebui-settings-form');

  const tokenInput = document.getElementById('openwebui-api-key');

  const modelSelect = document.getElementById('openwebui-model-select');

  const connectionBanner = document.getElementById('openwebui-connection-banner');

  const saveBtn = document.querySelector('[data-action="save-openwebui"]');

  const resetBtn = document.querySelector('[data-action="reset-openwebui"]');

  const testBtn = document.querySelector('[data-action="test-openwebui"]');

  // ============================================================
  // VALIDASI ELEMENT PENTING
  // ============================================================

  if (!form || !tokenInput) {
    console.warn('[OpenWebUI] Settings form tidak ditemukan.');

    return;
  }

  // ============================================================
  // [2] STATE
  // ============================================================

  let isWebUIConnected = false;

  // ============================================================
  // [3] HELPER
  // ============================================================

  /**
   * Mengambil status element berdasarkan ID.
   *
   * @param {string} targetId
   * @returns {HTMLElement|null}
   */
  function getStatusElement(targetId) {
    if (!targetId) {
      return null;
    }

    return document.getElementById(targetId);
  }

  /**
   * Mengatur tombol berdasarkan status connection.
   *
   * @param {boolean} isConnected
   * @param {boolean} isSaved
   */
  function updateControlButtons(isConnected, isSaved = false) {
    if (testBtn) {
      testBtn.disabled = isSaved;
    }

    if (saveBtn) {
      saveBtn.disabled = !isConnected || isSaved;
    }

    if (resetBtn) {
      resetBtn.disabled = !isConnected;
    }

    if (tokenInput) {
      tokenInput.readOnly = isSaved;
    }

    if (modelSelect) {
      modelSelect.disabled = !isConnected;
    }
  }

  /**
   * Menampilkan / menyembunyikan warning banner.
   *
   * @param {boolean} isVisible
   */
  function updateBanner(isVisible) {
    if (!connectionBanner) {
      return;
    }

    if (isVisible) {
      connectionBanner.removeAttribute('hidden');

      return;
    }

    connectionBanner.setAttribute('hidden', '');
  }

  /**
   * Update status text.
   *
   * @param {HTMLElement|null} element
   * @param {string} message
   * @param {string} color
   */
  function updateStatus(element, message, color = 'black') {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.style.color = color;
  }

  // ============================================================
  // [4] LOAD MODEL
  // ============================================================

  /**
   * Mengambil daftar model melalui compatibility bridge.
   *
   * Bridge akan meneruskannya langsung dari browser
   * ke Open WebUI.
   *
   * @param {string} token
   */
  async function populateModelDropdown(token) {
    if (!modelSelect) {
      return;
    }

    modelSelect.innerHTML = '<option value="">⏳ Loading models...</option>';

    try {
      const result = await window.qaToolkit.getOpenWebUIModels(token);

      if (!result?.success) {
        throw new Error(result?.message || 'Gagal mengambil model.');
      }

      const models = result.data;

      if (!Array.isArray(models)) {
        throw new Error('Format data model tidak sesuai.');
      }

      modelSelect.innerHTML = '<option value="" disabled selected>-- Pilih Model --</option>';

      models.forEach((model) => {
        const option = document.createElement('option');

        option.value = model.value;

        option.textContent = model.label;

        modelSelect.appendChild(option);
      });

      console.log(`[OpenWebUI] ${models.length} model berhasil dimuat.`);
    } catch (error) {
      console.error('[OpenWebUI] Dropdown error:', error);

      modelSelect.innerHTML = '<option value="">❌ Gagal memuat model</option>';
    }
  }

  // ============================================================
  // [5] RESET
  // ============================================================

  /**
   * Reset seluruh konfigurasi Open WebUI.
   */
  function executeReset() {
    tokenInput.value = '';

    localStorage.removeItem('openWebUiApiKey');

    isWebUIConnected = false;

    updateControlButtons(false, false);

    if (modelSelect) {
      modelSelect.innerHTML = '<option value="">-- Pilih Model --</option>';
    }

    updateBanner(true);

    updateStatus(document.getElementById('openwebui-status'), 'Configuration cleared.', 'gray');

    showToast('Configuration has been reset.', 'info');
  }

  // ============================================================
  // [6] EVENT DELEGATION
  // ============================================================

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');

    if (!target) {
      return;
    }

    const action = target.dataset.action;

    if (!action) {
      return;
    }

    const statusTargetId = target.dataset.statusTarget;

    const statusElement = getStatusElement(statusTargetId);

    // ========================================================
    // TEST OPEN WEBUI
    // ========================================================

    if (action === 'test-openwebui') {
      const token = tokenInput.value.trim();

      if (!token) {
        updateStatus(statusElement, '⚠️ API Key tidak boleh kosong', 'orange');

        updateControlButtons(false, false);

        return;
      }

      updateStatus(statusElement, '⏳ Mengetes koneksi...', 'orange');

      target.disabled = true;

      try {
        const result = await window.qaToolkit.testOpenWebUI(token);

        if (!result?.success) {
          throw new Error(result?.message || 'Connection failed.');
        }

        localStorage.setItem('openWebUiApiKey', token);

        updateBanner(false);

        updateStatus(statusElement, result.message || '✅ Connected to Open WebUI', 'green');

        isWebUIConnected = true;

        showToast('Connection successful and saved!', 'success');

        updateControlButtons(true, true);

        await populateModelDropdown(token);
      } catch (error) {
        updateBanner(true);

        updateStatus(statusElement, error.message || '❌ Connection failed', 'red');

        isWebUIConnected = false;

        updateControlButtons(false, false);

        console.error('[OpenWebUI] Test connection failed:', error);
      } finally {
        if (!isWebUIConnected) {
          target.disabled = false;
        }
      }

      return;
    }

    // ========================================================
    // SAVE OPEN WEBUI
    // ========================================================

    if (action === 'save-openwebui') {
      const token = tokenInput.value.trim();

      if (!token) {
        updateStatus(statusElement, '⚠️ API Key tidak boleh kosong', 'orange');

        return;
      }

      localStorage.setItem('openWebUiApiKey', token);

      updateBanner(false);

      showToast('Configuration saved locally!', 'success');

      updateStatus(statusElement, '💾 Configuration saved!', 'green');

      updateControlButtons(true, true);

      return;
    }

    // ========================================================
    // RESET OPEN WEBUI
    // ========================================================

    if (action === 'reset-openwebui') {
      if (typeof window.showConfirmationDialog === 'function') {
        window.showConfirmationDialog(
          'Konfirmasi Reset',
          'Apakah Anda yakin ingin menghapus semua pengaturan Open WebUI API?',
          () => executeReset()
        );

        return;
      }

      const confirmed = window.confirm(
        'Apakah Anda yakin ingin mereset pengaturan Open WebUI API?'
      );

      if (confirmed) {
        executeReset();
      }
    }
  });

  // ============================================================
  // [7] MONITOR INPUT
  // ============================================================

  tokenInput.addEventListener('input', () => {
    if (!isWebUIConnected) {
      return;
    }

    isWebUIConnected = false;

    updateBanner(true);

    updateControlButtons(false, false);
  });

  // ============================================================
  // [8] STARTUP CHECK
  // ============================================================

  /**
   * Mengecek kembali token yang tersimpan ketika aplikasi dibuka.
   */
  async function performStartupCheck() {
    const savedToken = localStorage.getItem('openWebUiApiKey');

    if (!savedToken) {
      updateBanner(true);

      updateControlButtons(false, false);

      return;
    }

    tokenInput.value = savedToken;

    try {
      const result = await window.qaToolkit.testOpenWebUI(savedToken);

      if (!result?.success) {
        throw new Error(result?.message || 'Invalid Token');
      }

      isWebUIConnected = true;

      updateStatus(
        document.getElementById('openwebui-status'),
        '✅ Connected to Open WebUI',
        'green'
      );

      updateBanner(false);

      updateControlButtons(true, true);

      await populateModelDropdown(savedToken);
    } catch (error) {
      console.warn('[OpenWebUI] Saved token is invalid or network unreachable:', error);

      isWebUIConnected = false;

      updateBanner(true);

      updateControlButtons(false, false);

      updateStatus(document.getElementById('openwebui-status'), '❌ Open WebUI unavailable', 'red');
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  performStartupCheck();
});
