/**
 * email-preview.js
 *
 * Versi Terbaru:
 * - Setiap bagian utama (Audio Highlights, General Highlights, dll)
 *   memiliki fungsi Header & Content sendiri agar mudah kustomisasi warna.
 */
(function () {
  'use strict';

  /* ==========================================================================
     KONSTANTA GLOBAL
  ========================================================================== */
  const FONT_STACK = "'Verdana', 'Segoe UI', Arial, Helvetica, sans-serif";
  const CONTENT_COLOR = '#0f172a';

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
        'border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; ' +
        'background-color: #ffffff; font-family: ' +
        FONT_STACK +
        '; font-size: 14px; line-height: 1.6; ' +
        'mso-line-height-rule: exactly; color: ' +
        CONTENT_COLOR +
        '; text-align: left; border: 1px solid #e2e8f0;',

      header:
        'background-color: #420769; color: #ffffff; padding: 12px 20px; ' +
        'font-size: 18px; font-weight: 700; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 1.3;',

      projectSubHeader:
        'background-color: #6B2A8F;; color: #ffffff; padding: 8px 20px; ' +
        'font-size: 16px; font-weight: 400; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 1.3;',

      dateSubHeader:
        'background-color: #A66BC2; color: #ffffff; padding: 5px 20px; ' +
        'font-size: 12px; font-weight: 400; text-align: left; font-family: ' +
        FONT_STACK +
        '; line-height: 1.3;',

      footer:
        'background-color: #f8fafc; color: #64748b; padding: 16px 20px; ' +
        'font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; ' +
        'font-family: ' +
        FONT_STACK +
        '; line-height: 1.4;',

      // Style dasar untuk sel konten (digunakan oleh semua full-width row)
      valueCellBase:
        'padding: 12px 16px; font-size: 14px; font-weight: 400; color: ' +
        CONTENT_COLOR +
        '; text-align: left; vertical-align: top; border-bottom: 1px solid #f1f5f9; ' +
        'font-family: ' +
        FONT_STACK +
        '; line-height: 1.6;',

      labelCell:
        'padding: 12px 16px; font-size: 14px; font-weight: 600; color: #334155; ' +
        'text-align: left; vertical-align: top; width: 250px; border-bottom: 1px solid #f1f5f9; ' +
        'background-color: #fafafa; font-family: ' +
        FONT_STACK +
        '; line-height: 1.6;',

      link:
        'color: #0ea5e9; text-decoration: none; font-weight: 500; font-family: ' + FONT_STACK + ';',
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
    const textOnly = value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;nbsp;/gi, ' ')
      .replace(/\u00A0/gi, ' ')
      .trim();
    return textOnly === '';
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
      '<tr><td width="250" style="' +
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
   * HELPER: Membuat baris penuh tanpa label kiri (untuk konten section)
   */
  function createFullWidthRow(html) {
    if (isEmptyValue(html)) return '';
    return '<tr><td colspan="2" style="' + CONFIG.styles.valueCell + '">' + html + '</td></tr>';
  }

  /**
   * HELPER: Membuat baris judul utama/header tabel
   */
  function createTableHeader(text) {
    return (
      '<tr><td colspan="2" style="' + CONFIG.styles.header + '">' + escapeHTML(text) + '</td></tr>'
    );
  }

  /**
   * HELPER: Membuat baris sub-header proyek/tanggal
   */
  function createProjectSubHeader(text) {
    return (
      '<tr><td colspan="2" style="' +
      CONFIG.styles.projectSubHeader +
      '">' +
      escapeHTML(text) +
      '</td></tr>'
    );
  }

  function createDateSubHeader(text) {
    return (
      '<tr><td colspan="2" style="' +
      CONFIG.styles.dateSubHeader +
      '">' +
      escapeHTML(text) +
      '</td></tr>'
    );
  }

  /* ==========================================================================
     SECTION HEADERS (DIREDEFINISI SENDIRI UNTUK KUSTOMISASI WARNA)
  ========================================================================== */

  // 1. Project Summary Header
  function createProjectSummaryHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">PROJECT SUMMARY</td></tr>'
    );
  }

  // 2. Audio Highlights Header
  function createAudioHighlightsHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">AUDIO HIGHLIGHTS</td></tr>'
    );
  }

  // 3. General Highlights Header
  function createGeneralHighlightsHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">GENERAL HIGHLIGHTS</td></tr>'
    );
  }

  // 4. Update Follow-up Header
  function createUpdateFollowUpHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">UPDATE FOLLOW-UP</td></tr>'
    );
  }

  // 5. Questions Header
  function createQuestionsHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">QUESTIONS</td></tr>'
    );
  }

  // 6. Milestones Header
  function createMilestonesHeader() {
    return (
      '<tr><td colspan="2" style="background-color: #f1f5f9; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; font-family: ' +
      FONT_STACK +
      '; text-transform: uppercase;">MILESTONES</td></tr>'
    );
  }

  /** Susun seluruh tabel report. */
  function generateReportHTML(data) {
    const rows = [];

    // 1. Baris Judul Utama (Besar)
    rows.push(createTableHeader('Audio QA - Project Status Report'));

    // 2. Baris Sub-Judul Dinamis Proyek
    const dynamicParts = [data.projectName, data.projectType, data.updateNumber];
    const filteredParts = dynamicParts.filter((part) => !isEmptyValue(part));
    const dynamicSubtitle = filteredParts.join(' - ');

    if (!isEmptyValue(dynamicSubtitle)) {
      rows.push(createProjectSubHeader(dynamicSubtitle));
    }

    // 3. Baris Tanggal
    const formattedDate = formatDate(data.reportDate);
    if (formattedDate) {
      rows.push(createDateSubHeader(formattedDate));
    }

    // --- SECTION: Project Summary ---
    rows.push(createProjectSummaryHeader());
    rows.push(createRow('Project Name', escapeHTML(data.projectName)));
    rows.push(createRow('Project Type', escapeHTML(data.projectType)));
    rows.push(createRow('Update Number', escapeHTML(data.updateNumber)));
    rows.push(createRow('Version', escapeHTML(data.version)));
    rows.push(createRow('Build Link', createLinkHtml(data.buildLink)));
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
    rows.push(createRow('Testers', escapeHTML(data.testers)));

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

    // --- OTHER DATA (Tetap menggunakan format Row karena datanya singkat) ---
    rows.push(createRow('TVB Link', createLinkHtml(data.tvbLink)));
    rows.push(createRow('TVB Content', data.tvbContent));
    rows.push(createRow('Heatmap Link', createLinkHtml(data.heatmapLink)));
    rows.push(createRow('Heatmap Content', data.heatmapContent));
    rows.push(createRow('Platforms Link', createLinkHtml(data.platformsLink)));
    rows.push(createRow('Platforms Tracking', data.platformsTracking));

    // Footer
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    rows.push(createTableFooter('Generated on ' + timestamp));

    const body = rows.join('');
    if (body === '') return '';

    return (
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="' +
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
      html = generateReportHTML(getFormDataForPreview());
    } catch (err) {
      console.error('[email-preview] Gagal membuat preview:', err);
      return;
    }
    if (html) {
      container.innerHTML = html;
    } else {
      container.innerHTML =
        '<p style="margin: 0; color: #6b7280; font-style: italic; font-family: ' +
        FONT_STACK +
        '; font-size: 14px; line-height: 1.6;">' +
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

  let formListenersAttached = false;
  function setupFormListeners() {
    if (formListenersAttached) return;
    const form = document.getElementById(CONFIG.formId);
    if (!form) return;
    formListenersAttached = true;
    form.addEventListener('input', scheduleUpdate);
    form.addEventListener('change', scheduleUpdate);
  }

  function setupTinyMceListeners() {
    if (!window.tinymce || typeof window.tinymce.on !== 'function') return;
    const bindEditor = function (editor) {
      if (!editor || editor.__emailPreviewBound) return;
      editor.__emailPreviewBound = true;
      editor.on('init change input keyup undo redo SetContent blur', scheduleUpdate);
    };
    CONFIG.tinyMceIds.forEach(function (id) {
      const editor = window.tinymce.get ? window.tinymce.get(id) : null;
      if (editor) bindEditor(editor);
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
      const allReady = CONFIG.tinyMceIds.every(function (id) {
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
    waitForEditorsReady(function () {
      scheduleUpdate();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
