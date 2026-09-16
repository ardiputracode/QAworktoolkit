// js/bug-formatter-autosave.js
//
// Autosave khusus untuk form-section di halaman Bug Description Formatter
// (#bug-report-form). Fungsinya sengaja dibuat mirip dengan autosave di
// report-builder-save-logic.js (debounce -> save ke IndexedDB -> restore
// otomatis saat halaman dibuka), TAPI seluruhnya di-scope ketat ke
// #bug-report-form supaya tidak mengulang bug ID-collision yang pernah
// terjadi (reconstructDynamicList milik Report Builder sempat salah
// membersihkan #step-list/#note-list milik halaman ini).
//
// Catatan penting:
// - ID autosave (BUG_AUTOSAVE_ID) SENGAJA dibuat unik & berbeda dari
//   AUTOSAVE_FIXED_ID milik Report Builder ('autosave-special-entry'),
//   supaya tidak saling menimpa entry di IndexedDB yang sama.
// - Field "openwebuiModel" SENGAJA tidak diautosave/direstore. Opsinya
//   di-populate async oleh openwebui-api.js, dan tanpa event "ready" yang
//   jelas untuk ditunggu, memaksa restore value di sini berisiko
//   menimbulkan race condition yang sama seperti kasus project-name di
//   Report Builder. Memilih model juga lebih tepat dianggap pilihan
//   runtime, bukan bagian dari draft bug report itu sendiri.
// - Ini HANYA fitur autosave (auto-save + auto-restore terakhir), BUKAN
//   manajemen draft bernama/manual seperti di Report Builder (tidak ada
//   Save As/Open/Delete/Export/Import). Kalau nanti dibutuhkan, tinggal
//   dikembangkan lebih lanjut mengikuti pola yang sama.

import { dbManager } from './db-manager.js';
import { showToast } from './toast-notification.js';

const form = document.getElementById('bug-report-form');

// ID unik untuk entry autosave form ini di IndexedDB. Prefix "autosave-"
// disamakan dengan punya Report Builder supaya keduanya bisa dikenali &
// difilter bersama-sama dari daftar "Saved Drafts" manual (lihat perubahan
// terkait di report-builder-save-logic.js).
const BUG_AUTOSAVE_ID = 'autosave-bug-description-formatter';

let lastAutosaveToastTime = 0;

function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function getFormData() {
  const data = {};
  if (!form) return data;

  const formData = new FormData(form);

  formData.forEach((value, key) => {
    // Lihat catatan di atas: model tidak ikut diautosave.
    if (key === 'openwebuiModel') return;

    if (key.endsWith('[]')) {
      const realKey = key.replace('[]', '');
      data[realKey] = data[realKey] || [];
      data[realKey].push(value);
    } else {
      data[key] = value;
    }
  });

  // Jaga-jaga kalau suatu saat textarea di form ini di-enhance jadi rich
  // text editor (TinyMCE), mengikuti pola yang sama dengan Report Builder.
  // Saat ini textarea di bug-report-form masih textarea polos, jadi blok
  // ini akan no-op secara natural (tinymce.get(...) akan selalu null).
  form.querySelectorAll('textarea').forEach((textarea) => {
    if (typeof tinymce === 'undefined') return;
    const editor = tinymce.get(textarea.id);
    if (editor) data[textarea.name] = editor.getContent();
  });

  return data;
}

function reconstructDynamicList(containerId, templateId, values) {
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  if (!container || !template) return;

  // GUARD WAJIB: hanya boleh memanipulasi container yang benar-benar ada
  // di dalam #bug-report-form. document.getElementById() mencari ke
  // SELURUH dokumen, jadi tanpa guard ini kita bisa salah membersihkan
  // list milik form lain (persis bug yang pernah terjadi sebelumnya).
  if (!form || !form.contains(container)) return;

  container.innerHTML = '';

  if (!values || !Array.isArray(values)) return;

  values.forEach((val) => {
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('[data-row-input]');
    if (input) input.value = val;
    container.appendChild(clone);
  });
}

function fillForm(data) {
  if (!form || !data) return;

  form.reset();

  Object.keys(data).forEach((key) => {
    // stepDescription & noteDetails ditangani terpisah lewat
    // reconstructDynamicList; openwebuiModel sengaja tidak direstore.
    if (key === 'stepDescription' || key === 'noteDetails' || key === 'openwebuiModel') {
      return;
    }

    const element = form.elements[key];
    if (!element) return;

    if (typeof tinymce !== 'undefined') {
      const editor = tinymce.get(element.id);
      if (editor) {
        editor.setContent(data[key]);
        return;
      }
    }

    if (element.type !== 'checkbox') {
      element.value = data[key];
    }
  });

  reconstructDynamicList('step-list', 'step-row-template', data.stepDescription);
  reconstructDynamicList('note-list', 'note-row-template', data.noteDetails);

  form.dispatchEvent(new Event('input', { bubbles: true }));
}

async function performAutoSave() {
  try {
    const formData = getFormData();

    const autoSaveDraft = {
      id: BUG_AUTOSAVE_ID,
      name: 'Bug Formatter Auto Save',
      timestamp: Date.now(),
      data: formData,
    };

    await dbManager.saveDraft(autoSaveDraft);

    const now = Date.now();

    if (now - lastAutosaveToastTime > 10000) {
      showToast('Autosave Bug Description berhasil!', 'info');
      lastAutosaveToastTime = now;
    }
  } catch (err) {
    console.error('[Bug Formatter Autosave] Auto-save failed:', err);
  }
}

const debouncedAutoSave = debounce(performAutoSave, 1000);

async function loadAutosaveIfAvailable() {
  try {
    const drafts = await dbManager.getAllDrafts();
    const autosaveEntry = drafts.find((d) => d.id === BUG_AUTOSAVE_ID);

    if (autosaveEntry) {
      fillForm(autosaveEntry.data);

      console.log('%c[System] Bug Formatter Autosave: data dimuat otomatis. ✅', 'color: #10b981;');

      showToast('Data autosave Bug Description dimuat.', 'info');
    }
  } catch (err) {
    console.error('[Bug Formatter Autosave] Failed to load autosave:', err);
  }
}

if (form) {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadAutosaveIfAvailable();
    form.addEventListener('input', debouncedAutoSave);
  });
}

export { fillForm, getFormData };
