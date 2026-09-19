/**
 * _utils.js
 * SHARED API UTILITIES
 *
 * File dengan awalan "_" tidak menjadi endpoint Vercel.
 */

export function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Membaca JSON request dengan error handling sederhana.
 */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
