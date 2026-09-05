/**
 * Sistem Notifikasi Toast Reusable
 */

const toastContainer = document.getElementById('toast-container');

/**
 * Menampilkan notifikasi di pojok kanan atas
 * @param {string} message - Teks yang ingin ditampilkan
 * @param {string} type - 'success', 'error', atau 'info'
 */
export function showToast(message, type = 'success') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  // Memberikan class dasar dan class tipe (untuk warna)
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  // Tambahkan ke container
  toastContainer.appendChild(toast);

  // Hapus otomatis setelah 3 detik
  setTimeout(() => {
    toast.classList.add('fade-out'); // Animasi menghilang
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });

    // Fallback jika transisi gagal
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
