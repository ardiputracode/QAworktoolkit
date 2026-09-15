/**
 * Logic untuk menangani Info Dialog menggunakan data dari JSON
 */
// Variabel global untuk menyimpan data info yang sudah diambil
let dialogInfoData = {};

// [NEW] Fungsi Global untuk menampilkan Dialog Konfirmasi
// Memungkinkan modul lain (seperti jira-api.js) menampilkan modal konfirmasi dengan desain yang konsisten
window.showConfirmationDialog = function (title, message, onConfirm) {
  const dialog = document.getElementById('info-dialog');
  const infoTitle = document.getElementById('info-dialog-title');
  const messageElement = document.getElementById('info-dialog-message');
  const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
  const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');

  if (!dialog || !messageElement) return;

  // Atur UI ke mode Konfirmasi
  if (infoTitle) infoTitle.textContent = title;
  messageElement.innerHTML = message;

  if (dialogCancelBtn) {
    dialogCancelBtn.style.display = 'block'; // Tampilkan tombol Batal
    dialogCancelBtn.onclick = () => dialog.close();
  }

  if (dialogConfirmBtn) {
    dialogConfirmBtn.textContent = 'Ya, Lanjutkan'; // Ubah teks tombol
    dialogConfirmBtn.onclick = () => {
      onConfirm(); // Jalankan fungsi callback
      dialog.close();
    };
  }

  dialog.showModal();
};

// [NEW] Fungsi Global untuk menampilkan Info Dialog (hanya tombol OK)
// Digunakan untuk peringatan atau informasi yang tidak memerlukan pilihan "Ya/Tidak"
window.showInfoDialog = function (title, message) {
  const dialog = document.getElementById('info-dialog');
  const infoTitle = document.getElementById('info-dialog-title');
  const messageElement = document.getElementById('info-dialog-message');
  const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
  const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');

  if (!dialog || !messageElement) return;

  // Atur UI ke mode Informasi
  if (infoTitle) infoTitle.textContent = title;
  messageElement.innerHTML = message;

  // Sembunyikan tombol Batal agar hanya ada tombol OK
  if (dialogCancelBtn) dialogCancelBtn.style.display = 'none';

  if (dialogConfirmBtn) {
    dialogConfirmBtn.textContent = 'OK';
    dialogConfirmBtn.onclick = () => dialog.close();
  }

  dialog.showModal();
};

async function initInfoDialog() {
  const dialog = document.getElementById('info-dialog');
  const infoTitle = document.getElementById('info-dialog-title'); // Tambahkan ini
  const messageElement = document.getElementById('info-dialog-message');
  const saveNameContainer = document.getElementById('save-name-container');
  // Elemen tombol untuk reset (Penting!)
  const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
  const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
  // 1. Ambil data dari file JSON
  try {
    const response = await fetch('js/dialog-data.json'); // Pastikan path sesuai
    if (!response.ok) throw new Error('Gagal mengambil file dialog-data.json');
    dialogInfoData = await response.json();
    console.log('✅ Info data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading info data:', error);
    messageElement.textContent = 'Maaf, informasi tidak dapat dimuat saat ini.';
  }
  // 2. Gunakan Event Delegation untuk mendengarkan klik pada semua tombol info
  document.addEventListener('click', (event) => {
    const infoBtn = event.target.closest('[data-action="open-info"]');
    if (!infoBtn) return;
    // --- BAGIAN RESET UI (SOLUSI MASALAH KAMU) ---
    // Setiap kali tombol info diklik, kita paksa dialog kembali ke mode 'Informasi' agar tidak tertinggal state Konfirmasi
    if (infoTitle) infoTitle.textContent = 'Informasi';
    if (dialogCancelBtn) dialogCancelBtn.style.display = 'none'; // Sembunyikan kembali tombol Batal
    if (dialogConfirmBtn) dialogConfirmBtn.textContent = 'OK'; // Kembalikan teks ke OK
    // Tambahkan handler klik untuk OK agar hanya menutup dialog
    if (dialogConfirmBtn) {
      dialogConfirmBtn.onclick = () => {
        document.getElementById('info-dialog').close();
      };
    }
    // ----------------------------------------------
    const infoKey = infoBtn.getAttribute('data-info-key');
    const targetDialogId = infoBtn.getAttribute('data-dialog-target');
    const targetDialog = document.getElementById(targetDialogId);
    if (!targetDialog || !messageElement) return;
    // 3. Isi pesan berdasarkan key yang cocok
    const message = dialogInfoData[infoKey];
    messageElement.innerHTML = message ? message : 'Informasi tidak tersedia.';
    // Logika tambahan: Jika tombolnya berkaitan dengan 'savedDraft', tampilkan input nama
    if (infoKey === 'promptSaveDraft') {
      saveNameContainer.style.display = 'block';
    } else {
      saveNameContainer.style.display = 'none';
    }
    // 4. Tampilkan dialog secara modal
    targetDialog.showModal();
  });
}
// Jalankan fungsi inisialisasi
initInfoDialog();
