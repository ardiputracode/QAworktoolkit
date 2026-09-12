/**
 * email-preview.js
 *
 * Versi Terbaru:
 * - Setiap bagian (Audio Highlights, Questions, TVB Content, dll)
 *   memiliki fungsi Header sendiri agar mudah kustomisasi warna.
 * - Khusus TVB, Heatmap, dan Platforms: Jika link tersedia,
 *   Section Header-nya akan otomatis menjadi hyperlink.
 */
(function () {
  'use strict';

  /* ==========================================================================
     KONSTANTA GLOBAL
  ========================================================================== */
  const FONT_STACK = "'Verdana', 'Segoe UI', Arial, Helvetica, sans-serif";
  const CONTENT_COLOR = '#0f172a';
  const TABLE_WIDTH = 1500; // lebar total tabel (px) — dipakai juga untuk hitung lebar kolom value
  const LABEL_WIDTH = 190; // lebar kolom label (px)
  const VALUE_WIDTH = TABLE_WIDTH - LABEL_WIDTH; // sisa lebar untuk kolom value, dipakai di spacer row

  /* ==========================================================================
     CONFIG
  ========================================================================== */
  const CONFIG = {
    formId: 'report-builder-form',
    previewContainerId: 'report-preview',
    emptyPlaceholder: 'Preview report akan muncul di sini.',

    tinyMceIds: [
      'audio-highlights',
      'general-highlights',
      'update-follow-up',
      'questions',
      'milestones',
      'tvb-content',
      'heatmap-content',
      'platforms-tracking',
    ],

    styles: {
      table:
        'border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; ' +
        'width: ' +
        TABLE_WIDTH +
        'px; table-layout: fixed; margin: 0; ' + // UBAH: dari 'margin: 0 auto;' menjadi 'margin: 0;'
        'background-color: #ffffff; font-family: ' +
        FONT_STACK +
        '; font-size: 14px; line-height: 1.6; ' +
        'mso-line-height-rule: exactly; color: ' +
        CONTENT_COLOR +
        '; text-align: left; border: 1px solid #e2e8f0;',

      header:
        'background-color: #2E1065; color: #ffffff; padding: 12px 20px; ' +
        'font-size: 18px; font-weight: 700; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 24px; mso-line-height-rule: exactly;',

      projectSubHeader:
        'background-color: #4C1D95; color: #ffffff; padding: 8px 20px; ' +
        'font-size: 16px; font-weight: 400; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 20px; mso-line-height-rule: exactly;',

      dateSubHeader:
        'background-color: #5B21B6; color: #ffffff; padding: 6px 20px; ' +
        'font-size: 12px; font-weight: 400; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 16px; mso-line-height-rule: exactly;',

      footer:
        'background-color: #2E1065; color: #2E1065; padding: 16px 20px; ' +
        'font-size: 13px; text-align: right; border-top: 2px solid #bea1eb; ' +
        'font-family: ' +
        FONT_STACK +
        '; line-height: 1.4;',

      valueCell:
        'padding: 12px 16px; font-size: 14px; font-weight: 400; color: ' +
        CONTENT_COLOR +
        '; ' +
        'text-align: left; vertical-align: top; border-bottom: 1px solid #f1f5f9; ' +
        'font-family: ' +
        FONT_STACK +
        '; line-height: 1.6;',

      labelCell:
        'padding: 12px 16px; font-size: 13px; font-weight: 600; color: #2E1065; ' +
        'text-align: left; vertical-align: top; width: ' +
        LABEL_WIDTH +
        'px; border-bottom: 1px solid #f1f5f9; ' + // FIX: samakan dengan attribute width di createRow
        'word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; ' + // FIX: paksa wrap agar label panjang tidak melebarkan kolom
        'background-color: #fbfbfb; font-family: ' +
        FONT_STACK +
        '; line-height: 1.6;',

      link:
        'color: #7C3AED; text-decoration: underline; font-weight: 600; font-family: ' +
        FONT_STACK +
        ';',
    },
  };

  /* ==========================================================================
     UTILITIES
  ========================================================================== */

  function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'number') return false;
    if (typeof value !== 'string') return true;

    const trimmed = value.trim();
    if (trimmed === '') return true;

    // 1. Cek apakah ada konten teks di dalam tag HTML
    const textOnly = trimmed
      .replace(/<[^>]*>/g, ' ') // Hapus semua tag untuk mengecek teks murni
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;nbsp;/gi, ' ')
      .replace(/\u00A0/gi, ' ')
      .trim();

    // Jika ada teks yang ditemukan (bukan cuma spasi), berarti TIDAK kosong
    if (textOnly !== '') return false;

    // 2. Jika tidak ada teks, cek apakah ada elemen visual penting
    // Kita mencari tag: img, table, hr (garis), atau blockquote
    const hasVisualContent = /<(img|table|hr|blockquote)/i.test(trimmed);

    // Jika ada konten visual, kembalikan false (berarti TIDAK kosong)
    // Jika tidak ada teks DAN tidak ada konten visual, baru dianggap kosong
    return !hasVisualContent;
  }

  function formatDate(dateString) {
    if (!dateString || isEmptyValue(dateString)) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function normalizeRichContent(html) {
    if (isEmptyValue(html)) return '';
    if (typeof window.DOMParser === 'undefined') return html;

    try {
      const doc = new window.DOMParser().parseFromString(html, 'text/html');
      const body = doc.body;

      if (!body) return html;

      Array.prototype.forEach.call(
        body.querySelectorAll('script, style, link, meta'),
        function (el) {
          if (el.parentNode) el.parentNode.removeChild(el);
        }
      );

      const hasBlock = body.querySelector(
        'p, div, ul, ol, table, h1, h2, h3, h4, h5, h6, blockquote, pre'
      );

      if (!hasBlock && body.textContent.trim() !== '') {
        body.innerHTML = '<p>' + body.innerHTML + '</p>';
      }

      const textSelectors = 'p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, td, th';

      Array.prototype.forEach.call(body.querySelectorAll(textSelectors), function (el) {
        if (!el.style.fontFamily) el.style.fontFamily = FONT_STACK;
        if (!el.style.fontSize) el.style.fontSize = '14px';
        if (!el.style.lineHeight) el.style.lineHeight = '1.6';
        if (!el.style.color) el.style.color = CONTENT_COLOR;
      });

      const blockSelectors = 'p, div, h1, h2, h3, h4, h5, h6, blockquote, pre';

      Array.prototype.forEach.call(body.querySelectorAll(blockSelectors), function (el) {
        if (!el.style.margin) el.style.margin = '0 0 10px 0';
      });

      Array.prototype.forEach.call(body.querySelectorAll('ul, ol'), function (el) {
        if (!el.style.margin) el.style.margin = '0 0 10px 0';
        if (!el.style.padding) el.style.padding = '0 0 0 20px';
      });

      Array.prototype.forEach.call(body.querySelectorAll('li'), function (el) {
        if (!el.style.margin) el.style.margin = '0 0 4px 0';
      });

      Array.prototype.forEach.call(body.querySelectorAll('a'), function (el) {
        if (!el.style.color) el.style.color = '#0ea5e9';
        if (!el.style.textDecoration) el.style.textDecoration = 'none';
        if (!el.style.fontWeight) el.style.fontWeight = '500';
        if (!el.style.fontFamily) el.style.fontFamily = FONT_STACK;
      });

      Array.prototype.forEach.call(body.querySelectorAll('img'), function (el) {
        // FIX: Outlook/Word mengabaikan CSS max-width pada <img>, tapi tetap
        // membaca atribut width/height HTML asli (mis. 2048x597 dari screenshot).
        // Jadi atribut width harus dipaksa turun juga, bukan cuma lewat style.
        var MAX_IMG_WIDTH = TABLE_WIDTH - 40; // lebar tabel dikurangi padding kiri-kanan
        var currentWidth = parseInt(el.getAttribute('width'), 10) || el.naturalWidth || 0;

        if (!currentWidth || currentWidth > MAX_IMG_WIDTH) {
          el.removeAttribute('height'); // biar rasio ikut menyesuaikan otomatis
          el.setAttribute('width', String(MAX_IMG_WIDTH));
        }

        if (!el.style.maxWidth) el.style.maxWidth = '100%';
        if (!el.style.height) el.style.height = 'auto';
      });

      return body.innerHTML;
    } catch (err) {
      console.error('[email-preview] Gagal normalisasi konten:', err);
      return html;
    }
  }

  /* ==========================================================================
     DATA EXTRACTION
  ========================================================================== */
  function getTinyMceContent(id) {
    if (!window.tinymce || typeof window.tinymce.get !== 'function') return '';

    const editor = window.tinymce.get(id);

    if (!editor || typeof editor.getContent !== 'function') return '';

    try {
      return editor.getContent() || '';
    } catch (err) {
      return '';
    }
  }

  function getFormValue(id) {
    const element = document.getElementById(id);

    if (!element) return '';

    if (CONFIG.tinyMceIds.indexOf(id) !== -1) {
      return normalizeRichContent(getTinyMceContent(id));
    }

    if (element.tagName === 'SELECT') {
      const option = element.options[element.selectedIndex];
      return option && option.value !== '' ? option.text : '';
    }

    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked ? element.value : '';
    }

    return typeof element.value === 'string' ? element.value : '';
  }

  function getCheckedTesters() {
    const form = document.getElementById(CONFIG.formId);

    if (!form) return '';

    const checked = form.querySelectorAll('input[name="testers"]:checked');

    return Array.prototype.map
      .call(checked, function (cb) {
        return cb.value;
      })
      .join(', ');
  }

  function getFormDataForPreview() {
    return {
      reportDate: getFormValue('report-date'),
      projectName: getFormValue('project-name'),
      projectType: getFormValue('project-type'),
      updateNumber: getFormValue('update-number'),
      version: getFormValue('version'),
      buildLink: getFormValue('build-link'),
      totalIssues: getFormValue('total-issues'),
      totalIssuesLink: getFormValue('total-issues-link'),
      majorIssues: getFormValue('major-issues'),
      majorIssuesLink: getFormValue('major-issues-link'),
      licensedContent: getFormValue('licensed-content'),
      licensedNote: getFormValue('licensed-note'),
      audioCredits: getFormValue('audio-credits'),
      audioCreditsNote: getFormValue('audio-credits-note'),
      resultStatus: getFormValue('result-status'),
      resultStatusNote: getFormValue('result-status-note'),
      testers: getCheckedTesters(),
      qaLead: getFormValue('qaLead'),
      audioHighlights: getFormValue('audio-highlights'),
      generalHighlights: getFormValue('general-highlights'),
      updateFollowUp: getFormValue('update-follow-up'),
      questions: getFormValue('questions'),
      milestones: getFormValue('milestones'),
      tvbLink: getFormValue('tvb-link'),
      tvbContent: getFormValue('tvb-content'),
      heatmapLink: getFormValue('heatmap-link'),
      heatmapContent: getFormValue('heatmap-content'),
      platformsLink: getFormValue('platforms-link'),
      platformsTracking: getFormValue('platforms-tracking'),
    };
  }

  /* ==========================================================================
     HTML BUILDERS
  ========================================================================== */

  function createLinkHtml(url, text) {
    if (isEmptyValue(url)) return '';

    const label = isEmptyValue(text) ? url : text;

    return (
      '<a href="' +
      escapeHTML(url) +
      '" target="_blank" style="' +
      CONFIG.styles.link +
      '">' +
      escapeHTML(label) +
      '</a>'
    );
  }

  function createStatusBadge(status, note) {
    if (isEmptyValue(status)) return '';

    let bgColor = '#e5e7eb';
    let textColor = '#374151';

    const s = String(status).toLowerCase();

    if (s.indexOf('passed') !== -1) {
      bgColor = '#dcfce7';
      textColor = '#166534';
    } else if (s.indexOf('failed') !== -1) {
      bgColor = '#fee2e2';
      textColor = '#991b1b';
    } else if (s.indexOf('warning') !== -1 || s.indexOf('in progress') !== -1) {
      bgColor = '#fef9c3';
      textColor = '#854d0e';
    }

    const badgeTableStyle =
      'border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto; max-width: none;';

    const badgeCellStyle =
      'background-color: ' +
      bgColor +
      '; color: ' +
      textColor +
      '; padding: 2px 8px; font-size: 13px; font-weight: 700; font-family: ' +
      FONT_STACK +
      '; line-height: 1.3; white-space: nowrap; text-align: left;';

    const noteCellStyle =
      'padding-left: 6px; color: #64748b; font-size: 13px; font-family: ' +
      FONT_STACK +
      '; line-height: 1.3; text-align: left;';

    const badgeCell = '<td style="' + badgeCellStyle + '">' + escapeHTML(status) + '</td>';

    if (!isEmptyValue(note)) {
      return (
        '<table cellpadding="0" cellspacing="0" border="0" width="1" style="' +
        badgeTableStyle +
        '">' +
        '<tr>' +
        badgeCell +
        '<td style="' +
        noteCellStyle +
        '">- ' +
        escapeHTML(note) +
        '</td></tr>' +
        '</table>'
      );
    }

    return (
      '<table cellpadding="0" cellspacing="0" border="0" width="1" style="' +
      badgeTableStyle +
      '">' +
      '<tr>' +
      badgeCell +
      '</tr>' +
      '</table>'
    );
  }

  function createRow(label, valueHtml) {
    if (isEmptyValue(valueHtml)) return '';

    return (
      '<tr><td width="' +
      LABEL_WIDTH + // FIX: attribute HTML yang valid cuma "width", bukan "max-width" — samakan dengan style labelCell
      '" style="' +
      CONFIG.styles.labelCell +
      '">' +
      escapeHTML(label) +
      '</td><td style="' +
      CONFIG.styles.valueCell +
      '">' +
      valueHtml +
      '</td></tr>'
    );
  }

  function createTableFooter(text) {
    return (
      '<tr><td colspan="2" style="' + CONFIG.styles.footer + '">' + escapeHTML(text) + '</td></tr>'
    );
  }

  /**
   * HELPER: Spacer row — baris tak terlihat (tinggi 1px, isi &nbsp;) di paling
   * atas tabel untuk "mengunci" lebar kolom label & value di Word/Outlook.
   * Tanpa ini, Word bisa melebarkan kolom label melebihi LABEL_WIDTH begitu
   * ada baris lain yang butuh ruang lebih (table-layout:fixed sendiri dibuang
   * saat paste, jadi trik ini yang menggantikan fungsinya).
   */
  function createSpacerRow() {
    const spacerCellStyle =
      'line-height: 1px; font-size: 1px; mso-line-height-rule: exactly; padding: 0;';

    return (
      '<tr>' +
      '<td width="' +
      LABEL_WIDTH +
      '" style="width: ' +
      LABEL_WIDTH +
      'px; ' +
      spacerCellStyle +
      '">&nbsp;</td>' +
      '<td width="' +
      VALUE_WIDTH +
      '" style="width: ' +
      VALUE_WIDTH +
      'px; ' +
      spacerCellStyle +
      '">&nbsp;</td>' +
      '</tr>'
    );
  }

  /** HELPER: Baris penuh tanpa label kiri */
  function createFullWidthRow(html) {
    if (isEmptyValue(html)) return '';

    return '<tr><td colspan="2" style="' + CONFIG.styles.valueCell + '">' + html + '</td></tr>';
  }

  /** HELPER: Judul Utama Tabel */
  function createTableHeader(text) {
    return (
      '<tr bgcolor="#2E1065" style="background-color: #2E1065;">' +
      '<td colspan="2" bgcolor="#2E1065" style="' +
      CONFIG.styles.header +
      '">' +
      escapeHTML(text) +
      '</td></tr>'
    );
  }

  /** HELPER: Sub-Header Proyek/Tanggal */
  function createProjectSubHeader(text) {
    return (
      '<tr bgcolor="#4C1D95" style="background-color: #4C1D95;">' +
      '<td colspan="2" bgcolor="#4C1D95" style="' +
      CONFIG.styles.projectSubHeader +
      '">' +
      escapeHTML(text) +
      '</td></tr>'
    );
  }

  function createDateSubHeader(text) {
    return (
      '<tr bgcolor="#5B21B6" style="background-color: #5B21B6;">' +
      '<td colspan="2" bgcolor="#5B21B6" style="' +
      CONFIG.styles.dateSubHeader +
      '">' +
      escapeHTML(text) +
      '</td></tr>'
    );
  }
  /* ==========================================================================
     SECTION HEADERS (CUSTOMIZABLE INDIVIDUALLY)
  ========================================================================== */

  // 1. Project Summary
  function createProjectSummaryHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">PROJECT SUMMARY</td></tr>'
    );
  }

  // 2. Audio Highlights
  function createAudioHighlightsHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">AUDIO HIGHLIGHTS</td></tr>'
    );
  }

  // 3. General Highlights
  function createGeneralHighlightsHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">GENERAL HIGHLIGHTS</td></tr>'
    );
  }

  // 4. Update Follow-up
  function createUpdateFollowUpHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">UPDATE FOLLOW-UP</td></tr>'
    );
  }

  // 5. Questions
  function createQuestionsHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">QUESTIONS</td></tr>'
    );
  }

  // 6. Milestones
  function createMilestonesHeader() {
    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">MILESTONES</td></tr>'
    );
  }

  // 7. TVB Content (With Link Capability)
  function createTvbHeader(link) {
    const title = 'TVB CONTENT';

    const displayTitle = !isEmptyValue(link)
      ? '<a href="' +
        escapeHTML(link) +
        '" target="_blank" style="' +
        CONFIG.styles.link +
        '">' +
        title +
        '</a>'
      : title;

    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">' +
      displayTitle +
      '</td></tr>'
    );
  }

  // 8. Heatmap Content (With Link Capability)
  function createHeatmapHeader(link) {
    const title = 'HEATMAP CONTENT';

    const displayTitle = !isEmptyValue(link)
      ? '<a href="' +
        escapeHTML(link) +
        '" target="_blank" style="' +
        CONFIG.styles.link +
        '">' +
        title +
        '</a>'
      : title;

    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">' +
      displayTitle +
      '</td></tr>'
    );
  }

  // 9. Platforms Tracking (With Link Capability)
  function createPlatformsHeader(link) {
    const title = 'PLATFORMS TRACKING';

    const displayTitle = !isEmptyValue(link)
      ? '<a href="' +
        escapeHTML(link) +
        '" target="_blank" style="' +
        CONFIG.styles.link +
        '">' +
        title +
        '</a>'
      : title;

    return (
      '<tr bgcolor="#EDE9FE" style="background-color: #EDE9FE;">' +
      '<td colspan="2" bgcolor="#EDE9FE" style="background-color: #EDE9FE; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #4C1D95; text-align: left; border-bottom: 2px solid #e1d8f5; font-family: ' +
      FONT_STACK +
      '; line-height: 18px; mso-line-height-rule: exactly; text-transform: uppercase;">' +
      displayTitle +
      '</td></tr>'
    );
  }

  /** Susun seluruh tabel report. */
  function generateReportHTML(data) {
    const rows = [];

    // 0. Spacer row — kunci lebar kolom label/value sebelum konten lain masuk
    rows.push(createSpacerRow());

    // 1. Judul Utama
    rows.push(createTableHeader('Audio QA - Project Status Report'));

    // 2. Sub-Judul Proyek
    const dynamicParts = [data.projectName, data.projectType, data.updateNumber];

    const filteredParts = dynamicParts.filter((part) => !isEmptyValue(part));

    const dynamicSubtitle = filteredParts.join(' - ');

    if (!isEmptyValue(dynamicSubtitle)) {
      rows.push(createProjectSubHeader(dynamicSubtitle));
    }

    // 3. Tanggal
    const formattedDate = formatDate(data.reportDate);

    if (formattedDate) {
      rows.push(createDateSubHeader(formattedDate));
    }

    // --- SECTION: Project Summary ---
    rows.push(createProjectSummaryHeader());

    rows.push(createRow('Version', escapeHTML(data.version)));

    rows.push(createRow('Build Link', escapeHTML(data.buildLink)));

    rows.push(
      createRow(
        'Total Issues',
        isEmptyValue(data.totalIssuesLink)
          ? escapeHTML(data.totalIssues)
          : createLinkHtml(data.totalIssuesLink, data.totalIssues)
      )
    );

    rows.push(
      createRow(
        'Major Issues',
        isEmptyValue(data.majorIssuesLink)
          ? escapeHTML(data.majorIssues)
          : createLinkHtml(data.majorIssuesLink, data.majorIssues)
      )
    );

    rows.push(
      createRow('Licensed Content', createStatusBadge(data.licensedContent, data.licensedNote))
    );

    rows.push(
      createRow('Audio Credits', createStatusBadge(data.audioCredits, data.audioCreditsNote))
    );

    rows.push(
      createRow('Result Status', createStatusBadge(data.resultStatus, data.resultStatusNote))
    );

    if (!isEmptyValue(data.testers)) {
      rows.push(createRow('Testers', escapeHTML(data.testers)));

      // Row Audio QA Lead hanya akan ditambahkan jika baris Tester juga muncul
      rows.push(createRow('Audio QA Lead', escapeHTML(data.qaLead)));
    }

    // --- SECTION: Audio Highlights ---
    if (!isEmptyValue(data.audioHighlights)) {
      rows.push(createAudioHighlightsHeader());
      rows.push(createFullWidthRow(data.audioHighlights));
    }

    // --- SECTION: General Highlights ---
    if (!isEmptyValue(data.generalHighlights)) {
      rows.push(createGeneralHighlightsHeader());
      rows.push(createFullWidthRow(data.generalHighlights));
    }

    // --- SECTION: Update Follow-up ---
    if (!isEmptyValue(data.updateFollowUp)) {
      rows.push(createUpdateFollowUpHeader());
      rows.push(createFullWidthRow(data.updateFollowUp));
    }

    // --- SECTION: Questions ---
    if (!isEmptyValue(data.questions)) {
      rows.push(createQuestionsHeader());
      rows.push(createFullWidthRow(data.questions));
    }

    // --- SECTION: Milestones ---
    if (!isEmptyValue(data.milestones)) {
      rows.push(createMilestonesHeader());
      rows.push(createFullWidthRow(data.milestones));
    }

    // --- SECTION: TVB Content (Smart Header) ---
    if (!isEmptyValue(data.tvbContent)) {
      rows.push(createTvbHeader(data.tvbLink));
      rows.push(createFullWidthRow(data.tvbContent));
    }

    // --- SECTION: Heatmap Content (Smart Header) ---
    if (!isEmptyValue(data.heatmapContent)) {
      rows.push(createHeatmapHeader(data.heatmapLink));
      rows.push(createFullWidthRow(data.heatmapContent));
    }

    // --- SECTION: Platforms Tracking (Smart Header) ---
    if (!isEmptyValue(data.platformsTracking)) {
      rows.push(createPlatformsHeader(data.platformsLink));
      rows.push(createFullWidthRow(data.platformsTracking));
    }

    // Footer
    rows.push(createTableFooter('Audio QA'));

    const body = rows.join('');

    if (body === '') return '';

    return (
      // FIX: width tetap (bukan "100%"). Atribut align sengaja DIHAPUS —
      // align="left"/"right" pada <table> di Word/Outlook membuat tabel jadi
      // floating element (mirip float:left), yang bikin intro/outro jadi
      // nempel/nyamping. Tabel block biasa sudah rata kiri tanpa perlu align.
      '<table role="presentation" cellpadding="0" cellspacing="0" width="' +
      TABLE_WIDTH +
      '" style="' +
      CONFIG.styles.table +
      '">' +
      body +
      '</table>'
    );
  }

  /* ==========================================================================
     RENDER / PUBLIC API
  ========================================================================== */

  window.updateEmailPreview = function updateEmailPreview() {
    const container = document.getElementById(CONFIG.previewContainerId);

    if (!container) return;

    let html = '';

    try {
      const data = getFormDataForPreview();
      const tableHtml = generateReportHTML(data);

      // Jika tabel tidak kosong, kita buat wrapper dengan Intro dan Outro
      if (tableHtml && !isEmptyValue(tableHtml)) {
        const projectName = data.projectName || 'Project'; // Fallback jika nama proyek kosong

        const formattedDate = formatDate(data.reportDate);

        // Gaya untuk teks pembuka dan penutup agar konsisten dengan tabel
        const textStyle =
          'font-family: ' +
          FONT_STACK +
          '; font-size: 14px; color: ' +
          CONTENT_COLOR +
          '; line-height: 1.6;';

        // 1. Konstruksi Intro
        // CATATAN: margin/padding di <div> TIDAK dipakai lagi di sini — terbukti
        // selalu dibuang Word (baik shorthand maupun longhand) saat <div> diubah
        // jadi <p class=MsoNormal>. Jarak vertikal sekarang ditangani oleh
        // createSpacerBlock() (tabel spacer) di bawah, bukan margin/padding.
        const introHtml =
          '<div style="' +
          textStyle +
          '">' +
          'Hello everyone,<br><br>' +
          'Please find below the <strong>' +
          escapeHTML(projectName) +
          '</strong> report for ' +
          formattedDate +
          ' :<br>' +
          '</div>';

        // 2. Konstruksi Outro
        const outroHtml =
          '<div style="' +
          textStyle +
          '">' +
          'That concludes the <strong>' +
          escapeHTML(projectName) +
          '</strong> report.<br><br>' +
          'Thank you for taking a moment to review the progress.<br><br>' +
          'Best Regards,' +
          '</div>';

        /**
         * HELPER: Tabel spacer 1 baris 1 kolom dengan tinggi tetap.
         * Dipakai untuk jarak vertikal antar section, menggantikan
         * margin/padding di <div> yang terbukti selalu dibuang Word.
         * Polanya sama persis dengan createSpacerRow() di dalam tabel utama,
         * yang sudah terbukti bertahan setelah paste ke Outlook.
         */
        function createSpacerBlock(heightPx) {
          return (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">' +
            '<tr><td style="height: ' +
            heightPx +
            'px; line-height: ' +
            heightPx +
            'px; font-size: 1px; mso-line-height-rule: exactly;">&nbsp;</td></tr>' +
            '</table>'
          );
        }

        // Gabungkan semuanya: Intro + Spacer + Tabel + Spacer + Outro
        html = introHtml + createSpacerBlock(20) + tableHtml + createSpacerBlock(20) + outroHtml;
      } else {
        // Jika tabel kosong, biarkan html kosong untuk memicu placeholder
        html = '';
      }
    } catch (err) {
      console.error('[email-preview] Gagal membuat preview:', err);

      return;
    }

    if (html) {
      container.innerHTML = html;
    } else {
      container.innerHTML =
        '<p style="margin: 0; color: #6b7280; font-style: italic;">' +
        escapeHTML(CONFIG.emptyPlaceholder) +
        '</p>';
    }
  };

  /* ==========================================================================
     LIVE PREVIEW LISTENERS
  ========================================================================== */

  let updateScheduled = false;

  function scheduleUpdate() {
    if (updateScheduled) return;

    updateScheduled = true;

    const run = function () {
      updateScheduled = false;
      window.updateEmailPreview();
    };

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
    }
  }

  function setupFormListeners() {
    const form = document.getElementById(CONFIG.formId);

    if (!form) return;

    form.addEventListener('input', scheduleUpdate);

    form.addEventListener('change', scheduleUpdate);
  }

  function setupTinyMceListeners() {
    if (!window.tinymce || typeof window.tinymce.on !== 'function') {
      return;
    }

    const bindEditor = function (editor) {
      if (!editor || editor.__emailPreviewBound) {
        return;
      }

      editor.__emailPreviewBound = true;

      editor.on('init change input keyup undo redo SetContent blur', scheduleUpdate);
    };

    CONFIG.tinyMceIds.forEach(function (id) {
      const editor = window.tinymce.get ? window.tinymce.get(id) : null;

      if (editor) {
        bindEditor(editor);
      }
    });

    window.tinymce.on('AddEditor', function (e) {
      if (CONFIG.tinyMceIds.indexOf(e.editor.id) !== -1) {
        bindEditor(e.editor);
      }
    });
  }

  function waitForEditorsReady(callback, timeoutMs) {
    if (!window.tinymce) {
      callback();
      return;
    }

    const deadline = Date.now() + (timeoutMs || 5000);

    const check = function () {
      const allReady = CONFIG.tinyMceIds.every((id) => {
        const editor = window.tinymce.get ? window.tinymce.get(id) : null;

        return editor && editor.initialized;
      });

      if (allReady || Date.now() > deadline) {
        callback();
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  }

  function init() {
    setupFormListeners();
    setupTinyMceListeners();
    window.updateEmailPreview();

    waitForEditorsReady(() => scheduleUpdate());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {
      once: true,
    });
  } else {
    init();
  }
})();
