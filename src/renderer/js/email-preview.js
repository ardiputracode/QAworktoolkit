/**
 * email-preview.js
 * LOGIC: Menghasilkan preview laporan secara real-time berdasarkan input form.
 * UPDATE: Struktur tabel berbasis Section, Badge Status, dan Tipografi Email-Safe.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('report-builder-form');
  const previewContainer = document.getElementById('report-preview');

  if (!form || !previewContainer) {
    console.warn('[Warning] Form atau Preview container tidak ditemukan!');
    return;
  }

  /**
   * Pengelompokan field untuk memisahkan informasi (Sectioning).
   * Menggantikan struktur fieldMapping lama agar data lebih mudah dipindai.
   */
  const reportSections = [
    {
      title: 'Project Overview',
      fields: {
        projectType: 'Project Type',
        updateNumber: 'Update Number',
        version: 'Version',
        testers: 'Testers',
      },
    },
    {
      title: 'Issue Summary',
      fields: {
        resultStatus: 'Result Status',
        resultStatusNote: 'Result Status Note',
        totalIssues: 'Total Issues',
        totalIssuesLink: 'Total Issues Link',
        majorIssues: 'Major Issues',
        majorIssuesLink: 'Major Issues Link',
      },
    },
    {
      title: 'Highlights & Follow-up',
      fields: {
        audioHighlights: 'Audio Highlights',
        generalHighlights: 'General Highlights',
        updateFollowUp: 'Update Follow-up',
        questions: 'Questions',
        milestones: 'Milestones',
      },
    },
    {
      title: 'Links & Build References',
      fields: {
        buildLink: 'Build Link',
        tvbLink: 'TVB Link',
        tvbContent: 'TVB Content',
        heatmapLink: 'Heatmap Link',
        heatmapContent: 'Heatmap Content',
        platformsLink: 'Platforms Link',
        platformsTracking: 'Platforms Tracking',
      },
    },
    {
      title: 'Additional Content',
      fields: {
        licensedContent: 'Licensed Content',
        licensedNote: 'Licensed Note',
        audioCredits: 'Audio Credits',
        audioCreditsNote: 'Audio Credits Note',
      },
    },
  ];

  /**
   * Fungsi utama untuk merender tabel preview.
   */
  const updatePreview = () => {
    const formData = new FormData(form);

    // --- CONSTANTS (Email Safe Theme) ---
    const primaryColor = '#4a148c';
    const borderColor = '#e0e0e0';
    const sectionBgColor = '#f4f5f7';
    const labelWidth = '22%'; // Diperkecil agar area narasi/highlights lebih luas

    // --- DATA PREPARATION ---
    const projectName = formData.get('projectName') || '...';
    const rawDate = formData.get('reportDate');

    const formatEnglishDate = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    const formattedDate = formatEnglishDate(rawDate);

    // --- TABLE STRUCTURE ---
    // Menggunakan font sistem modern dan border-collapse untuk kompatibilitas email
    let tableHtml = `
      <table style="width: 100%; max-width: 900px; border-collapse: collapse; 
                    border: 1px solid ${borderColor}; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 14px;">`;

    // --- HEADER ROW ---
    tableHtml += `
      <thead>
        <tr>
          <th colspan="2" style="background-color: ${primaryColor}; color: #ffffff; padding: 20px 24px; text-align: left; border-bottom: 3px solid #8e24aa;">
            <div style="font-size: 1.35rem; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px;">
              ${projectName} - Audio QA Project Status Report
            </div>
            <div style="font-size: 0.9rem; font-weight: 400; opacity: 0.9;">
              ${formattedDate}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>`;

    // --- TABLE BODY (Iterasi per Section) ---
    reportSections.forEach((section) => {
      // Baris Sub-header Kategori
      tableHtml += `
        <tr>
          <td colspan="2" style="background-color: ${sectionBgColor}; color: #333; padding: 12px 24px; font-weight: 700; font-size: 1.05em; border-top: 1px solid ${borderColor}; border-bottom: 1px solid ${borderColor}; text-transform: uppercase; letter-spacing: 0.5px;">
            ${section.title}
          </td>
        </tr>`;

      // Iterasi Kolom dalam Kategori
      for (const [fieldName, label] of Object.entries(section.fields)) {
        let value = '';

        if (fieldName === 'testers') {
          const checkedTesters = formData.getAll('testers');
          value = checkedTesters.length > 0 ? checkedTesters.join(', ') : '-';
        } else {
          value = formData.get(fieldName);
          if (!value || value.trim() === '') {
            value = '-';
          }
        }

        let displayValue = value;

        // --- LOGIKA BADGE & FORMATTING KHUSUS ---

        // 1. Badge untuk Result Status
        if (fieldName === 'resultStatus' && value !== '-') {
          const valLower = value.toLowerCase();
          let statusColor = '#383d41';
          let statusBg = '#e2e3e5';

          if (valLower.includes('pass') || valLower.includes('green') || valLower.includes('ok')) {
            statusColor = '#155724';
            statusBg = '#d4edda'; // Hijau
          } else if (
            valLower.includes('fail') ||
            valLower.includes('red') ||
            valLower.includes('block')
          ) {
            statusColor = '#721c24';
            statusBg = '#f8d7da'; // Merah
          } else if (valLower.includes('warning') || valLower.includes('yellow')) {
            statusColor = '#856404';
            statusBg = '#fff3cd'; // Kuning
          }

          displayValue = `<span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.9em; display: inline-block;">${value}</span>`;
        }

        // 2. Badge peringatan untuk Major Issues (Jika bug > 0)
        if (fieldName === 'majorIssues' && value !== '-' && !isNaN(value)) {
          const numVal = parseInt(value, 10);
          if (numVal > 0) {
            displayValue = `<span style="background-color: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 4px; font-weight: 700;">${value}</span>`;
          } else {
            displayValue = `<span style="background-color: #d4edda; color: #155724; padding: 3px 8px; border-radius: 4px; font-weight: 700;">${value}</span>`;
          }
        }

        // 3. Mengubah teks URL menjadi link yang bisa diklik (misal: Jira Link / Heatmap)
        if (
          fieldName.toLowerCase().includes('link') &&
          value !== '-' &&
          (value.startsWith('http') || value.startsWith('www'))
        ) {
          const href = value.startsWith('http') ? value : `https://${value}`;
          displayValue = `<a href="${href}" target="_blank" style="color: #0056b3; text-decoration: none; font-weight: 500;">${value}</a>`;
        }

        // --- RENDER BARIS TABEL ---
        tableHtml += `
          <tr>
            <td style="padding: 14px 24px; font-weight: 600; width: ${labelWidth}; color: #555; background-color: #fafafa; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
              ${label}
            </td>
            <td style="padding: 14px 24px; color: #222; background-color: #ffffff; border-bottom: 1px solid #f0f0f0; white-space: pre-wrap; line-height: 1.6; vertical-align: top;">
              ${displayValue}
            </td>
          </tr>`;
      }
    });

    tableHtml += '</tbody>';

    // --- FOOTER ROW ---
    tableHtml += `
      <tfoot>
        <tr>
          <td colspan="2" style="background-color: #f8f9fa; color: #888; padding: 16px; text-align: center; font-size: 0.75em; font-weight: 700; letter-spacing: 1px; border-top: 1px solid ${borderColor};">
            END OF REPORT
          </td>
        </tr>
      </tfoot>`;

    tableHtml += '</table>';

    // Masukkan ke dalam container preview
    previewContainer.innerHTML = tableHtml;
  };

  /**
   * Event Listener: Mendengarkan setiap perubahan input pada form.
   */
  form.addEventListener('input', updatePreview);

  // Inisialisasi awal saat halaman dimuat
  updatePreview();
});
