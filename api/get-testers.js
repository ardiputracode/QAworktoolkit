/**
 * get-testers.js
 * GET TESTER LIST FROM GOOGLE SHEETS
 */

import { getSheetValues } from './_google.js';
import { jsonResponse } from './_utils.js';

export async function GET() {
  try {
    const SHEET_NAME = 'Tester';

    const range = `'${SHEET_NAME}'!B2:B`;

    const rows = await getSheetValues(range);

    if (!rows || rows.length === 0) {
      return jsonResponse({
        success: true,
        data: [],
      });
    }

    const testers = rows.map((row) => row[0]?.trim()).filter((name) => name);

    return jsonResponse({
      success: true,
      data: testers,
    });
  } catch (error) {
    console.error('Error fetching testers:', error);

    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
}
