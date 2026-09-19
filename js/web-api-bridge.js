/**
 * web-api-bridge.js
 * WEB VERSION OF ELECTRON PRELOAD BRIDGE
 *
 * Tujuan:
 * Menyediakan window.qaToolkit seperti preload.js Electron,
 * tetapi menggunakan Vercel API melalui fetch().
 */

console.log('%c[System] Web API Bridge Loaded ✅', 'color: #0284c7; font-weight: bold;');

/**
 * Helper GET.
 */
async function apiGet(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',

      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`[API] GET ${url} failed:`, error);

    return {
      success: false,
      message: 'Unable to communicate with server.',
    };
  }
}

/**
 * Helper POST.
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

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`[API] POST ${url} failed:`, error);

    return {
      success: false,
      message: 'Unable to communicate with server.',
    };
  }
}

/**
 * Compatibility layer.
 *
 * Dibuat dengan interface yang sama seperti
 * preload.js Electron agar file frontend lama
 * tidak perlu banyak diubah.
 */
window.qaToolkit = {
  appName: 'QA Toolkit',

  testJiraConnection: (credentials) => apiPost('/api/test-jira-connection', credentials),

  getJiraIssueCount: (payload) => apiPost('/api/get-jira-issue-count', payload),

  getProjectNames: () => apiGet('/api/get-project-names'),

  getTesters: () => apiGet('/api/get-testers'),

  getQaLead: () => apiGet('/api/get-qa-lead'),

  testOpenWebUI: (token) =>
    apiPost('/api/test-openwebui', {
      token,
    }),

  getOpenWebUIModels: (token) =>
    apiPost('/api/get-openwebui-models', {
      token,
    }),

  sendOpenWebUIPrompt: (payload) => apiPost('/api/send-openwebui-prompt', payload),
};
