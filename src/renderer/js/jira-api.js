/**
 * jira-api.js
 * JIRA API INTERFACE MODULE
 *
 * TUJUAN UTAMA:
 * Mengelola interaksi pengguna saat mencoba menghubungkan aplikasi ke Jira.
 * Skrip ini mengambil email dan token dari form, mengirimkannya ke mesin penguji (qaToolkit),
 * dan menampilkan pesan sukses atau gagal kepada pengguna di layar.
 */

// Menunggu sampai seluruh struktur halaman HTML selesai dimuat agar elemen bisa ditemukan
document.addEventListener('DOMContentLoaded', () => {
  // --- REFERENSI ELEMEN (Mengambil elemen yang ada di HTML) ---
  const jiraForm = document.getElementById('jira-settings-form');
  const testBtn = document.querySelector('[data-action="test-jira"]'); // Tombol "Test Connection"
  const statusDiv = document.getElementById('jira-status'); // Tempat muncul pesan (Error/Sukses)
  const userDisplay = document.getElementById('jira-connected-user'); // Tempat menampilkan nama user yang login

  // Jika tombol test ditemukan di halaman, pasang fungsi kliknya
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const email = document.getElementById('jira-email').value;
      const token = document.getElementById('jira-api-token').value;
      const avatarImg = document.getElementById('jira-avatar'); // Ambil elemen gambar

      if (!email || !token) {
        statusDiv.textContent = '⚠️ Please fill in both Email and Token';
        statusDiv.className = 'status error';
        return;
      }

      statusDiv.textContent = '⏳ Testing connection...';
      testBtn.disabled = true;

      try {
        const result = await window.qaToolkit.testJiraConnection({ email, token });

        if (result.success) {
          statusDiv.textContent = '✅ Connected';
          statusDiv.style.color = 'green';
          userDisplay.textContent = result.message.split('as: ')[1] || '-';

          // Tampilkan avatar jika ada URL-nya
          if (result.avatarUrl) {
            avatarImg.src = result.avatarUrl;
            avatarImg.style.display = 'block'; // Munculkan gambar
          } else {
            avatarImg.style.display = 'none'; // Sembunyikan jika tidak ada avatar
          }
        } else {
          statusDiv.textContent = result.message;
          statusDiv.style.color = 'red';
          userDisplay.textContent = '-';
          avatarImg.style.display = 'none'; // Sembunyikan jika gagal
        }
      } catch (err) {
        statusDiv.textContent = '❌ Critical Error occurred.';
        console.error(err);
        avatarImg.style.display = 'none';
      } finally {
        testBtn.disabled = false;
      }
    });
  }
});
