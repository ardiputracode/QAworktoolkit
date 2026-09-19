/**
 * send-openwebui-prompt.js
 * SEND PROMPT TO OPEN WEBUI
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

    const { token, model, systemPrompt, userPrompt } = body;

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

    if (!model) {
      return jsonResponse(
        {
          success: false,
          message: 'Model belum dipilih.',
        },
        400
      );
    }

    if (!userPrompt) {
      return jsonResponse(
        {
          success: false,
          message: 'Prompt tidak boleh kosong.',
        },
        400
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

    const apiUrl = `${normalizedBaseUrl}` + '/api/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,

        'Content-Type': 'application/json',
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
      return jsonResponse({
        success: false,

        message: `Gagal mengirim prompt ` + `(Status: ${response.status})`,
      });
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({
        success: false,

        message: 'AI memberikan respon kosong.',
      });
    }

    return jsonResponse({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error sending prompt to Open WebUI:', error);

    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
}
