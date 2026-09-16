/**
 * bug-formatter-logic.js
 * BUG DESCRIPTION FORMATTER COMPREHENSIVE MODULE
 *
 * TUJUAN UTAMA:
 * 1. Mengatur state tombol "Generate Bug Description" berdasarkan kondisi dropdown "Select Model".
 * 2. Mengelola penambahan dan penghapusan baris input secara dinamis pada Steps to Reproduce dan Additional Notes.
 * 3. Menghindari request API jika konfigurasi belum lengkap.
 */

// Import dbManager untuk menghapus data autosave di IndexedDB [3]
import { dbManager } from './db-manager.js';

// ID unik autosave agar sinkron dengan bug-formatter-autosave.js [2]
const BUG_AUTOSAVE_ID = 'autosave-bug-description-formatter';

// --- TAHAP 1: LOADED ---
console.log(
  '%c[System] Bug Formatter Module: File Loaded ✅',
  'color: #0284c7; font-weight: bold;'
);
document.addEventListener('DOMContentLoaded', () => {
  // --- TAHAP 2: INITIALIZATION SEQUENCE ---
  console.log(
    '%c[System] Bug Formatter Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );
  try {
    /**
     * =========================================================================
     * BAGIAN A: VALIDASI TOMBOL GENERATE
     * =========================================================================
     */
    console.log('[Debug] Step 1: Linking form elements for validation...');
    const modelSelect = document.getElementById('openwebui-model-select');
    const bugForm = document.getElementById('bug-report-form');
    // Karena tombol tidak punya ID di HTML, kita cari tombol submit di dalam form bug-report-form
    const generateBtn = bugForm ? bugForm.querySelector('button[type="submit"]') : null;
    if (!modelSelect || !generateBtn) {
      throw new Error('Required elements (model-select or generate-btn) not found in DOM.');
    }
    /**
     * LOGIKA VALIDASI (Inti)
     * Menentukan apakah tombol boleh diklik atau tidak.
     */
    const validateGenerateButton = () => {
      const isDisabled = modelSelect.disabled || modelSelect.value === '';
      if (generateBtn.disabled !== isDisabled) {
        generateBtn.disabled = isDisabled;
        // Visual feedback
        generateBtn.style.opacity = isDisabled ? '0.5' : '1';
        generateBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        console.log(
          `%c[Action] Button state updated: ${isDisabled ? 'Disabled 🔒' : 'Enabled ✅'}`,
          `color: ${isDisabled ? '#ef4444' : '#10b981'}; font-weight: bold;`
        );
      }
    };
    // 1. Pantau perubahan nilai (Manual oleh User)
    modelSelect.addEventListener('change', () => {
      console.log('%c[User Interaction] Model selection changed 🖱️', 'color: #f59e0b;');
      validateGenerateButton();
    });
    // 2. Pantau perubahan atribut 'disabled' (Otomatis oleh Script lain)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'disabled') {
          console.log('%c[System] Detected attribute change: disabled ⚠️', 'color: #8b5cf6;');
          validateGenerateButton();
        }
      });
    });
    observer.observe(modelSelect, { attributes: true });
    // Jalankan validasi awal saat halaman dimuat
    validateGenerateButton();
    /**
     * =========================================================================
     * BAGIAN B: MANAJEMEN BARIS DINAMIS (Add/Remove Rows)
     * =========================================================================
     */
    console.log('[Debug] Step 2: Initializing dynamic list managers...');
    /**
     * FUNGSI INTERNAL: Update Penomoran Label
     * Mengatur ulang teks label agar urut (1, 2, 3...) setelah aksi tambah/hapus.
     */
    const updateRowNumbers = (listId, prefix) => {
      const list = document.getElementById(listId);
      if (!list) return;
      const labels = list.querySelectorAll('.row-label');
      labels.forEach((label, index) => {
        label.textContent = `${prefix} ${index + 1}`;
      });
    };
    /**
     * LOGIKA: MENAMBAH BARIS (Add Row)
     */
    const handleAddRow = (event) => {
      const btn = event.currentTarget;
      if (btn.dataset.action !== 'add-row') return;
      const targetListId = btn.dataset.targetList;
      const templateId = btn.dataset.templateId;
      const listContainer = document.getElementById(targetListId);
      const template = document.getElementById(templateId);
      if (!listContainer || !template) {
        console.error(`[Error] Target list or template not found: ${targetListId} / ${templateId}`);
        return;
      }
      // 1. Kloning konten dari template
      const clone = template.content.cloneNode(true);
      // 2. Tambahkan baris ke container
      listContainer.appendChild(clone);
      // 3. Update penomoran label
      const firstLabel = listContainer.querySelector('.row-label');
      const prefix = firstLabel ? firstLabel.textContent.replace(/\d+$/, '').trim() : 'Item';
      updateRowNumbers(targetListId, prefix);
      console.log(
        `%c[Action] Row Added ➕ to ${targetListId}. Total rows: ${listContainer.querySelectorAll('.dynamic-row').length}`,
        'color: #10b981; font-weight: bold;'
      );
    };
    /**
     * LOGIKA: MENGHAPUS BARIS (Remove Row)
     */
    const handleRemoveRow = (event) => {
      const btn = event.target;
      if (btn.dataset.action !== 'remove-row') return;
      const row = btn.closest('.dynamic-row');
      if (!row) return;
      const listContainer = row.closest('.dynamic-list');
      if (!listContainer) return;
      const listId = listContainer.id;
      // Validasi: Hanya 'step-list' yang wajib punya minimal 1 baris.
      const allRows = listContainer.querySelectorAll('.dynamic-row');
      if (listId === 'step-list' && allRows.length <= 1) {
        console.warn(
          '%c[Warning] Cannot remove the last remaining row in Steps! ⚠️',
          'color: #f59e0b;'
        );
        window.showInfoDialog(
          'Peringatan',
          'Minimal harus ada satu langkah untuk mereproduksi bug.'
        );
        return;
      }
      // 1. Hapus elemen row
      row.remove();
      // 2. Update penomoran label
      const firstLabel = listContainer.querySelector('.row-label');
      const prefix = firstLabel ? firstLabel.textContent.replace(/\d+$/, '').trim() : 'Item';
      updateRowNumbers(listId, prefix);
      // --- TAMBAHAN: Trigger Autosave ---
      // Karena menghapus elemen DOM tidak memicu event 'input' secara alami,
      // kita harus mengirimkan event 'input' secara manual agar bug-formatter-autosave.js bereaksi.
      const bugForm = document.getElementById('bug-report-form');
      if (bugForm) {
        bugForm.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // --------------------------------
      console.log(
        `%c[Action] Row Removed 🗑️ from ${listId}. Remaining rows: ${listContainer.querySelectorAll('.dynamic-row').length}`,
        'color: #ef4444; font-weight: bold;'
      );
    };
    /**
     * =========================================================================
     * BAGIAN C: LOGIKA CLEAR FORM (Hapus Tampilan & IndexedDB Saja)
     * =========================================================================
     */
    const handleClearBugForm = (event) => {
      const btn = event.currentTarget;
      if (btn.dataset.action !== 'clear-bug-form') return;
      const formId = btn.dataset.formId;
      const form = document.getElementById(formId);
      if (!form) return;
      // GANTI: confirm() diganti dengan window.showConfirmationDialog [2]
      window.showConfirmationDialog(
        'Konfirmasi Hapus',
        'Apakah Anda yakin ingin menghapus semua input? Data yang terhapus tidak dapat dikembalikan.',
        async () => {
          // UPDATE: Ditambah async agar bisa menggunakan await untuk hapus database
          // Seluruh logika di bawah ini hanya berjalan jika user klik "Ya, Lanjutkan"
          try {
            // 2. Reset input standar (text, textarea, select)
            form.reset();
            // 3. Reset Dynamic Lists (Steps & Notes)
            const stepList = document.getElementById('step-list');
            if (stepList) {
              stepList.innerHTML = '';
              const stepTemplate = document.getElementById('step-row-template');
              if (stepTemplate) {
                const clone = stepTemplate.content.cloneNode(true);
                stepList.appendChild(clone);
              }
              updateRowNumbers('step-list', 'Step description');
            }
            const noteList = document.getElementById('note-list');
            if (noteList) {
              noteList.innerHTML = '';
            }

            // UPDATE: Menghapus LocalStorage dan hanya menggunakan IndexedDB [3]
            await dbManager.deleteDraft(BUG_AUTOSAVE_ID);

            console.log(
              '%c[Action] Bug Form and IndexedDB cleared successfully 🧹',
              'color: #ef4444; font-weight: bold;'
            );
            if (window.showToast) {
              window.showToast('Form and autosave data cleared successfully!', 'success');
            } else {
              //alert('Form and saved data have been cleared.');
            }
          } catch (error) {
            console.error('[Error] Failed to clear bug form:', error);
          }
        }
      );
    };
    // Tambahkan event listener ke dalam listener klik yang sudah ada di bug-formatter-logic.js
    document.addEventListener('click', (event) => {
      // ... (kode listener add-row dan remove-row yang sudah ada) ...
      // TAMBAHKAN INI:
      if (
        event.target.dataset.action === 'clear-bug-form' ||
        event.target.closest('button')?.dataset.action === 'clear-bug-form'
      ) {
        const clearBtn = event.target.closest('button[data-action="clear-bug-form"]');
        if (clearBtn) handleClearBugForm({ currentTarget: clearBtn });
      }
    });
    /**
     * EVENT LISTENERS UNTUK LIST DINAMIS
     * Menggunakan Event Delegation agar tombol Remove tetap berfungsi meskipun elemen baru dibuat.
     */
    document.addEventListener('click', (event) => {
      // Cek apakah yang diklik adalah tombol Add
      if (
        event.target.dataset.action === 'add-row' ||
        event.target.closest('button')?.dataset.action === 'add-row'
      ) {
        const addBtn = event.target.closest('button[data-action="add-row"]');
        if (addBtn) handleAddRow({ currentTarget: addBtn });
      }
      // Cek apakah yang diklik adalah tombol Remove
      if (event.target.dataset.action === 'remove-row') {
        handleRemoveRow(event);
      }
    });
    // --- TAHAP 3: SUCCESS ---
    console.log(
      '%c[System] Bug Formatter Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    console.error(
      '%c[Error] Bug Formatter Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
});
