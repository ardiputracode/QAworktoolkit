/**
 * _google.js
 * GOOGLE SHEETS AUTHENTICATION HELPER
 */

import { google } from 'googleapis';

/**
 * Membuat Google Authentication menggunakan Service Account.
 *
 * Credential dibaca dari Vercel Environment Variables.
 * Jangan pernah meletakkan private key di frontend.
 */
export function createGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials tidak ditemukan.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },

    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

/**
 * Helper untuk membaca range dari Google Sheets.
 */
export async function getSheetValues(range) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID tidak ditemukan.');
  }

  const auth = createGoogleAuth();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}
