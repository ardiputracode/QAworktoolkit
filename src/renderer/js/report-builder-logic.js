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

/**
 * FUNGSI SUPER DIALOG
 */
function showCustomDialog(mode, message) {
  return new Promise((resolve) => {
    let isResolved = false;
    const safeResolve = (value) => {
      if (!isResolved) {
        isResolved = true;
        resolve(value);
      }
    };

    infoMsg.textContent = message;
    saveNameContainer.style.display = 'none';
    dialogCancelBtn.style.display = 'none';
    dialogConfirmBtn.textContent = 'OK';
    draftNameInput.value = '';

    if (mode === 'confirm') {
      dialogCancelBtn.style.display = 'inline-block';
      dialogConfirmBtn.textContent = 'Ya';
    } else if (mode === 'prompt') {
      saveNameContainer.style.display = 'block';
      dialogConfirmBtn.textContent = 'Simpan';
    }

    const handleClose = () => {
      infoDialog.removeEventListener('close', handleClose);
      if (!isResolved) safeResolve(mode === 'prompt' ? '' : false);
    };
    infoDialog.addEventListener('close', handleClose);

    const formElement = infoDialog.querySelector('form');
    const handleFormSubmit = (e) => {
      if (mode === 'confirm') safeResolve(true);
      else if (mode === 'prompt') safeResolve(draftNameInput.value.trim());
      else safeResolve(true);
    };
    formElement.addEventListener('submit', handleFormSubmit);

    dialogCancelBtn.onclick = () => {
      infoDialog.close();
      safeResolve(false);
    };
    infoDialog.showModal();
  });
}

// --- CORE FUNCTIONS ---

function getFormData() {
  const formData = new FormData(form);
  const data = {};
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
  form.reset();
  Object.keys(data).forEach((key) => {
    const element = form.elements[key];
    if (!element || key === 'stepDescription' || key === 'noteDetails' || key === 'testers') return;
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
}

function reconstructDynamicList(containerId, templateId, values) {
  if (!values || !Array.isArray(values)) return;
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  container.innerHTML = '';
  values.forEach((val) => {
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('[data-row-input]');
    if (input) input.value = val;
    container.appendChild(clone);
  });
}

// --- UI HANDLERS ---

async function refreshDraftsList() {
  const drafts = await dbManager.getAllDrafts();
  const container = document.getElementById('drafts-list-container');

  if (drafts.length === 0) {
    container.innerHTML =
      '<p class="empty-msg" style="padding: 1rem; color: var(--text-muted);">No saved drafts found.</p>';
    return;
  }

  container.innerHTML = '';

  drafts.forEach((draft) => {
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
    loadBtn.className = 'btn btn--primary btn--toolbar-small';
    loadBtn.textContent = '📝 Open';
    loadBtn.onclick = async () => {
      const isConfirmed = await showCustomDialog('confirm', `Buka draft "${draft.name}"?`);
      if (isConfirmed) {
        fillForm(draft.data);
        showToast(`Draft "${draft.name}" berhasil dibuka!`, 'success');
      }
    };

    // 2. Button Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn--danger btn--toolbar-small';
    deleteBtn.textContent = '🧹 Delete';
    deleteBtn.onclick = async () => {
      const isConfirmed = await showCustomDialog('confirm', `Hapus draft "${draft.name}"?`);
      if (isConfirmed) {
        await dbManager.deleteDraft(draft.id);
        showToast(`Draft "${draft.name}" dihapus!`, 'success');
        refreshDraftsList();
      }
    };

    // 3. Button Export Single (Per Draft)
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn--primary btn--toolbar-small';
    exportBtn.textContent = '📤 Export';
    exportBtn.title = 'Export this draft only';
    exportBtn.onclick = () => handleExportSingle(draft);

    // 4. Button Import/Replace Single (Per Draft)
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn--primary btn--toolbar-small';
    importBtn.textContent = '📥 Import';
    importBtn.title = 'Import & Replace this specific draft';
    importBtn.onclick = () => {
      activeImportTargetId = draft.id;
      globalImportInput.click();
    };

    actionsDiv.appendChild(loadBtn);
    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(exportBtn);
    actionsDiv.appendChild(importBtn);
    draftRow.appendChild(infoDiv);
    draftRow.appendChild(actionsDiv);
    container.appendChild(draftRow);
  });
}

// =====================================================================
// LOGIC: EXPORT & IMPORT (SMART MODE)
// =====================================================================

/**
 * [SINGLE] Export satu draft spesifik
 */
/**
 * [SINGLE] Export satu draft spesifik
 * Menggunakan File System Access API agar bisa menunggu user selesai menyimpan
 */
async function handleExportSingle(draft) {
  const content = JSON.stringify(draft, null, 2);
  const fileName = `${draft.name.replace(/\s+/g, '_')}_export.json`;

  // 1. Cek apakah browser mendukung modern File System Access API (Chrome/Edge)
  if (window.showSaveFilePicker) {
    try {
      // Ini akan memunculkan dialog dan "menunggu" sampai user klik SAVE atau CANCEL
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'JSON File',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      // Membuat stream untuk menulis file
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Toast ini BARU muncul setelah file benar-benar selesai ditulis ke disk
      showToast(`Draft "${draft.name}" berhasil diekspor!`, 'success');
    } catch (err) {
      // Jika user menekan "Cancel", kita tidak ingin menampilkan error/toast sukses
      if (err.name === 'AbortError') {
        console.log('User membatalkan proses simpan.');
      } else {
        console.error(err);
        showToast('Gagal mengekspor file.', 'error');
      }
    }
  } else {
    // 2. FALLBACK: Jika browser lama (seperti Firefox/Safari) tidak mendukung API di atas
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    // Karena di mode fallback kita tidak bisa tahu kapan user selesai,
    // kita ubah pesan toastnya menjadi "dimulai" agar jujur secara UX.
    showToast(`Proses ekspor "${draft.name}" dimulai...`, 'info');
  }
}

/**
 * [SMART IMPORT]
 * Jika activeImportTargetId ada -> Ganti draft lama (Replace)
 * Jika activeImportTargetId null -> Buat draft baru (Create New)
 */
async function handleSmartImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = ''; // Reset input agar bisa pilih file yang sama lagi jika gagal

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      let importedData;

      // 1. Tahap Parsing JSON
      try {
        importedData = JSON.parse(e.target.result);
      } catch (jsonErr) {
        throw new Error('Format file bukan JSON yang valid.');
      }

      // 2. Tahap Validasi Struktur
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('File kosong atau format tidak dikenal.');
      }

      // Cek apakah properti wajib (name dan data) ada
      if (!importedData.name || !importedData.data) {
        throw new Error('Format file salah: Data atau Nama draft tidak ditemukan dalam file.');
      }

      // 3. Konfirmasi Mode (Replace vs New)
      const isReplaceMode = activeImportTargetId !== null;
      const modeMsg = isReplaceMode ? 'MENGGANTI' : 'MEMBUAT BARU';

      const isConfirmed = await showCustomDialog(
        'confirm',
        `Import ini akan ${modeMsg} draft. Lanjutkan?`
      );

      if (isConfirmed) {
        // Siapkan objek draft baru
        const newDraft = {
          ...(isReplaceMode ? { id: activeImportTargetId } : {}),
          name: importedData.name,
          timestamp: Date.now(),
          data: importedData.data,
        };

        // 4. Tahap Penyimpanan ke Database
        try {
          await dbManager.saveDraft(newDraft);
          showToast(`Berhasil! Draft "${newDraft.name}" diproses.`, 'success');
        } catch (dbErr) {
          // Jika error terjadi di database (misal: ID duplikat atau masalah storage)
          throw new Error(`Gagal menyimpan ke database: ${dbErr.message}`);
        }

        // Reset target setelah selesai agar tidak salah mode di klik berikutnya
        activeImportTargetId = null;
        refreshDraftsList();
      }
    } catch (err) {
      // Tampilkan pesan error yang sebenarnya (dari 'throw new Error')
      showToast(err.message, 'error');
      console.error('Detailed Import Error:', err);
    }
  };
  reader.readAsText(file);
}

// Inisialisasi tombol Save
saveBtn.onclick = async () => {
  const name = await showCustomDialog('prompt', 'Masukkan nama untuk draft ini:');
  if (!name) {
    await showCustomDialog('alert', 'Nama tidak boleh kosong!');
    return;
  }
  const formData = getFormData();
  const draftToSave = { name, timestamp: Date.now(), data: formData };
  await dbManager.saveDraft(draftToSave);
  showToast(`Draft "${name}" tersimpan!`, 'success');
  refreshDraftsList();
};

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  refreshDraftsList();

  // Toolbar Global Actions
  const btnImportGlobal = document.getElementById('btn-import-global');
  if (btnImportGlobal) {
    btnImportGlobal.onclick = () => {
      activeImportTargetId = null; // Pastikan mode "Create New" jika klik dari toolbar
      globalImportInput.click();
    };
  }

  // Listeners untuk input file
  if (globalImportInput) {
    globalImportInput.onchange = handleSmartImport;
  }
});

export { fillForm, refreshDraftsList };
