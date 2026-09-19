/**
 * test-jira-connection.js
 * TEST JIRA CLOUD CONNECTION
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

    const { email, token } = body;

    if (!email || !token) {
      return jsonResponse(
        {
          success: false,
          message: 'Email dan Jira API Token diperlukan.',
        },
        400
      );
    }

    const baseUrl = process.env.JIRA_BASE_URL;

    if (!baseUrl) {
      throw new Error('JIRA_BASE_URL tidak dikonfigurasi.');
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

    const apiUrl = `${normalizedBaseUrl}/rest/api/3/myself`;

    const authString = Buffer.from(`${email}:${token}`).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'GET',

      headers: {
        Authorization: `Basic ${authString}`,

        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return jsonResponse({
        success: false,

        message: `❌ FAILED (Status: ${response.status})`,
      });
    }

    const userData = await response.json();

    const avatarUrl =
      userData.avatarUrls?.['48x48'] ||
      userData.avatarUrls?.['32x32'] ||
      userData.avatarUrls?.['24x24'] ||
      userData.avatarUrls?.['16x16'] ||
      userData.avatarUrls?.large ||
      null;

    const username = userData.displayName || email;

    return jsonResponse({
      success: true,

      message: `✅ OK - Connected as: ${username}`,

      username,

      avatarUrl,
    });
  } catch (error) {
    console.error('Jira Test Error:', error);

    return jsonResponse(
      {
        success: false,
        message: `❌ ERROR: ${error.message}`,
      },
      500
    );
  }
}
