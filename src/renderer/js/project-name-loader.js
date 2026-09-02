/**
 * PROJECT NAME LOADER MODULE
 *
 * TUJUAN UTAMA:
 * Skrip ini berfungsi untuk mengambil daftar nama proyek dari sebuah file JSON
 * (data.json) dan memasukkannya secara otomatis ke dalam elemen pilihan (dropdown/select)
 * di halaman HTML. Dengan begitu, kita tidak perlu menulis manual satu per satu di HTML.
 */

// Menampilkan log status saat file berhasil dimuat oleh browser
console.log(
  '%c[System] Project Name Loader Module: File Loaded ✅',
  'color: #0284c7; font-weight: bold;'
);

/**
 * EVENT LISTENER: DOMContentLoaded
 * Menunggu sampai seluruh struktur HTML (DOM) selesai dimuat dan siap dimanipulasi.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log(
    '%c[System] Project Name Loader Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  try {
    /**
     * LANGKAH A: MENCARI ELEMEN TARGET
     * Mencari elemen HTML yang memiliki ID 'project-name'.
     * Elemen ini biasanya berupa tag <select> (dropdown).
     */
    const projectNameSelect = document.getElementById('project-name');

    // Jika elemen tidak ditemukan, hentikan proses agar tidak terjadi error di tahap selanjutnya
    if (!projectNameSelect) {
      console.warn('[Warning] Target element #project-name not found in DOM ⚠️');
      return;
    }

    /**
     * LANGKAH B: MENGAMBIL DATA (FETCHING)
     * Mengambil file eksternal bernama 'data.json' yang berada di dalam folder '/js/'.
     */
    const response = await fetch('./js/data.json');

    // Cek apakah proses pengambilan file berhasil (status HTTP 200-299)
    if (!response.ok) {
      console.warn(`[Warning] Failed to fetch data.json: ${response.statusText} ⚠️`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    /**
     * LANGKAH C: MENGUBAH DATA MENJADI OBJEK JAVASCRIPT (PARSING)
     * Mengubah format mentah dari file JSON menjadi objek yang bisa dibaca oleh JavaScript.
     */
    const data = await response.json();

    /**
     * LANGKAH D: MANIPULASI DOM (MENGISI DROPDOWN)
     * Memeriksa apakah data memiliki properti "projectNames" dan berupa sebuah daftar (Array).
     */
    if (data.projectNames && Array.isArray(data.projectNames)) {
      console.log('[Debug] Populating project name options...');

      // Melakukan perulangan untuk setiap item di dalam daftar projectNames
      data.projectNames.forEach((name) => {
        // Membuat elemen baru <option> untuk dimasukkan ke dalam dropdown
        const option = document.createElement('option');

        // Mengisi nilai (value) dan teks yang terlihat (label/textContent) dari data JSON
        option.value = name.value;
        option.textContent = name.label;

        // Memasukkan elemen <option> tersebut ke dalam elemen #project-name di HTML
        projectNameSelect.appendChild(option);
      });

      console.log(
        '%c[Action] Project Names loaded successfully! 🚀',
        'color: #10b981; font-weight: bold;'
      );
    } else {
      // Jika format JSON tidak sesuai dengan yang diharapkan (tidak ada array projectNames)
      console.warn('[Warning] JSON structure is invalid or "projectNames" array is missing ⚠️');
    }
  } catch (error) {
    /**
     * PENANGANAN ERROR (ERROR HANDLING)
     * Jika terjadi kesalahan di langkah mana pun dalam blok 'try', pesan error akan ditangkap di sini.
     */
    console.error(
      '%c[Error] Project Name Loader Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }
});
