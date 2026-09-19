/**
 * get-project-names.js
 * GET PROJECT NAMES FROM GOOGLE SHEETS
 */

import { getSheetValues } from './_google.js';
import { jsonResponse } from './_utils.js';

export async function GET() {
  try {
    const SHEET_NAME = 'Project info';

    const range = `'${SHEET_NAME}'!A2:A100`;

    const rows = await getSheetValues(range);

    if (!rows || rows.length === 0) {
      return jsonResponse({
        success: true,
        data: [],
      });
    }

    const projectNames = rows
      .map((row) => {
        const projectName = row[0]?.trim();

        return {
          label: projectName,
          value: projectName,
        };
      })
      .filter((item) => item.label);

    return jsonResponse({
      success: true,
      data: projectNames,
    });
  } catch (error) {
    console.error('Error fetching project names:', error);

    return jsonResponse(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
}
