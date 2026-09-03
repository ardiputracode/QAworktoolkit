/**
 * editor-init.js
 * EDITOR MODULE - ADVANCED OBSERVABILITY VERSION
 *
 * TUJUAN UTAMA:
 * 1. Mengubah kotak teks (textarea) menjadi editor teks canggih (TinyMCE).
 * 2. Menyediakan fitur pengetikan kaya (bold, italic, tabel, dll).
 * 3. SINKRONISASI TEMA: Memastikan editor mengikuti perubahan Dark/Light mode
 *    website agar tampilan tetap nyaman bagi mata.
 */

// --- TAHAP 1: LOADED (Konfirmasi file berhasil dimuat) ---
console.log('%c[System] Editor Module: File Loaded ✅', 'color: #0284c7; font-weight: bold;');

document.addEventListener('DOMContentLoaded', () => {
  // --- TAHAP 2: INITIALIZATION SEQUENCE ---
  console.log(
    '%c[System] Editor Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  /**
   * DESAIN INTERIOR (CSS untuk di dalam editor)
   * Karena TinyMCE berjalan di dalam "ruang terpisah" (iframe), CSS website utama
   * tidak akan masuk ke sana. Kita harus mengirimkan desain khusus ini agar
   * teks, tabel, dan blockquote terlihat cantik di dalam editor.
   */
  const tinyMceStyle = `
    body {
      --bg-editor: #ffffff;
      --text-editor: #0f172a;
      --link-color: #4f46e5;
      --blockquote-border: #0284c7;
      --blockquote-bg: rgba(2, 132, 199, 0.05);
      --blockquote-text: #475569;
      --code-bg: #f1f5f9;
      --code-border: rgba(0, 0, 0, 0.05);
      --table-border: rgba(0, 0, 0, 0.1);
      --table-th-bg: #f8fafc;

      background-color: var(--bg-editor) !important;
      color: var(--text-editor) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.55;
      margin: 1rem;
      -webkit-font-smoothing: antialiased;
      transition:
        background-color 0.3s ease,
        color 0.3s ease !important;
    }

    /* Gaya saat mode gelap aktif di dalam editor */
    body.dark-mode {
      --bg-editor: #0e0f13;
      --text-editor: #f8fafc;
      --link-color: #818cf8;
      --blockquote-border: #38bdf8;
      --blockquote-bg: rgba(56, 189, 248, 0.05);
      --blockquote-text: #94a3b8;
      --code-bg: #1e2028;
      --code-border: rgba(255, 255, 255, 0.07);
      --table-border: rgba(255, 255, 255, 0.12);
      --table-th-bg: #16181d;
    }

    a { color: var(--link-color) !important; text-decoration: none; transition: color 0.25s; }
    a:hover { text-decoration: underline; }

    blockquote {
      border-left: 4px solid var(--blockquote-border) !important;
      margin: 0 0 1.5rem 0; padding: 0.5rem 1rem;
      color: var(--blockquote-text) !important;
      font-style: italic; background: var(--blockquote-bg) !important;
      border-radius: 0 8px 8px 0; transition: all 0.25s;
    }

    code {
      background-color: var(--code-bg) !important; padding: 0.2rem 0.4rem;
      border-radius: 4px; font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em; color: var(--link-color) !important;
      border: 1px solid var(--code-border) !important; transition: all 0.25s;
    }

    table { border-collapse: collapse; width: 100%; border-radius: 8px; overflow: hidden; }
    table td, table th { border: 1px solid var(--table-border) !important; padding: 0.75rem; transition: border-color 0.25s; }
    table th { background-color: var(--table-th-bg) !important; font-weight: 600; text-align: left; transition: background-color 0.25s; }
  `;

  /**
   * DAFTAR AREA KERJA (Target IDs)
   * Semua ID yang ada di sini akan otomatis diubah menjadi editor TinyMCE.
   */
  const targetIds = [
    'audio-highlights',
    'general-highlights',
    'update-follow-up',
    'questions',
    'milestones',
    'tvb-content',
    'heatmap-content',
    'platforms-tracking',
  ];

  // Menggabungkan semua ID menjadi satu selector CSS (misal: "#id1, #id2, ...")
  const selector = targetIds.map((id) => `#${id}`).join(', ');

  // Koleksi untuk menyimpan semua instance editor yang aktif agar bisa kita kontrol nanti
  const editorInstances = new Set();

  /**
   * FUNGSI: isDarkTheme
   * Mengecek apakah website utama sedang dalam mode gelap.
   */
  function isDarkTheme() {
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.body.getAttribute('data-theme') === 'dark'
    );
  }

  /**
   * FUNGSI: applyEditorTheme
   * Menginstruksikan editor untuk memasang class 'dark-mode' pada body di dalam iframe.
   */
  function applyEditorTheme(editor) {
    const body = editor.getBody();
    if (!body) return;
    // Jika website utama gelap, pasang class dark-mode di dalam editor
    body.classList.toggle('dark-mode', isDarkTheme());
  }

  try {
    // --- TAHAP 3: ACTION (Menjalankan mesin TinyMCE) ---
    tinymce.init({
      license_key: 'gpl',
      promotion: false, // Menghilangkan pop-up upgrade
      branding: false, // Menghilangkan logo TinyMCE agar terlihat profesional
      selector: selector, // Siapa saja yang akan jadi editor? (dari daftar targetIds)
      height: 300,
      menubar: 'file edit view insert format tools table help',
      plugins: [
        'advlist',
        'autoresize',
        'lists',
        'link',
        'image',
        'table',
        'emoticons',
        'searchreplace',
        'visualblocks',
        'code',
        'wordcount',
      ],
      toolbar:
        'undo redo | blocks fontsize | forecolor backcolor | removeformat | bold italic underline | bullist numlist | outdent indent | alignleft aligncenter alignright alignjustify | quickimage table | emoticons | code',
      toolbar_mode: 'sliding',
      skin: 'oxide', // Tema tampilan toolbar
      content_css: 'default', // CSS dasar TinyMCE
      content_style: tinyMceStyle, // MENGGUNAKAN DESAIN INTERIOR KITA DI ATAS
      statusbar: true,

      // Fungsi yang dijalankan saat setiap editor mulai terbentuk
      setup(editor) {
        editor.on('init', () => {
          editorInstances.add(editor); // Simpan ke koleksi kita
          applyEditorTheme(editor); // Langsung sesuaikan tema

          console.log(
            `%c[Action] TinyMCE Editor Ready: ${editor.id} ✅`,
            'color: #8b5cf6; font-weight: bold;'
          );

          // Jika elemen HTML ditandai 'readonly', kunci editornya agar tidak bisa diketik
          const element = editor.getElement();
          if (element.hasAttribute('readonly')) {
            editor.mode.set('readonly');
          }
        });

        // Jika editor dihapus dari halaman, hapus juga dari koleksi kita
        editor.on('remove', () => {
          editorInstances.delete(editor);
        });
      },
    });

    console.log(
      '%c[System] Editor Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    console.error(
      '%c[Error] Editor Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }

  // --- TAHAP 4: SINKRONISASI TEMA (Mekanisme Otomatis) ---

  let syncScheduled = false;

  /**
   * FUNGSI: syncAllEditorThemes
   * Mengulangi perintah "Ganti Tema" ke seluruh editor yang sedang aktif.
   */
  function syncAllEditorThemes() {
    if (syncScheduled) return; // Cegah penumpukan tugas jika proses sebelumnya belum selesai
    syncScheduled = true;

    console.log(
      '%c[Action] Theme Change Detected! Syncing all editors... 🌓',
      'color: #8b5cf6; font-weight: bold;'
    );

    // Gunakan requestAnimationFrame agar sinkronisasi dilakukan saat browser sedang "santai" (tidak lag)
    requestAnimationFrame(() => {
      syncScheduled = false;
      editorInstances.forEach((editor) => {
        try {
          applyEditorTheme(editor);
        } catch (error) {
          console.warn(`[Warning] Gagal memperbarui theme TinyMCE "${editor.id}".`, error);
        }
      });
    });
  }

  /**
   * PENJAGA OTOMATIS: MutationObserver
   * Ini adalah "satpam" yang berdiri di depan elemen <html>.
   * Ia terus mengawasi apakah ada atribut 'data-theme' yang berubah (misal saat user klik switch mode).
   * Begitu ia melihat perubahan, ia langsung memanggil fungsi sinkronisasi tema.
   */
  const observer = new MutationObserver((mutations) => {
    // Cek apakah perubahan tersebut terjadi pada atribut 'data-theme'
    const themeChanged = mutations.some((mutation) => mutation.attributeName === 'data-theme');
    if (themeChanged) {
      syncAllEditorThemes();
    }
  });

  // Mulai mengawasi elemen utama website
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'], // Hanya awasi perubahan pada atribut ini saja
  });
});
