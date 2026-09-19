/**
 * web-api-bridge.js
 * WEB API COMPATIBILITY BRIDGE
 *
 * TUJUAN:
 * Menggantikan preload.js milik Electron pada versi Web/Vercel.
 *
 * Interface window.qaToolkit tetap dipertahankan agar modul
 * frontend lama tidak perlu banyak diubah.
 *
 * ARSITEKTUR:
 *
 * Google Sheets:
 * Browser → Vercel API → Google Sheets
 *
 * Jira:
 * Browser → Vercel API → Jira
 *
 * Open WebUI:
 * Browser → Open WebUI langsung
 *
 * Open WebUI TIDAK melewati Vercel karena server berada
 * di jaringan/intranet perusahaan.
 */

(function () {
  'use strict';

  console.log('%c[System] Web API Bridge: File Loaded ✅', 'color: #0284c7; font-weight: bold;');

  // ============================================================
  // RESPONSE HELPER
  // ============================================================

  /**
   * Membaca response Vercel API dengan aman.
   *
   * @param {Response} response
   * @returns {Promise<object>}
   */
  async function parseApiResponse(response) {
    try {
      return await response.json();
    } catch {
      return {
        success: false,
        message: `Server memberikan response yang tidak valid (Status: ${response.status}).`,
      };
    }
  }

  // ============================================================
  // GET REQUEST TO VERCEL
  // ============================================================

  /**
   * Melakukan GET request ke backend Vercel.
   *
   * Digunakan untuk:
   * - Google Sheets Project Names
   * - Tester List
   * - QA Lead
   *
   * @param {string} url
   * @returns {Promise<object>}
   */
  async function apiGet(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      return await parseApiResponse(response);
    } catch (error) {
      console.error(`[Web API Bridge] GET ${url} failed:`, error);

      return {
        success: false,
        message: 'Unable to communicate with Vercel API.',
      };
    }
  }

  // ============================================================
  // POST REQUEST TO VERCEL
  // ============================================================

  /**
   * Melakukan POST request ke backend Vercel.
   *
   * Digunakan untuk fungsi server-side seperti Jira.
   *
   * @param {string} url
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async function apiPost(url, payload) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return await parseApiResponse(response);
    } catch (error) {
      console.error(`[Web API Bridge] POST ${url} failed:`, error);

      return {
        success: false,
        message: 'Unable to communicate with Vercel API.',
      };
    }
  }

  // ============================================================
  // OPEN WEBUI DIRECT CLIENT
  // ============================================================

  /**
   * Memastikan openwebui-direct.js sudah dimuat.
   *
   * @returns {object|null}
   */
  function getOpenWebUIClient() {
    if (!window.openWebUIClient) {
      console.error(
        '[Web API Bridge] window.openWebUIClient tidak tersedia. ' +
          'Pastikan openwebui-direct.js dimuat sebelum web-api-bridge.js.'
      );

      return null;
    }

    return window.openWebUIClient;
  }

  // ============================================================
  // PUBLIC COMPATIBILITY API
  // ============================================================

  /**
   * Interface dibuat sama dengan preload.js Electron lama.
   *
   * Dengan demikian modul seperti:
   *
   * window.qaToolkit.getProjectNames()
   * window.qaToolkit.testJiraConnection()
   * window.qaToolkit.sendOpenWebUIPrompt()
   *
   * tetap dapat digunakan.
   */
  window.qaToolkit = {
    appName: 'QA Toolkit',

    // ==========================================================
    // JIRA
    // Backend: Vercel
    // ==========================================================

    testJiraConnection: (credentials) => apiPost('/api/test-jira-connection', credentials),

    getJiraIssueCount: (payload) => apiPost('/api/get-jira-issue-count', payload),

    // ==========================================================
    // GOOGLE SHEETS
    // Backend: Vercel
    // ==========================================================

    getProjectNames: () => apiGet('/api/get-project-names'),

    getTesters: () => apiGet('/api/get-testers'),

    getQaLead: () => apiGet('/api/get-qa-lead'),

    // ==========================================================
    // OPEN WEBUI
    // DIRECT BROWSER CONNECTION
    // TIDAK MENGGUNAKAN VERCEL
    // ==========================================================

    testOpenWebUI: async (token) => {
      const client = getOpenWebUIClient();

      if (!client) {
        return {
          success: false,
          message: 'Open WebUI Direct Client belum dimuat.',
        };
      }

      return client.testConnection(token);
    },

    getOpenWebUIModels: async (token) => {
      const client = getOpenWebUIClient();

      if (!client) {
        return {
          success: false,
          message: 'Open WebUI Direct Client belum dimuat.',
          data: [],
        };
      }

      return client.getModels(token);
    },

    sendOpenWebUIPrompt: async (payload) => {
      const client = getOpenWebUIClient();

      if (!client) {
        return {
          success: false,
          message: 'Open WebUI Direct Client belum dimuat.',
        };
      }

      return client.sendPrompt(payload);
    },
  };

  console.log('%c[System] Web API Bridge Initialized ✅', 'color: #10b981; font-weight: bold;');
})();
