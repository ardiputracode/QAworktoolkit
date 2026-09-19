/**
 * test-openwebui.js
 * TEST OPEN WEBUI CONNECTION
 */

import { jsonResponse, readJson } from './_utils.js';

export async function POST(request) {
  try {
    const body = await readJson(request);

    if (!body) {
      return jsonResponse(
        {
          success: false,
          message: 'Invalid request body.',
        },
        400
      );
    }

    const { token } = body;

    const baseUrl = process.env.OPEN_WEBUI_URL;

    if (!baseUrl) {
      throw new Error('OPEN_WEBUI_URL tidak dikonfigurasi.');
    }

    if (!token) {
      return jsonResponse(
        {
          success: false,
          message: 'API Token tidak boleh kosong.',
        },
        400
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

    const testApiUrl = `${normalizedBaseUrl}/api/models`;

    const response = await fetch(testApiUrl, {
      method: 'GET',

      headers: {
        Authorization: `Bearer ${token}`,

        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return jsonResponse({
        success: true,

        message: '✅ Connected to Open WebUI',
      });
    }

    if (response.status === 401 || response.status === 403) {
      return jsonResponse({
        success: false,

        message: `❌ Invalid Token (Status: ${response.status})`,
      });
    }

    return jsonResponse({
      success: false,

      message: `❌ Server Error (Status: ${response.status})`,
    });
  } catch (error) {
    console.error('Open WebUI Test Error:', error);

    return jsonResponse(
      {
        success: false,

        message: `❌ ERROR: ${error.message}`,
      },
      500
    );
  }
}
