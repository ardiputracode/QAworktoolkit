/**
 * get-openwebui-models.js
 * GET AVAILABLE OPEN WEBUI MODELS
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
          message: 'API Token diperlukan.',
        },
        400
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

    const apiUrl = `${normalizedBaseUrl}/api/models`;

    const response = await fetch(apiUrl, {
      method: 'GET',

      headers: {
        Authorization: `Bearer ${token}`,

        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return jsonResponse({
        success: false,

        message: `Gagal mengambil model ` + `(Status: ${response.status})`,
      });
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return jsonResponse({
        success: false,
        message: 'Format data model tidak sesuai.',
      });
    }

    const models = data.data.map((model) => ({
      label: model.id,
      value: model.id,
    }));

    return jsonResponse({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error fetching Open WebUI models:', error);

    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
}
