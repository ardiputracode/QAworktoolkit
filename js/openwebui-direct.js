/**
 * openwebui-direct.js
 * OPEN WEBUI DIRECT CLIENT
 *
 * TUJUAN:
 * Menangani seluruh komunikasi langsung dari browser pengguna
 * ke Open WebUI internal perusahaan.
 *
 * ALUR:
 * Browser User
 *     ↓
 * Jaringan / VPN Perusahaan
 *     ↓
 * Open WebUI
 *
 * CATATAN:
 * - Request TIDAK melewati Vercel.
 * - PC user harus dapat mengakses Open WebUI.
 * - Open WebUI harus mengizinkan origin website melalui CORS.
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================

  const OPEN_WEBUI_BASE_URL = 'https://ask.ai.gameloft.org';

  // ============================================================
  // HELPER
  // ============================================================

  /**
   * Membuat URL Open WebUI yang konsisten.
   *
   * @param {string} path
   * @returns {string}
   */
  function createApiUrl(path) {
    const baseUrl = OPEN_WEBUI_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
  }

  /**
   * Mengubah error network menjadi pesan yang lebih mudah dipahami.
   *
   * Error fetch biasanya terjadi karena:
   * - PC tidak berada di jaringan/VPN perusahaan
   * - DNS internal tidak dapat diakses
   * - Certificate problem
   * - CORS diblokir
   *
   * @param {Error} error
   * @returns {string}
   */
  function getNetworkErrorMessage(error) {
    if (error instanceof TypeError) {
      return (
        'Tidak dapat menghubungi Open WebUI. ' +
        'Pastikan PC terhubung ke jaringan/VPN perusahaan dan browser diizinkan mengakses Open WebUI.'
      );
    }

    return error?.message || 'Unknown network error.';
  }

  /**
   * Membaca JSON response dengan aman.
   *
   * @param {Response} response
   * @returns {Promise<object|null>}
   */
  async function readJsonSafely(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // ============================================================
  // TEST CONNECTION
  // ============================================================

  /**
   * Test koneksi dan validasi token menggunakan /api/models.
   *
   * @param {string} token
   * @returns {Promise<object>}
   */
  async function testConnection(token) {
    try {
      if (!token) {
        return {
          success: false,
          message: '⚠️ API Token tidak boleh kosong.',
        };
      }

      const response = await fetch(createApiUrl('/api/models'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        return {
          success: true,
          message: '✅ Connected to Open WebUI',
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: `❌ Invalid Token (Status: ${response.status})`,
        };
      }

      return {
        success: false,
        message: `❌ Open WebUI Server Error (Status: ${response.status})`,
      };
    } catch (error) {
      console.error('[OpenWebUI Direct] Connection error:', error);

      return {
        success: false,
        message: `❌ ${getNetworkErrorMessage(error)}`,
      };
    }
  }

  // ============================================================
  // GET MODELS
  // ============================================================

  /**
   * Mengambil daftar model langsung dari Open WebUI.
   *
   * Format output tetap dibuat:
   *
   * [
   *   {
   *     label: "model-name",
   *     value: "model-name"
   *   }
   * ]
   *
   * agar kompatibel dengan kode lama.
   *
   * @param {string} token
   * @returns {Promise<object>}
   */
  async function getModels(token) {
    try {
      if (!token) {
        return {
          success: false,
          message: 'API Token diperlukan.',
          data: [],
        };
      }

      const response = await fetch(createApiUrl('/api/models'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Gagal mengambil model (Status: ${response.status})`,
          data: [],
        };
      }

      const data = await readJsonSafely(response);

      if (!data || !Array.isArray(data.data)) {
        return {
          success: false,
          message: 'Format data model dari Open WebUI tidak sesuai.',
          data: [],
        };
      }

      const models = data.data
        .filter((model) => model && model.id)
        .map((model) => ({
          label: model.id,
          value: model.id,
        }));

      return {
        success: true,
        data: models,
      };
    } catch (error) {
      console.error('[OpenWebUI Direct] Get models error:', error);

      return {
        success: false,
        message: getNetworkErrorMessage(error),
        data: [],
      };
    }
  }

  // ============================================================
  // SEND PROMPT
  // ============================================================

  /**
   * Mengirim prompt langsung ke Open WebUI.
   *
   * @param {object} payload
   * @param {string} payload.token
   * @param {string} payload.model
   * @param {string} payload.systemPrompt
   * @param {string} payload.userPrompt
   *
   * @returns {Promise<object>}
   */
  async function sendPrompt({ token, model, systemPrompt, userPrompt }) {
    try {
      if (!token) {
        return {
          success: false,
          message: 'API Token diperlukan.',
        };
      }

      if (!model) {
        return {
          success: false,
          message: 'Model belum dipilih.',
        };
      }

      if (!userPrompt) {
        return {
          success: false,
          message: 'Prompt tidak boleh kosong.',
        };
      }

      const response = await fetch(createApiUrl('/api/chat/completions'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt || '',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await readJsonSafely(response);

        const serverMessage = errorData?.detail || errorData?.message || null;

        return {
          success: false,
          message: serverMessage || `Gagal mengirim prompt (Status: ${response.status})`,
        };
      }

      const data = await readJsonSafely(response);

      if (!data) {
        return {
          success: false,
          message: 'Open WebUI memberikan response yang tidak valid.',
        };
      }

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          message: 'AI memberikan respon kosong.',
        };
      }

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      console.error('[OpenWebUI Direct] Send prompt error:', error);

      return {
        success: false,
        message: `❌ ${getNetworkErrorMessage(error)}`,
      };
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  window.openWebUIClient = Object.freeze({
    baseUrl: OPEN_WEBUI_BASE_URL,
    testConnection,
    getModels,
    sendPrompt,
  });

  console.log(
    '%c[System] Open WebUI Direct Client Loaded ✅',
    'color: #10b981; font-weight: bold;'
  );
})();
