/**
 * get-jira-issue-count.js
 * GET JIRA ISSUE COUNT FROM JQL OR FILTER ID
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

    const { email, token, siteBaseUrl, jql, filterId } = body;

    if (!email || !token) {
      return jsonResponse(
        {
          success: false,
          message: 'Jira credentials diperlukan.',
        },
        400
      );
    }

    const baseUrl = process.env.JIRA_BASE_URL;

    if (!baseUrl) {
      throw new Error('JIRA_BASE_URL tidak dikonfigurasi.');
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

    /*
     * SECURITY:
     * Pastikan filter URL berasal dari
     * Jira instance yang sama.
     */
    if (siteBaseUrl) {
      try {
        const configuredHost = new URL(normalizedBaseUrl).hostname;

        const filterHost = new URL(siteBaseUrl).hostname;

        if (configuredHost !== filterHost) {
          return jsonResponse(
            {
              success: false,

              message:
                `❌ URL filter berasal dari domain lain (${filterHost}), ` +
                `bukan dari Jira yang dikonfigurasi (${configuredHost}).`,
            },
            400
          );
        }
      } catch {
        return jsonResponse(
          {
            success: false,
            message: '❌ Jira URL tidak valid.',
          },
          400
        );
      }
    }

    const authHeaders = {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,

      Accept: 'application/json',
    };

    let finalJql = jql;

    /*
     * Jika user menggunakan filter ID,
     * ambil JQL dari Jira terlebih dahulu.
     */
    if (!finalJql && filterId) {
      const filterResponse = await fetch(
        `${normalizedBaseUrl}/rest/api/3/filter/${encodeURIComponent(filterId)}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (!filterResponse.ok) {
        return jsonResponse({
          success: false,

          message:
            `❌ Gagal mengambil detail filter #${filterId} ` + `(Status: ${filterResponse.status})`,
        });
      }

      const filterData = await filterResponse.json();

      finalJql = filterData.jql;
    }

    if (!finalJql) {
      return jsonResponse(
        {
          success: false,

          message: '❌ URL filter tidak mengandung JQL maupun filter ID yang valid.',
        },
        400
      );
    }

    /*
     * Endpoint yang sudah digunakan
     * aplikasi Electron kamu sekarang.
     */
    const countUrl = `${normalizedBaseUrl}` + '/rest/api/3/search/approximate-count';

    const countResponse = await fetch(countUrl, {
      method: 'POST',

      headers: {
        ...authHeaders,

        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        jql: finalJql,
      }),
    });

    if (!countResponse.ok) {
      return jsonResponse({
        success: false,

        message: `❌ Gagal mengambil jumlah tiket ` + `(Status: ${countResponse.status})`,
      });
    }

    const countData = await countResponse.json();

    return jsonResponse({
      success: true,
      count: countData.count,
    });
  } catch (error) {
    console.error('Jira Issue Count Error:', error);

    return jsonResponse(
      {
        success: false,

        message: `❌ ERROR: ${error.message}`,
      },
      500
    );
  }
}
