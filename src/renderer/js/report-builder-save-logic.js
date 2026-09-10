// js/report-builder-logic.js
import { dbManager } from './db-manager.js';
import { showToast } from './toast-notification.js';

const form = document.getElementById('report-builder-form');
const draftsContainer = document.getElementById('drafts-list-container');
const saveBtn = document.getElementById('btn-save-draft');

// Elemen Dialog
const infoDialog = document.getElementById('info-dialog');
const infoTitle = document.getElementById('info-dialog-title');
const infoMsg = document.getElementById('info-dialog-message');
const saveNameContainer = document.getElementById('save-name-container');
const draftNameInput = document.getElementById('draft-name-input');
const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');

// --- Elemen Import ---
const globalImportInput = document.getElementById('global-import-input');
let activeImportTargetId = null; // Null jika ingin buat baru, berisi ID jika ingin replace

// --- Elemen Clear Form ---
// Cari tombol clear KHUSUS milik report-builder-form (bukan bug-report-form),
// karena atribut data-action="clear-form" dipakai bersama di beberapa form.
const clearFormBtn = document.querySelector(
  '[data-action="clear-form"][data-form-id="report-builder-form"]'
);

/**
 * FUNGSI BARU: Memperbarui tampilan Home berdasarkan data autosave
 */
function updateHomeSection(draft) {
  const titleEl = document.getElementById('home-recent-title');
  const timeEl = document.getElementById('home-recent-timestamp');

  if (!titleEl || !timeEl) return;

  // Jika ada draft (khususnya autosave)
  if (draft && draft.id === AUTOSAVE_FIXED_ID) {
    // Mengambil nama project dari data form, jika kosong pakai 'Untitled'
    const projectName = draft.data?.projectName?.trim() || 'Untitled Project';
    titleEl.textContent = `QA Progress Report — ${projectName}`;

    // Format tanggal ke format lokal Indonesia (Contoh: 24 Mei 2024, 14:00)
    const dateStr = new Date(draft.timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    timeEl.textContent = `Last edited ${dateStr}`;
  } else {
    // Jika tidak ada autosave, tampilkan state kosong
    titleEl.textContent = 'No recent work';
    timeEl.textContent = 'Last edited -';
  }
}

/**
 * FUNGSI SUPER DIALOG
 */
function showCustomDialog(mode, message) {
  // Guard: kalau elemen dialog inti tidak ada di DOM, jangan sampai throw.
  if (!infoDialog || !infoMsg || !dialogConfirmBtn) {
    console.error('Dialog elements are missing from the DOM.');
    return Promise.resolve(mode === 'prompt' ? '' : false);
  }

  return new Promise((resolve) => {
    let isResolved = false;
    const safeResolve = (value) => {
      if (!isResolved) {
        isResolved = true;
        resolve(value);
      }
    };

    if (infoTitle) {
      infoTitle.textContent =
        mode === 'confirm' ? 'Konfirmasi' : mode === 'prompt' ? 'Simpan Draft' : 'Informasi';
    }

    infoMsg.textContent = message;
    if (saveNameContainer) saveNameContainer.style.display = 'none';
    if (dialogCancelBtn) dialogCancelBtn.style.display = 'none';
    dialogConfirmBtn.textContent = 'OK';
    if (draftNameInput) draftNameInput.value = '';

    if (mode === 'confirm') {
      if (dialogCancelBtn) dialogCancelBtn.style.display = 'inline-block';
      dialogConfirmBtn.textContent = 'Ya';
    } else if (mode === 'prompt') {
      if (saveNameContainer) saveNameContainer.style.display = 'block';
      dialogConfirmBtn.textContent = 'Simpan';
    }

    // Pakai assignment ke properti onclose/onsubmit (bukan addEventListener)
    // supaya listener lama otomatis tertimpa tiap dialog dibuka -> tidak menumpuk.
    const handleClose = () => {
      if (!isResolved) safeResolve(mode === 'prompt' ? '' : false);
    };
    infoDialog.onclose = handleClose;

    const formElement = infoDialog.querySelector('form');
    const handleFormSubmit = () => {
      if (mode === 'confirm') safeResolve(true);
      else if (mode === 'prompt') safeResolve(draftNameInput ? draftNameInput.value.trim() : '');
      else safeResolve(true);
    };
    if (formElement) formElement.onsubmit = handleFormSubmit;

    if (dialogCancelBtn) {
      dialogCancelBtn.onclick = () => {
        infoDialog.close();
        safeResolve(false);
      };
    }

    infoDialog.showModal();
  });
}

// --- CORE FUNCTIONS ---

function getFormData() {
  const data = {};
  if (!form) return data;

  const formData = new FormData(form);
  formData.forEach((value, key) => {
    if (key.endsWith('[]')) {
      const realKey = key.replace('[]', '');
      data[realKey] = data[realKey] || [];
      data[realKey].push(value);
    } else {
      data[key] = value;
    }
  });

  const textareas = form.querySelectorAll('textarea');
  textareas.forEach((textarea) => {
    const editor = tinymce.get(textarea.id);
    if (editor) data[textarea.name] = editor.getContent();
  });

  const testers = Array.from(form.querySelectorAll('input[name="testers"]:checked')).map(
    (cb) => cb.value
  );
  if (testers.length > 0) data.testers = testers;

  return data;
}

function fillForm(data) {
  if (!form || !data) return;

  form.reset();
  Object.keys(data).forEach((key) => {
    const element = form.elements[key];
    if (!element || key === 'stepDescription' || key === 'noteDetails' || key === 'testers') return;

    // FIX: form.elements[key] bisa berupa RadioNodeList kalau key adalah radio group.
    // RadioNodeList tidak punya .id seperti element biasa, jadi harus ditangani
    // terpisah SEBELUM masuk ke logic TinyMCE (tinymce.get(element.id) akan salah
    // kalau dijalankan pada RadioNodeList).
    if (element instanceof RadioNodeList) {
      element.value = data[key];
      return;
    }

    // FIX RACE CONDITION: Skip field project-name di sini.
    // Alasannya: <select> project-name di-populate secara async oleh
    // project-name-loader.js (API Google Sheets). Jika fillForm dijalankan
    // sebelum options tersedia, assignment .value akan diabaikan oleh browser
    // karena tidak ada <option> yang cocok.
    // Nilai project-name akan di-set terpisah oleh applyProjectNameValue()
    // setelah event 'project-names-ready' terpicu.
    if (element.id === 'project-name') {
      return;
    }

    const editor = tinymce.get(element.id);
    if (editor) editor.setContent(data[key]);
    else if (element.type !== 'checkbox') element.value = data[key];
  });

  if (data.testers && Array.isArray(data.testers)) {
    data.testers.forEach((val) => {
      const cb = form.querySelector(`input[name="testers"][value="${val}"]`);
      if (cb) cb.checked = true;
    });
  }
  reconstructDynamicList('step-list', 'step-row-template', data.stepDescription);
  reconstructDynamicList('note-list', 'note-row-template', data.noteDetails);
  form.dispatchEvent(new Event('input'));
}

function reconstructDynamicList(containerId, templateId, values) {
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  if (!container || !template) return;

  // Bersihkan container terlebih dahulu, baru cek validitas values.
  // Ini mencegah data dynamic list dari draft sebelumnya tertinggal
  // ketika draft baru tidak punya data untuk list ini.
  container.innerHTML = '';

  if (!values || !Array.isArray(values)) return;

  values.forEach((val) => {
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('[data-row-input]');
    if (input) input.value = val;
    container.appendChild(clone);
  });
}

/**
 * Helper: sinkronisasi UI yang bergantung pada data form (Project Type visibility,
 * Subject Auto Fill), supaya logic-nya sama persis dipakai baik dari flow
 * autosave maupun flow Open Draft. Jangan duplicate logic ini di tempat lain.
 */
function syncDependentUI() {
  if (typeof ProjectTypeLoader !== 'undefined') {
    ProjectTypeLoader.updateVisibility();
  }

  if (typeof SubjectAutoFill !== 'undefined' && SubjectAutoFill.update) {
    SubjectAutoFill.update();
  }
}

// =====================================================================
// FIX RACE CONDITION: WAIT FOR PROJECT NAMES
// =====================================================================

/**
 * HELPER: Promise yang resolve ketika event 'project-names-ready' terpicu
 * oleh project-name-loader.js.
 *
 * Jika options sudah lebih dulu load (misal karena loader selesai lebih cepat
 * dari init autosave), langsung resolve tanpa menunggu.
 * Jika API gagal, tetap resolve (fallback timeout 8 detik) supaya aplikasi
 * tidak stuck selamanya.
 */
function waitForProjectNamesReady() {
  const select = document.getElementById('project-name');
  if (!select) return Promise.resolve();

  // Cek apakah sudah ada options selain placeholder.
  // > 1 karena ada 1 option default "-- Select Project --"
  if (select.options.length > 1) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 8000); // fallback: max tunggu 8 detik
    const handler = () => {
      clearTimeout(timeout);
      resolve();
    };
    select.addEventListener('project-names-ready', handler, { once: true });
  });
}

/**
 * SET NILAI PROJECT NAME setelah options sudah tersedia di <select>.
 * Dipanggil setelah waitForProjectNamesReady() resolve, memastikan
 * <option> target sudah ada di DOM sebelum assignment .value.
 *
 * @param {string} savedValue - Value project name yang tersimpan di autosave/draft.
 */
function applyProjectNameValue(savedValue) {
  const select = document.getElementById('project-name');
  if (!select || !savedValue) return;

  // Cari apakah option dengan value ini sudah ada di dropdown
  const existingOption = Array.from(select.options).find((opt) => opt.value === savedValue);

  if (existingOption) {
    select.value = savedValue;
    // Trigger event 'input' supaya debouncedAutoSave & SubjectAutoFill ikut sync
    form.dispatchEvent(new Event('input'));
    syncDependentUI();
    console.log('[System] Project name value applied: ' + savedValue);
  } else {
    // Value dari autosave tidak ditemukan di daftar project
    // (mungkin project dihapus dari Google Sheets)
    console.warn(`[Warning] Project name "${savedValue}" tidak ditemukan di daftar options. Dropdown tetap kosong.`);
  }
}

// --- UI HANDLERS ---

async function refreshDraftsList() {
  if (!draftsContainer) return;

  let drafts;
  try {
    drafts = await dbManager.getAllDrafts();
  } catch (err) {
    console.error('Failed to load drafts:', err);
    showToast('Gagal memuat daftar draft.', 'error');
    return;
  }

  // --- FILTER AUTOSAVE SEBELUM CEK KOSONG ---
  const manualDrafts = drafts.filter((draft) => draft.id !== AUTOSAVE_FIXED_ID);

  if (manualDrafts.length === 0) {
    draftsContainer.innerHTML =
      '<p class="empty-msg" style="padding: 1rem; color: var(--text-muted);">No saved drafts found.</p>';
    return;
  }

  draftsContainer.innerHTML = '';

  manualDrafts.forEach((draft) => {
    const draftRow = document.createElement('div');
    draftRow.className = 'draft-item';
    draftRow.style = `display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color, #ddd);`;

    const infoDiv = document.createElement('div');
    infoDiv.style = 'display: flex; flex-direction: column; gap: 0.25rem;';

    const nameTitle = document.createElement('strong');
    nameTitle.textContent = draft.name;
    nameTitle.style = 'font-size: 1rem; color: var(--text-primary);';

    const dateSmall = document.createElement('small');
    dateSmall.textContent = new Date(draft.timestamp).toLocaleString();
    dateSmall.style = 'color: var(--text-muted); font-size: 0.8rem;';

    infoDiv.appendChild(nameTitle);
    infoDiv.appendChild(dateSmall);

    const actionsDiv = document.createElement('div');
    actionsDiv.style = 'display: flex; gap: 5px;';

    // 1. Button Open
    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'btn btn--primary btn--toolbar-small';
    loadBtn.textContent = '📝 Open';
    loadBtn.onclick = async () => {
      const isConfirmed = await showCustomDialog('confirm', `Buka draft "${draft.name}"?`);
      if (isConfirmed) {
        fillForm(draft.data);
        // FIX: Set project name value setelah fillForm (options sudah ready saat user klik Open)
        if (draft.data?.projectName) {
          applyProjectNameValue(draft.data.projectName);
        }
        syncDependentUI();
        showToast(`Draft "${draft.name}" berhasil dibuka!`, 'success');
      }
    };

    // 2. Button Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--danger btn--toolbar-small';
    deleteBtn.textContent = '🧹 Delete';
    deleteBtn.onclick = async () => {
      const isConfirmed = await showCustomDialog('confirm', `Hapus draft "${draft.name}"?`);
      if (isConfirmed) {
        try {
          await dbManager.deleteDraft(draft.id);
          showToast(`Draft "${draft.name}" dihapus!`, 'success');
          refreshDraftsList();
        } catch (err) {
          console.error('Failed to delete draft:', err);
          showToast('Gagal menghapus draft.', 'error');
        }
      }
    };

    // 3. Button Export Single (Per Draft)
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'btn btn--primary btn--toolbar-small';
    exportBtn.textContent = '📤 Export';
    exportBtn.title = 'Export this draft only';
    exportBtn.onclick = () => handleExportSingle(draft);

    // 4. Button Import/Replace Single (Per Draft)
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'btn btn--primary btn--toolbar-small';
    importBtn.textContent = '📥 Import';
    importBtn.title = 'Import & Replace this specific draft';
    importBtn.onclick = () => {
      activeImportTargetId = draft.id;
      if (globalImportInput) globalImportInput.click();
    };

    actionsDiv.appendChild(loadBtn);
    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(exportBtn);
    actionsDiv.appendChild(importBtn);

    draftRow.appendChild(infoDiv);
    draftRow.appendChild(actionsDiv);
    draftsContainer.appendChild(draftRow);
  });
}

// =====================================================================
// LOGIC: EXPORT & IMPORT (SMART MODE)
// =====================================================================

async function handleExportSingle(draft) {
  const content = JSON.stringify(draft, null, 2);
  // Sanitasi whitespace + karakter yang tidak valid untuk nama file Windows: < > : " / \ | ? *
  const safeName = draft.name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
  const fileName = `${safeName}_export.json`;

  if (window.showSaveFilePicker) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      showToast(`Draft "${draft.name}" berhasil diekspor!`, 'success');
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('User membatalkan proses simpan.');
      } else {
        console.error(err);
        showToast('Gagal mengekspor file.', 'error');
      }
    }
  } else {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Proses ekspor "${draft.name}" dimulai...`, 'info');
  }
}

async function handleSmartImport(event) {
  const file = event.target.files[0];
  if (!file) {
    // Tidak ada file terpilih (mis. beberapa browser tetap memicu 'change' dengan
    // FileList kosong saat dialog dibatalkan) -> pastikan target replace direset
    // supaya proses import berikutnya tidak salah mode.
    activeImportTargetId = null;
    return;
  }
  event.target.value = '';

  const reader = new FileReader();

  // Kalau FileReader gagal membaca file, jangan tinggalkan activeImportTargetId
  // dalam keadaan stale (replace mode nyangkut ke draft yang salah).
  reader.onerror = () => {
    console.error('Failed to read file:', reader.error);
    showToast('Gagal membaca file.', 'error');
    activeImportTargetId = null;
  };

  reader.onload = async (e) => {
    try {
      let importedData;
      try {
        importedData = JSON.parse(e.target.result);
      } catch (jsonErr) {
        throw new Error('Format file bukan JSON yang valid.');
      }

      if (!importedData || typeof importedData !== 'object' || Array.isArray(importedData)) {
        throw new Error('File kosong atau format tidak dikenal.');
      }

      if (typeof importedData.name !== 'string' || importedData.name.trim() === '') {
        throw new Error('Format file salah: Nama draft tidak ditemukan atau tidak valid.');
      }

      if (
        !importedData.data ||
        typeof importedData.data !== 'object' ||
        Array.isArray(importedData.data)
      ) {
        throw new Error('Format file salah: Data draft tidak ditemukan atau tidak valid.');
      }

      const isReplaceMode = activeImportTargetId !== null;
      const modeMsg = isReplaceMode ? 'MENGGANTI' : 'MEMBUAT BARU';

      const isConfirmed = await showCustomDialog(
        'confirm',
        `Import ini akan ${modeMsg} draft. Lanjutkan?`
      );

      if (isConfirmed) {
        const newDraft = {
          ...(isReplaceMode ? { id: activeImportTargetId } : {}),
          name: importedData.name,
          timestamp: Date.now(),
          data: importedData.data,
        };

        try {
          await dbManager.saveDraft(newDraft);
          showToast(`Berhasil! Draft "${newDraft.name}" diproses.`, 'success');
        } catch (dbErr) {
          console.error('Failed to save imported draft:', dbErr);
          throw new Error(`Gagal menyimpan ke database: ${dbErr.message}`);
        }

        refreshDraftsList();
      }
    } catch (err) {
      showToast(err.message, 'error');
      console.error('Detailed Import Error:', err);
    } finally {
      // Selalu reset target replace, baik sukses, gagal, dibatalkan, maupun JSON invalid,
      // supaya proses import berikutnya tidak salah replace draft.
      activeImportTargetId = null;
    }
  };

  reader.readAsText(file);
}

if (saveBtn) {
  saveBtn.onclick = async () => {
    const name = await showCustomDialog('prompt', 'Masukkan nama untuk draft ini:');
    if (!name) {
      await showCustomDialog('alert', 'Nama tidak boleh kosong!');
      return;
    }

    const formData = getFormData();
    const draftToSave = { name, timestamp: Date.now(), data: formData };

    try {
      await dbManager.saveDraft(draftToSave);
      showToast(`Draft "${name}" tersimpan!`, 'success');
      refreshDraftsList();
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('Gagal menyimpan draft.', 'error');
    }
  };
}

// =====================================================================
// LOGIC: CLEAR FORM
// =====================================================================

/**
 * FUNGSI: clearReportBuilderForm
 * Mengosongkan SELURUH input user di report-builder-form, lalu:
 * 1. Menyinkronkan ulang UI turunan (visibility Project Type & Subject Auto Fill
 *    preview), supaya subject yang auto-generate ikut ter-reset ke kosong.
 * 2. Memperbarui autosave secara langsung (bukan lewat debounce) supaya draft
 *    autosave di DB dan tampilan "Continue Your Work" di Home ikut konsisten
 *    dengan form yang sudah kosong.
 *
 * Catatan: form.reset() TIDAK menyentuh instance TinyMCE (karena textarea
 * aslinya sudah di-hide oleh TinyMCE) dan TIDAK memicu event 'input'/'change',
 * jadi keduanya harus ditangani manual di sini.
 */
async function clearReportBuilderForm() {
  if (!form) return;

  // 1. Reset semua native form control: text/number/url/date input, select,
  //    textarea (yang tidak dikontrol TinyMCE), dan checkbox/radio bawaan.
  form.reset();

  // 2. Kosongkan seluruh TinyMCE editor yang menempel di textarea form ini.
  form.querySelectorAll('textarea').forEach((textarea) => {
    const editor = tinymce.get(textarea.id);
    if (editor) editor.setContent('');
  });

  // 3. Jaga-jaga: pastikan semua checkbox testers benar-benar ter-uncheck.
  form.querySelectorAll('input[name="testers"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  // 4. Sinkronkan UI yang bergantung pada data form: visibility Project Type
  //    field, dan yang paling penting, Subject Auto Fill (Monthly/Date/Week
  //    subject preview) supaya ikut kosong begitu form dikosongkan.
  syncDependentUI();

  // 5. Simpan state kosong ini ke autosave SEKARANG JUGA (tidak menunggu
  //    debounce 1 detik), supaya draft autosave & Home section langsung sinkron.
  await performAutoSave();
  form.dispatchEvent(new Event('input'));
  showToast('Form berhasil dikosongkan.', 'success');
}

if (clearFormBtn) {
  clearFormBtn.addEventListener('click', async () => {
    const isConfirmed = await showCustomDialog(
      'confirm',
      'Kosongkan seluruh input di form ini? Autosave juga akan ikut diperbarui.'
    );
    if (isConfirmed) {
      await clearReportBuilderForm();
    }
  });
}

// =====================================================================
// LOGIC: AUTO-SAVE (REFINED VERSION)
// =====================================================================

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const AUTOSAVE_FIXED_ID = 'autosave-special-entry';

/**
 * TRACKER UNTUK NOTIFIKASI (Throttling)
 * Kita mencatat kapan terakhir kali toast autosave muncul.
 */
let lastAutosaveToastTime = 0;

// --- Update fungsi performAutoSave agar memanggil updateHomeSection ---
async function performAutoSave() {
  try {
    const formData = getFormData();
    const autoSaveDraft = {
      id: AUTOSAVE_FIXED_ID,
      name: 'Auto Save',
      timestamp: Date.now(),
      data: formData,
    };

    await dbManager.saveDraft(autoSaveDraft);

    // UPDATE DI SINI: Panggil fungsi update UI
    updateHomeSection(autoSaveDraft);

    const now = Date.now();
    if (now - lastAutosaveToastTime > 10000) {
      showToast('Autosave berhasil!', 'info');
      lastAutosaveToastTime = now;
    }
  } catch (err) {
    console.error('Auto-save failed:', err);
  }
}

const debouncedAutoSave = debounce(performAutoSave, 1000);

async function loadAutosaveIfAvailable() {
  try {
    const drafts = await dbManager.getAllDrafts();
    const autosaveEntry = drafts.find((d) => d.id === AUTOSAVE_FIXED_ID);

    if (autosaveEntry) {
      fillForm(autosaveEntry.data);

      // FIX: Set project name value secara terpisah.
      // fillForm() sengaja skip field project-name (lihat komentar di fillForm).
      // Di sini kita set nilainya karena saat ini options sudah pasti tersedia
      // (dijamin oleh await waitForProjectNamesReady() di init di bawah).
      if (autosaveEntry.data?.projectName) {
        applyProjectNameValue(autosaveEntry.data.projectName);
      }

      // UPDATE DI SINI: Panggil fungsi update UI saat pertama kali load
      updateHomeSection(autosaveEntry);
      syncDependentUI();
      console.log('%c[System] Autosave data loaded automatically. ✅', 'color: #10b981;');
      showToast('Data autosave dimuat otomatis.', 'info');
    } else {
      // Jika tidak ada autosave, reset tampilan home ke kosong
      updateHomeSection(null);
    }
  } catch (err) {
    console.error('Failed to load autosave:', err);
  }
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', async () => {
  refreshDraftsList();

  // FIX RACE CONDITION: Tunggu project name options ter-load dari Google Sheets
  // SEBELUM load autosave. Jika tidak, fillForm() akan mencoba set .value pada
  // <select> yang masih kosong (tidak ada <option>), dan browser akan mengabaikan
  // assignment tersebut.
  await waitForProjectNamesReady();

  await loadAutosaveIfAvailable();

  const btnImportGlobal = document.getElementById('btn-import-global');
  if (btnImportGlobal) {
    btnImportGlobal.onclick = () => {
      activeImportTargetId = null;
      if (globalImportInput) globalImportInput.click();
    };
  }

  if (globalImportInput) {
    globalImportInput.onchange = handleSmartImport;

    // Sebagian browser modern memicu event 'cancel' pada <input type="file">
    // saat dialog picker ditutup tanpa memilih file sama sekali (di kasus ini
    // 'change' tidak pernah terpicu). Tangani supaya activeImportTargetId
    // (yang di-set sesaat sebelum picker dibuka untuk mode replace) tidak
    // nyangkut/stale. Assignment lewat properti (bukan addEventListener)
    // supaya tidak ada listener yang menumpuk.
    globalImportInput.oncancel = () => {
      activeImportTargetId = null;
    };
  }

  if (form) {
    form.addEventListener('input', debouncedAutoSave);
  }
});

export { fillForm, refreshDraftsList, clearReportBuilderForm };