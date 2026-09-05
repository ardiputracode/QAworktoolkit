/**
 * Logic untuk menangani Info Dialog menggunakan data dari JSON
 */

// Variabel global untuk menyimpan data info yang sudah diambil
let dialogInfoData = {};

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
    // Setiap kali tombol info diklik, kita paksa dialog kembali ke mode 'Informasi'
    if (infoTitle) infoTitle.textContent = 'Informasi';
    if (dialogCancelBtn) dialogCancelBtn.style.display = 'none'; // Sembunyikan tombol Batal
    if (dialogConfirmBtn) dialogConfirmBtn.textContent = 'OK'; // Kembalikan ke OK
    // ----------------------------------------------

    const infoKey = infoBtn.getAttribute('data-info-key');
    const targetDialogId = infoBtn.getAttribute('data-dialog-target');
    const targetDialog = document.getElementById(targetDialogId);

    if (!targetDialog || !messageElement) return;

    // 3. Isi pesan berdasarkan key yang cocok
    const message = dialogInfoData[infoKey];
    messageElement.textContent = message ? message : 'Informasi tidak tersedia.';

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
