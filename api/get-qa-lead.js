/**
 * get-qa-lead.js
 * GET QA LEAD FROM GOOGLE SHEETS
 */

import { getSheetValues } from './_google.js';
import { jsonResponse } from './_utils.js';

export async function GET() {
  try {
    const SHEET_NAME = 'Tester';

    const range = `'${SHEET_NAME}'!A2`;

    const rows = await getSheetValues(range);

    if (!rows || !rows[0] || !rows[0][0]) {
      return jsonResponse({
        success: true,
        data: '',
      });
    }

    return jsonResponse({
      success: true,
      data: rows[0][0].trim(),
    });
  } catch (error) {
    console.error('Error fetching QA Lead:', error);

    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
}
